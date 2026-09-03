<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubjectController extends Controller
{
    public function index(): Response
    {
        $subjects = Subject::query()
            ->withCount(['units', 'quizzes'])
            ->with('units.materials:id,unit_id')
            ->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'name'            => $s->name,
                'slug'            => $s->slug,
                'description'     => $s->description,
                'icon'            => $s->icon,
                'color'           => $s->color,
                'is_active'       => $s->is_active,
                'units_count'     => $s->units_count,
                'materials_count' => $s->units->sum(fn ($u) => $u->materials->count()),
                'quizzes_count'   => $s->quizzes_count,
            ]);

        return Inertia::render('Admin/Subjects/Index', [
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255', 'unique:subjects,name'],
            'description' => ['nullable', 'string'],
            'icon'        => ['nullable', 'string', 'max:64'],
            'color'       => ['nullable', 'string', 'max:7'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        Subject::create([
            ...$validated,
            'slug'       => $this->uniqueSlug($validated['name']),
            'is_active'  => $validated['is_active'] ?? true,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('admin.subjects.index')->with('success', "Subject {$validated['name']} created.");
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['sometimes', 'required', 'string', 'max:255', 'unique:subjects,name,' . $subject->id],
            'description' => ['nullable', 'string'],
            'icon'        => ['nullable', 'string', 'max:64'],
            'color'       => ['nullable', 'string', 'max:7'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $data = collect($validated)->except('slug')->all();

        if (isset($validated['name']) && $validated['name'] !== $subject->name) {
            $data['slug'] = $this->uniqueSlug($validated['name'], $subject->id);
        }

        $subject->update($data);

        return redirect()->route('admin.subjects.index')->with('success', "Subject {$subject->name} updated.");
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $name = $subject->name;
        $subject->delete();

        return redirect()->route('admin.subjects.index')->with('success', "Subject {$name} deleted.");
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $base = $slug;
        $i = 2;

        while (Subject::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
