<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaterialCompletion;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\XpTransaction;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportController extends Controller
{
    public function index(): Response
    {
        $since7 = now()->subDays(7)->startOfDay();
        $since14 = now()->subDays(13)->startOfDay();

        $engagement = [
            'activeUsers7d'       => User::where('last_active_at', '>=', $since7)->count(),
            'materialsCompleted7d' => MaterialCompletion::where('created_at', '>=', $since7)->count(),
            'quizzesCompleted7d'   => QuizAttempt::where('status', 'completed')->where('completed_at', '>=', $since7)->count(),
            'xpAwarded7d'          => (int) XpTransaction::where('created_at', '>=', $since7)->sum('xp_amount'),
        ];

        $topStudents = User::role('student')
            ->orderByDesc('xp')
            ->limit(10)
            ->get(['id', 'name', 'avatar', 'xp', 'current_level', 'current_streak'])
            ->map(fn ($u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'avatar'         => $u->avatar,
                'xp'             => $u->xp,
                'current_level'  => $u->current_level,
                'current_streak' => $u->current_streak,
            ]);

        $subjectPopularity = \App\Models\MaterialCompletion::query()
            ->join('materials', 'material_completions.material_id', '=', 'materials.id')
            ->join('units', 'materials.unit_id', '=', 'units.id')
            ->join('subjects', 'units.subject_id', '=', 'subjects.id')
            ->selectRaw('subjects.id as subject_id, subjects.name as subject_name, subjects.icon as icon, subjects.color as color, COUNT(*) as completions')
            ->groupBy('subjects.id', 'subjects.name', 'subjects.icon', 'subjects.color')
            ->orderByDesc('completions')
            ->get()
            ->map(fn ($row) => [
                'subject_name' => $row->subject_name,
                'icon'         => $row->icon,
                'color'        => $row->color,
                'completions'  => (int) $row->completions,
            ]);

        $dailyActive = $this->dailyActive($since14);

        return Inertia::render('Admin/Reports', [
            'engagement'       => $engagement,
            'topStudents'      => $topStudents,
            'subjectPopularity' => $subjectPopularity,
            'dailyActive'      => $dailyActive,
        ]);
    }

    /**
     * Daily active users (by last_active_at), last 14 days.
     *
     * @return array<int, array{date: string, count: int}>
     */
    private function dailyActive($since14): array
    {
        $counts = User::where('last_active_at', '>=', $since14)
            ->selectRaw('DATE(last_active_at) as day, COUNT(DISTINCT id) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $days = [];
        for ($i = 13; $i >= 0; $i--) {
            $key = now()->subDays($i)->startOfDay()->toDateString();
            $days[] = [
                'date'  => $key,
                'count' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $days;
    }
}
