<?php

namespace App\Services;

use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuizGradingService
{
    /**
     * Grade a quiz attempt (auto-grade).
     * Returns calculated score, earned points, and updates attempt record.
     */
    public function gradeAttempt(QuizAttempt $attempt): QuizAttempt
    {
        return DB::transaction(function () use ($attempt) {
            $totalPoints = 0;
            $earnedPoints = 0;
            $correctCount = 0;
            $totalQuestions = $attempt->quiz->questions()->count();

            // Load answers with their question and selected option
            $answers = $attempt->answers()->with(['question', 'option'])->get();

            foreach ($answers as $answer) {
                $question = $answer->question;
                $points = $question->points ?? 10;
                $totalPoints += $points;

                $isCorrect = false;

                if ($question->type === 'multiple_choice') {
                    // Check if selected option is correct
                    if ($answer->question_option_id) {
                        $option = $answer->option;
                        if ($option && $option->is_correct) {
                            $isCorrect = true;
                        }
                    }
                } elseif ($question->type === 'true_false') {
                    // Compare answer_text with correct option's text
                    $correctOption = $question->options()->where('is_correct', true)->first();
                    if ($correctOption && $answer->answer_text === $correctOption->option_text) {
                        $isCorrect = true;
                    }
                }

                $answer->is_correct = $isCorrect;
                $answer->points_earned = $isCorrect ? $points : 0;
                $answer->save();

                if ($isCorrect) {
                    $earnedPoints += $points;
                    $correctCount++;
                }
            }

            // Calculate score as percentage
            $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;

            $attempt->score = $score;
            $attempt->total_points = $totalPoints;
            $attempt->earned_points = $earnedPoints;
            $attempt->status = 'completed';
            $attempt->completed_at = now();
            $attempt->time_spent_seconds = $attempt->time_spent_seconds ?? 0; // can be set via frontend
            $attempt->save();

            Log::info('Quiz graded', [
                'attempt_id' => $attempt->id,
                'score' => $score,
                'correct' => $correctCount,
                'total' => $totalQuestions,
                'earned' => $earnedPoints,
                'total_points' => $totalPoints,
            ]);

            return $attempt;
        });
    }
}