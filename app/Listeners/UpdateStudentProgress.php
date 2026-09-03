<?php

namespace App\Listeners;

use App\Events\QuizAttemptCompleted;
use App\Models\StudentProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateStudentProgress
{
    /**
     * Handle the event.
     * Update mastery_percentage, average_score, quizzes_completed for the subject.
     */
    public function handle(QuizAttemptCompleted $event): void
    {
        $user = $event->user;
        $attempt = $event->attempt;
        $quiz = $attempt->quiz;
        $subjectId = $quiz->subject_id;

        if (!$subjectId) {
            return;
        }

        DB::transaction(function () use ($user, $subjectId, $attempt) {
            $progress = StudentProgress::firstOrNew([
                'user_id' => $user->id,
                'subject_id' => $subjectId,
            ]);

            // Increment quizzes completed
            $progress->quizzes_completed = ($progress->quizzes_completed ?? 0) + 1;

            // Update average score (weighted)
            $oldAvg = $progress->average_score ?? 0;
            $completedCount = $progress->quizzes_completed;
            $newScore = $attempt->score ?? 0;

            // Recalculate average: (oldAvg * (completedCount - 1) + newScore) / completedCount
            if ($completedCount > 0) {
                $newAvg = (($oldAvg * ($completedCount - 1)) + $newScore) / $completedCount;
                $progress->average_score = round($newAvg, 2);
            } else {
                $progress->average_score = $newScore;
            }

            // Update mastery (simplified: use average score as mastery)
            $progress->mastery_percentage = min($progress->average_score, 100);

            $progress->last_accessed_at = now();
            $progress->save();

            Log::info('Student progress updated', [
                'user' => $user->id,
                'subject' => $subjectId,
                'quizzes_completed' => $progress->quizzes_completed,
                'avg_score' => $progress->average_score,
                'mastery' => $progress->mastery_percentage,
            ]);
        });
    }
}