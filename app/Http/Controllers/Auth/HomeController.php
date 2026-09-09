<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\Subject;
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
            'stats' => [
                'subjects' => Subject::where('is_active', true)->whereNotNull('color')->count(),
                'materials' => Material::count(),
                'quizzes' => Quiz::count(),
                'achievements' => Achievement::count(),
            ],
            'subjects' => Subject::where('is_active', true)
                ->whereNotNull('color')
                ->select(['name', 'slug', 'color', 'icon', 'description'])
                ->orderBy('name')
                ->get(),
            'achievements' => Achievement::query()
                ->select(['name', 'description', 'icon', 'xp_reward'])
                ->orderBy('xp_reward')
                ->limit(4)
                ->get(),
        ]);
    }
}
