<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\MaterialCompletion;
use App\Models\StudentProgress;
use App\Models\Schedule;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\XpTransaction;
use App\Services\AI\AiTutorService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $today = Carbon::today();

        // user prop — name, current_level, current_streak, xp
        $userProp = [
            'name' => $user->name,
            'current_level' => (int) $user->current_level,
            'current_streak' => (int) $user->current_streak,
            'xp' => (int) $user->xp,
        ];

        // continueLearning: subject with lowest mastery → first active unit →
        // first active material NOT yet completed. Null kalau semua selesai.
        $continueLearning = null;

        $progressRows = StudentProgress::where('user_id', $user->id)
            ->with('subject')
            ->orderBy('mastery_percentage')
            ->get();

        $completedMaterialIds = MaterialCompletion::where('user_id', $user->id)
            ->pluck('material_id');

        foreach ($progressRows as $progress) {
            $subject = $progress->subject;
            if (! $subject) {
                continue;
            }

            $unit = $subject->units()->active()->orderBy('order_index')->first();
            if (! $unit) {
                continue;
            }

            $material = $unit->materials()->active()
                ->whereNotIn('materials.id', $completedMaterialIds)
                ->orderBy('order_index')
                ->first();

            if ($material) {
                $continueLearning = [
                    'subject' => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'slug' => $subject->slug,
                        'icon' => $subject->icon,
                        'color' => $subject->color,
                    ],
                    'unit' => [
                        'id' => $unit->id,
                        'title' => $unit->title,
                    ],
                    'material' => [
                        'id' => $material->id,
                        'title' => $material->title,
                    ],
                    'progress' => (float) $progress->mastery_percentage,
                ];
                break;
            }
        }

        // aiRecommendation — cached 30 min, fallback statis kalau AI gagal
        $aiRecommendation = Cache::remember('ai_rec_' . $user->id, 1800, function () use ($user) {
            try {
                $context = sprintf(
                    'Student name: %s. Subjects with progress: %d. Overall average mastery: %s%%.',
                    $user->name,
                    StudentProgress::where('user_id', $user->id)->count(),
                    StudentProgress::where('user_id', $user->id)->avg('mastery_percentage') ?? 0
                );

                return app(AiTutorService::class)->learningRecommendation($context);
            } catch (\Exception $e) {
                return 'Review your weakest subject today!';
            }
        });

        // dailyGoal — MaterialCompletion user hari ini
        $materialsToday = MaterialCompletion::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->count();
        $dailyGoal = [
            'completed' => $materialsToday,
            'target' => 5,
        ];

        // overallProgress — rata-rata mastery
        $overallProgress = (float) StudentProgress::where('user_id', $user->id)
            ->avg('mastery_percentage') ?? 0;

        // recentQuiz — attempt completed terakhir
        $recentAttempt = QuizAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->with('quiz:id,title')
            ->first();

        $recentQuiz = $recentAttempt ? [
            'title' => $recentAttempt->quiz->title,
            'score' => $recentAttempt->score,
            'completed_at' => $recentAttempt->completed_at?->toISOString(),
        ] : null;

        // upcoming — 3 schedule terdekat (event_date >= today)
        $upcoming = Schedule::where('user_id', $user->id)
            ->where('is_active', true)
            ->whereDate('event_date', '>=', $today)
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->limit(3)
            ->with('subject:id,name')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'start_time' => $s->start_time,
                'event_type' => $s->event_type,
                'subject_name' => $s->subject?->name,
                'event_date' => $s->event_date->toDateString(),
            ]);

        // leaderboardTop — top 5 all-time by xp column
        $topUsers = User::where('xp', '>', 0)
            ->orderByDesc('xp')
            ->limit(5)
            ->get(['id', 'name', 'avatar', 'xp']);

        $leaderboardTop = $topUsers->values()->map(fn (User $u, int $i) => [
            'rank' => $i + 1,
            'name' => $u->name,
            'avatar' => $u->avatar,
            'xp' => (int) $u->xp,
            'is_you' => $u->id === $user->id,
        ]);

        return Inertia::render('Student/Dashboard', [
            'user' => $userProp,
            'continueLearning' => $continueLearning,
            'aiRecommendation' => $aiRecommendation,
            'dailyGoal' => $dailyGoal,
            'overallProgress' => round($overallProgress, 1),
            'recentQuiz' => $recentQuiz,
            'upcoming' => $upcoming,
            'leaderboardTop' => $leaderboardTop,
        ]);
    }
}
