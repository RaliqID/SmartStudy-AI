<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $role   = $request->string('role')->trim()->toString();

        $query = User::query()->with('roles:name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (in_array($role, ['student', 'teacher', 'admin'], true)) {
            $query->role($role);
        }

        $users = $query->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'avatar'     => $u->avatar,
                'role'       => $u->roles->first()?->name,
                'is_active'  => $u->is_active,
                'xp'         => $u->xp,
                'created_at' => $u->created_at?->toDateString(),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'roles'   => ['student', 'teacher', 'admin'],
            'filters' => ['search' => $search, 'role' => $role],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'in:student,teacher,admin'],
        ]);

        $user = User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'email_verified_at' => now(),
            'is_active'         => true,
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('admin.users.index')->with('success', "User {$user->name} created as {$validated['role']}.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role'     => ['required', 'in:student,teacher,admin'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $user->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        $currentRole = $user->roles->first()?->name ?? 'student';
        if ($validated['role'] !== $currentRole) {
            // Prevent admin from demoting themselves to non-admin
            if ($user->id === auth()->id() && $validated['role'] !== 'admin') {
                return back()->with('error', 'You cannot change your own admin role.');
            }
            $user->syncRoles([$validated['role']]);
        }

        return redirect()->route('admin.users.index')->with('success', "User {$user->name} updated.");
    }

    public function toggleActive(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "User {$user->name} {$status}.");
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Guard: jangan hapus admin terakhir
        if ($user->hasRole('admin') && User::role('admin')->where('is_active', true)->count() <= 1) {
            return back()->with('error', 'You cannot delete the last active admin.');
        }

        // Soft delete — preserve data (classes, quizzes, progress) daripada cascade hard delete
        $name = $user->name;
        $user->update(['is_active' => false]);
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', "User {$name} deactivated and archived. Their classes and quizzes are preserved.");
    }

    /**
     * Invite a Teacher or Admin — no public registration for these roles.
     * Creates the account with a temporary password; the invitee sets
     * their own password via the standard reset flow on first login.
     */
    public function invite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role'  => ['required', 'in:teacher,admin'],
        ]);

        $tempPassword = Str::random(10);

        DB::beginTransaction();

        try {
            $user = User::create([
                'name'              => Str::before($validated['email'], '@'),
                'email'             => $validated['email'],
                'password'          => Hash::make($tempPassword),
                'email_verified_at' => now(), // verified by admin invitation
                'is_active'         => true,
            ]);

            $user->assignRole($validated['role']);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to create invitation. Please try again.');
        }

        // Send set-password link via standard broker (stores hashed token in
        // password_reset_tokens, sends email with reset link).
        $status = Password::sendResetLink(['email' => $validated['email']]);

        if ($status !== Password::RESET_LINK_SENT) {
            return back()->with('error', "Account created as {$validated['role']}, but the set-password email failed to send: " . __($status));
        }

        return redirect()->route('admin.users.index')->with('success', "Invitation sent to {$validated['email']} as {$validated['role']}.");
    }
}
