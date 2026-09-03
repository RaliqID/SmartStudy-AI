<?php

namespace App\Events;

use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dipatch setelah quiz attempt selesai dinilai (grading).
 * Trigger: UpdateStudentProgress, CheckAchievements, UpdateDailyQuestProgress, UpdateStreak.
 */
class QuizAttemptCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public QuizAttempt $attempt,
    ) {}
}
