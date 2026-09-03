<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Events\QuizAttemptCompleted;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\XpTransaction;
use App\Services\QuizGradingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $weekStart = now()->startOfWeek();

        $quizzes = Quiz::published()
            ->with('subject:id,name,slug,icon,color')
            ->withCount('questions')
            ->orderBy('id')
            ->get();

        // Latest attempt per quiz for this user (single query, mapped by quiz_id)
        $latestAttempts = QuizAttempt::where('user_id', $user->id)
            ->whereIn('quiz_id', $quizzes->modelKeys())
            ->orderByDesc('id')
            ->get()
            ->groupBy('quiz_id')
            ->map(fn ($group) => $group->first());

        $quizzesData = $quizzes->map(function (Quiz $quiz) use ($latestAttempts) {
            $attempt = $latestAttempts->get($quiz->id);

            $status = 'available';
            if ($attempt && $attempt->status === 'completed') {
                // Below passing score → retry recommended
                $status = $attempt->score < $quiz->passing_score ? 'recommended' : 'completed';
            }

            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'difficulty' => $quiz->difficulty,
                'duration_minutes' => $quiz->duration_minutes,
                'xp_reward' => $quiz->xp_reward,
                'passing_score' => $quiz->passing_score,
                'questions_count' => $quiz->questions_count,
                'subject' => $quiz->subject ? [
                    'id' => $quiz->subject->id,
                    'name' => $quiz->subject->name,
                    'slug' => $quiz->subject->slug,
                    'icon' => $quiz->subject->icon,
                    'color' => $quiz->subject->color,
                ] : null,
                'status' => $status,
                'last_score' => $attempt?->score,
                'last_attempt_id' => $attempt?->id,
                'has_in_progress' => $attempt !== null && $attempt->status === 'in_progress',
            ];
        });

        // Weekly stats (this week, from Monday)
        $weeklyStats = [
            'quizzes_taken' => QuizAttempt::where('user_id', $user->id)
                ->where('status', 'completed')
                ->where('completed_at', '>=', $weekStart)
                ->count(),
            'avg_score' => round((float) QuizAttempt::where('user_id', $user->id)
                ->where('status', 'completed')
                ->where('completed_at', '>=', $weekStart)
                ->avg('score')),
            'xp_earned' => (int) XpTransaction::where('user_id', $user->id)
                ->where('created_at', '>=', $weekStart)
                ->sum('xp_amount'),
        ];

        return Inertia::render('Student/QuizList', [
            'quizzes' => $quizzesData,
            'weeklyStats' => $weeklyStats,
        ]);
    }

    public function start(Quiz $quiz)
    {
        abort_unless($quiz->is_published && $quiz->is_active, 404);

        $user = auth()->user();

        // Reuse an existing in-progress attempt (prevents duplicates)
        $attempt = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'in_progress')
            ->first();

        if (! $attempt) {
            $attempt = QuizAttempt::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'status' => 'in_progress',
                'started_at' => now(),
            ]);
        }

        return redirect()->route('student.quiz.take', ['quiz' => $quiz->id]);
    }

    public function take(Quiz $quiz)
    {
        abort_unless($quiz->is_published && $quiz->is_active, 404);

        $attempt = QuizAttempt::where('user_id', auth()->id())
            ->where('quiz_id', $quiz->id)
            ->where('status', 'in_progress')
            ->first();

        abort_if(! $attempt, 404);

        // Map manually — is_correct is NEVER sent to the client
        $questions = $quiz->questions()
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get()
            ->map(fn (Question $q) => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'type' => $q->type,
                'points' => $q->points,
                'options' => $q->options->map(fn (QuestionOption $o) => [
                    'id' => $o->id,
                    'option_text' => $o->option_text,
                ])->all(),
            ])
            ->all();

        return Inertia::render('Student/QuizTaking', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'difficulty' => $quiz->difficulty,
                'duration_minutes' => $quiz->duration_minutes,
                'passing_score' => $quiz->passing_score,
            ],
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at?->toISOString(),
            ],
            'questions' => $questions,
        ]);
    }

    public function submit(Request $request, Quiz $quiz)
    {
        abort_unless($quiz->is_published && $quiz->is_active, 404);

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'integer'],
            'time_spent_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $attempt = QuizAttempt::where('user_id', auth()->id())
            ->where('quiz_id', $quiz->id)
            ->where('status', 'in_progress')
            ->first();

        abort_if(! $attempt, 404);

        // Whitelist: only questions of this quiz + options belonging to that question
        $questionIds = $quiz->questions()->pluck('id');
        $optionsByQuestion = QuestionOption::whereIn('question_id', $questionIds)
            ->get()
            ->groupBy('question_id');

        DB::transaction(function () use ($validated, $attempt, $questionIds, $optionsByQuestion) {
            foreach ($validated['answers'] as $questionId => $optionId) {
                // Skip anything not belonging to this quiz
                if (! $questionIds->contains((int) $questionId)) {
                    continue;
                }

                $options = $optionsByQuestion->get((int) $questionId);
                if (! $options || ! $options->contains('id', (int) $optionId)) {
                    continue;
                }

                // Save answer WITHOUT is_correct — grading happens in QuizGradingService
                QuizAttemptAnswer::updateOrCreate(
                    [
                        'quiz_attempt_id' => $attempt->id,
                        'question_id' => (int) $questionId,
                    ],
                    [
                        'question_option_id' => (int) $optionId,
                    ]
                );
            }

            if (isset($validated['time_spent_seconds'])) {
                $attempt->time_spent_seconds = $validated['time_spent_seconds'];
                $attempt->save();
            }
        });

        // Auto-grade (sets score, status completed, is_correct on answers)
        $attempt = app(QuizGradingService::class)->gradeAttempt($attempt);

        // Fire gamification pipeline (XP, achievements, quests, streak, progress)
        event(new QuizAttemptCompleted(auth()->user(), $attempt->fresh()));

        return redirect()->route('student.quiz.result', ['attempt' => $attempt->id]);
    }

    public function result(QuizAttempt $attempt)
    {
        // Ownership check
        abort_unless($attempt->user_id === auth()->id(), 403);

        $attempt->load(['quiz:id,title,passing_score,xp_reward,subject_id', 'quiz.subject:id,name,slug,icon,color']);

        $review = $attempt->answers()
            ->with(['question:id,question_text,explanation,points', 'option:id,option_text', 'question.options:id,question_id,option_text,is_correct'])
            ->get()
            ->map(fn (QuizAttemptAnswer $a) => [
                'question_text' => $a->question->question_text,
                'selected_option_text' => $a->option?->option_text,
                'correct_option_text' => $a->question->options->firstWhere('is_correct', true)?->option_text,
                'is_correct' => $a->is_correct,
                'explanation' => $a->question->explanation,
            ])
            ->all();

        return Inertia::render('Student/QuizResult', [
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'earned_points' => $attempt->earned_points,
                'total_points' => $attempt->total_points,
                'status' => $attempt->status,
                'completed_at' => $attempt->completed_at?->toISOString(),
                'time_spent_seconds' => $attempt->time_spent_seconds,
            ],
            'quiz' => [
                'id' => $attempt->quiz->id,
                'title' => $attempt->quiz->title,
                'passing_score' => $attempt->quiz->passing_score,
                'xp_reward' => $attempt->quiz->xp_reward,
                'subject' => $attempt->quiz->subject ? [
                    'name' => $attempt->quiz->subject->name,
                    'slug' => $attempt->quiz->subject->slug,
                ] : null,
            ],
            'review' => $review,
        ]);
    }
}
