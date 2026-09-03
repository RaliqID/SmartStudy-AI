<?php

namespace App\Listeners;

use App\Events\QuizAttemptCompleted;
use App\Events\MaterialCompleted;
use App\Events\UserLoggedIn;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class UpdateStreak
{
    public function handleQuizCompleted(QuizAttemptCompleted $event): void
    {
        $this->updateStreak($event->user);
    }

    public function handleMaterialCompleted(MaterialCompleted $event): void
    {
        $this->updateStreak($event->user);
    }

    public function handleUserLoggedIn(UserLoggedIn $event): void
    {
        $this->updateStreak($event->user);
    }

    protected function updateStreak(User $user): void
    {
        $today = now()->toDateString();
        $lastActive = $user->last_active_at;

        // If already active today, skip
        if ($lastActive && $lastActive->toDateString() === $today) {
            return;
        }

        $yesterday = now()->subDay()->toDateString();

        if (!$lastActive) {
            // First activity ever
            $user->current_streak = 1;
        } elseif ($lastActive->toDateString() === $yesterday) {
            // Consecutive day
            $user->current_streak += 1;
        } else {
            // Gap > 1 hari — coba Streak Freeze (opsional 4, gratis 2x/bulan)
            $freeze = app(\App\Services\StreakFreezeService::class)
                ->tryUseFreeze($user, $today, $lastActive->toDateString());

            if ($freeze) {
                // Freeze menutup gap — streak lanjut
                $user->current_streak += 1;
            } else {
                // Kuota freeze habis — streak reset
                $user->current_streak = 1;
            }
        }

        // Update longest streak
        if ($user->current_streak > $user->longest_streak) {
            $user->longest_streak = $user->current_streak;
        }

        $user->last_active_at = now();
        $user->save();

        Log::info('Streak updated', [
            'user' => $user->id,
            'current' => $user->current_streak,
            'longest' => $user->longest_streak,
        ]);
    }
}