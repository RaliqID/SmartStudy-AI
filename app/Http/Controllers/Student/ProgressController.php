<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\DailyQuest;
use App\Models\Schedule;
use App\Models\StudentProgress;
use App\Models\QuizAttempt;
use App\Models\XpTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProgressController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Overall average mastery
        $overall = (float) StudentProgress::where('user_id', $user->id)->avg('mastery_percentage') ?? 0;

        // Avg quiz score (completed attempts)
        $avgScore = (float) QuizAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->avg('score') ?? 0;

        // Streak from users table
        $streak = [
            'current' => (int) $user->current_streak,
            'longest' => (int) $user->longest_streak,
        ];

        // Subject mastery: load progress with subject
        $subjectMastery = StudentProgress::where('user_id', $user->id)
            ->with('subject:id,name,slug,icon,color')
            ->get()
            ->map(fn ($p) => [
                'subject_id' => $p->subject_id,
                'name' => $p->subject ? $p->subject->name : 'Unknown',
                'icon' => $p->subject ? $p->subject->icon : null,
                'color' => $p->subject ? $p->subject->color : null,
                'mastery_percentage' => (float) $p->mastery_percentage,
                'materials_completed' => $p->materials_completed,
                'quizzes_completed' => $p->quizzes_completed,
                'average_score' => (float) $p->average_score,
                'time_spent' => (float) $p->time_spent_minutes,
                'last_accessed' => $p->last_accessed_at?->toISOString(),
            ]);

        // Streak calendar: last 30 days
        $days = collect(range(0, 29))->map(fn ($i) => Carbon::today()->subDays($i)->toDateString());
        // Query activities: XP transactions, completed quizzes, schedules with is_completed or event_date
        $activityDates = collect();

        // XP transactions
        $xpDates = XpTransaction::where('user_id', $user->id)
            ->whereDate('created_at', '>=', Carbon::today()->subDays(29))
            ->select(DB::raw('DATE(created_at) as date'))
            ->distinct()
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString());

        // Completed quiz attempts
        $quizDates = QuizAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereDate('completed_at', '>=', Carbon::today()->subDays(29))
            ->select(DB::raw('DATE(completed_at) as date'))
            ->distinct()
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString());

        // Schedules (completed or any event on that day)
        $scheduleDates = Schedule::where('user_id', $user->id)
            ->whereDate('event_date', '>=', Carbon::today()->subDays(29))
            ->select(DB::raw('DATE(event_date) as date'))
            ->distinct()
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString());

        $activityDates = $xpDates->merge($quizDates)->merge($scheduleDates)->unique();

        $calendar = $days->map(fn ($day) => [
            'date' => $day,
            'active' => $activityDates->contains($day),
        ])->values();

        // Achievements with unlocked status
        $allAchievements = Achievement::all();

        $userAchievements = DB::table('user_achievements')
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('achievement_id');

        $achievements = $allAchievements->map(fn ($a) => [
            'id' => $a->id,
            'name' => $a->name,
            'description' => $a->description,
            'icon' => $a->icon,
            'category' => $a->category,
            'xp_reward' => $a->xp_reward,
            'unlocked_at' => $userAchievements[$a->id]->unlocked_at ?? null,
            'is_unlocked' => $userAchievements->has($a->id),
        ]);

        // Daily quests for today
        $today = Carbon::today()->toDateString();
        $quests = DailyQuest::where('is_active', true)->get();
        $userQuestData = DB::table('user_daily_quests')
            ->where('user_id', $user->id)
            ->where('quest_date', $today)
            ->get()
            ->keyBy('daily_quest_id');

        $questsData = $quests->map(fn ($q) => [
            'id' => $q->id,
            'name' => $q->name,
            'description' => $q->description,
            'icon' => $q->icon,
            'target_value' => $q->target_value,
            'xp_reward' => $q->xp_reward,
            'progress' => (int) ($userQuestData[$q->id]->progress ?? 0),
            'is_completed' => (bool) ($userQuestData[$q->id]->is_completed ?? false),
        ]);

        return Inertia::render('Student/Progress', [
            'overall' => round($overall, 1),
            'avgScore' => round($avgScore, 1),
            'streak' => $streak,
            'subjectMastery' => $subjectMastery,
            'streakCalendar' => $calendar,
            'achievements' => $achievements,
            'quests' => $questsData,
        ]);
    }
}