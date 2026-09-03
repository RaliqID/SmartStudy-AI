<?php

namespace App\Listeners;

use App\Events\QuizAttemptCompleted;
use App\Models\XpTransaction;
use App\Services\LevelService;
use Illuminate\Support\Facades\Log;

class AwardXpForQuiz
{
    public function handle(QuizAttemptCompleted $event): void
    {
        $user = $event->user;
        $attempt = $event->attempt;
        $quiz = $attempt->quiz;

        // Base XP from quiz, plus bonus for high score
        $baseXp = $quiz->xp_reward ?? 50;
        $score = $attempt->score ?? 0;

        $bonus = 0;
        if ($score >= 90) $bonus = 20;
        elseif ($score >= 70) $bonus = 10;

        $totalXp = $baseXp + $bonus;

        // Add XP to user
        $user->xp += $totalXp;
        $user->save();

        // Log transaction
        XpTransaction::create([
            'user_id' => $user->id,
            'source_type' => 'quiz_completed',
            'source_id' => $attempt->id,
            'xp_amount' => $totalXp,
        ]);

        // Recalculate level (level up notification handled inside)
        app(LevelService::class)->recalculate($user);

        Log::info('XP awarded for quiz', [
            'user' => $user->id,
            'attempt' => $attempt->id,
            'xp' => $totalXp,
            'score' => $score,
        ]);
    }
}