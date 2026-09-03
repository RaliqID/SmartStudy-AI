<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

/**
 * SmartStudy AI — Home page.
 * Guest: landing. Auth: redirect by role.
 */
class HomeController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        $user = Auth::user();

        if ($user && $user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }

        if ($user && $user->hasRole('teacher')) {
            return redirect()->route('teacher.dashboard');
        }

        if ($user) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }
}
