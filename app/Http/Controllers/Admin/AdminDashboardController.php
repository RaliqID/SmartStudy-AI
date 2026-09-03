<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Subject;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'totalUsers'         => User::count(),
            'totalStudents'     => User::role('student')->count(),
            'totalTeachers'     => User::role('teacher')->count(),
            'totalAdmins'       => User::role('admin')->count(),
            'totalQuizzes'      => Quiz::count(),
            'totalQuizAttempts' => QuizAttempt::count(),
            'totalSubjects'     => Subject::count(),
            'totalMaterials'    => Material::count(),
        ];

        $recentUsers = User::with('roles:name')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn ($u) => [
                'id'       => $u->id,
                'name'     => $u->name,
                'email'    => $u->email,
                'avatar'   => $u->avatar,
                'role'     => $u->roles->first()?->name,
                'is_active' => $u->is_active,
                'created_at' => $u->created_at?->toDateString(),
            ]);

        $weeklyActivity = $this->weeklyActivity();

        return Inertia::render('Admin/Dashboard', [
            'stats'         => $stats,
            'recentUsers'   => $recentUsers,
            'weeklyActivity' => $weeklyActivity,
        ]);
    }

    /**
     * Quiz attempts completed per day, last 7 days.
     *
     * @return array<int, array{date: string, count: int}>
     */
    private function weeklyActivity(): array
    {
        $start = now()->subDays(6)->startOfDay();

        $counts = QuizAttempt::where('status', 'completed')
            ->where('completed_at', '>=', $start)
            ->selectRaw('DATE(completed_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $day   = now()->subDays($i)->startOfDay();
            $key   = $day->toDateString();
            $days[] = [
                'date'  => $key,
                'count' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $days;
    }
}
