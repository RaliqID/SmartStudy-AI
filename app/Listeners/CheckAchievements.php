<?php

namespace App\Listeners;

use App\Events\QuizAttemptCompleted;
use App\Models\Achievement;
use App\Models\UserAchievement;
use Illuminate\Support\Facades\DB;

class CheckAchievements
{
    public function handle(QuizAttemptCompleted $event): void
    {
        $user = $event->user;
        $attempt = $event->attempt;

        // Get all achievements not yet unlocked by this user
        $unlockedIds = UserAchievement::where('user_id', $user->id)->pluck('achievement_id')->toArray();
        $achievements = Achievement::whereNotIn('id', $unlockedIds)->get();

        foreach ($achievements as $ach) {
            $unlocked = false;

            switch ($ach->type) {
                case 'count':
                    // Count-based: condition_key is a model attribute (e.g., quizzes_completed)
                    $progress = $this->getUserProgress($user, $ach->condition_key);
                    if ($progress >= $ach->condition_value) {
                        $unlocked = true;
                    }
                    break;

                case 'score':
                    // Score-based: check if any quiz attempt has score >= condition_value
                    if ($ach->condition_key === 'quiz_score') {
                        $best = $user->quizAttempts()->max('score');
                        if ($best && $best >= $ach->condition_value) {
                            $unlocked = true;
                        }
                    }
                    break;

                case 'streak':
                    if ($ach->condition_key === 'current_streak') {
                        if ($user->current_streak >= $ach->condition_value) {
                            $unlocked = true;
                        }
                    }
                    break;

                case 'xp':
                    if ($ach->condition_key === 'total_xp') {
                        if ($user->xp >= $ach->condition_value) {
                            $unlocked = true;
                        }
                    }
                    break;
            }

            if ($unlocked) {
                $this->unlockAchievement($user, $ach);
            }
        }
    }

    protected function getUserProgress($user, $key)
    {
        // Simple: for quizzes_completed, count from quiz_attempts
        if ($key === 'quizzes_completed') {
            return $user->quizAttempts()->where('status', 'completed')->count();
        }
        return 0;
    }

    protected function unlockAchievement($user, $achievement)
    {
        DB::transaction(function () use ($user, $achievement) {
            UserAchievement::create([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'unlocked_at' => now(),
            ]);

            // Award XP
            if ($achievement->xp_reward > 0) {
                $user->xp += $achievement->xp_reward;
                $user->save();
            }

            // Create notification
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'type' => 'achievement_unlocked',
                'title' => "Achievement Unlocked: {$achievement->name}",
                'body' => $achievement->description,
                'icon' => $achievement->icon ?? 'emoji_events',
                'action_url' => route('student.progress'),
            ]);
        });
    }
}