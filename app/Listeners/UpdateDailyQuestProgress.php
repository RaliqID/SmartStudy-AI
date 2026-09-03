<?php

namespace App\Listeners;

use App\Events\QuizAttemptCompleted;
use App\Events\MaterialCompleted;
use App\Models\UserDailyQuest;
use App\Models\DailyQuest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateDailyQuestProgress
{
    public function handleQuizCompleted(QuizAttemptCompleted $event): void
    {
        $this->updateProgress($event->user, 'quizzes_completed', 1);
    }

    public function handleMaterialCompleted(MaterialCompleted $event): void
    {
        $this->updateProgress($event->user, 'materials_completed', 1);
    }

    protected function updateProgress($user, $targetKey, $increment = 1): void
    {
        $today = now()->toDateString();

        // Find active daily quests for today that match target_key
        $quests = DailyQuest::where('is_active', true)
            ->where('target_key', $targetKey)
            ->get();

        foreach ($quests as $quest) {
            // Atomic find-or-create with unique guard
            try {
                $userQuest = UserDailyQuest::firstOrCreate([
                    'user_id' => $user->id,
                    'daily_quest_id' => $quest->id,
                    'quest_date' => $today,
                ], [
                    'progress' => 0,
                    'is_completed' => false,
                    'xp_awarded' => 0,
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                // Race: another event inserted same row concurrently — re-fetch
                $userQuest = UserDailyQuest::where('user_id', $user->id)
                    ->where('daily_quest_id', $quest->id)
                    ->where('quest_date', $today)
                    ->first();

                if (! $userQuest) {
                    Log::warning('UserDailyQuest insert race, skipping', [
                        'user' => $user->id,
                        'quest' => $quest->id,
                    ]);
                    continue;
                }
            }

            // If already completed, skip
            if ($userQuest->is_completed) {
                continue;
            }

            // Increment progress
            $userQuest->progress += $increment;

            // Check completion
            if ($userQuest->progress >= $quest->target_value) {
                $userQuest->is_completed = true;
                $userQuest->progress = $quest->target_value; // cap

                // Award XP
                $xp = $quest->xp_reward ?? 25;
                $userQuest->xp_awarded = $xp;
                $user->xp += $xp;
                $user->save();

                // Create notification
                \App\Models\Notification::create([
                    'user_id' => $user->id,
                    'type' => 'quest_completed',
                    'title' => "Daily Quest Complete: {$quest->name}",
                    'body' => "You earned {$xp} XP!",
                    'icon' => $quest->icon ?? 'check_circle',
                ]);

                Log::info('Daily quest completed', [
                    'user' => $user->id,
                    'quest' => $quest->id,
                    'xp' => $xp,
                ]);
            }

            $userQuest->save();
        }
    }
}