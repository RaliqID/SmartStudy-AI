<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Klass;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Quiz;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeacherQuizController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $quizzes = Quiz::where('created_by', $user->id)
            ->withCount(['questions', 'attempts'])
            ->with('subject:id,name,icon,color')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($q) => [
                'id'               => $q->id,
                'title'            => $q->title,
                'difficulty'       => $q->difficulty,
                'duration_minutes' => $q->duration_minutes,
                'xp_reward'        => $q->xp_reward,
                'passing_score'    => $q->passing_score,
                'is_published'     => $q->is_published,
                'questions_count'  => $q->questions_count,
                'attempts_count'   => $q->attempts_count,
                'subject'          => $q->subject ? ['id' => $q->subject->id, 'name' => $q->subject->name, 'color' => $q->subject->color] : null,
            ]);

        return Inertia::render('Teacher/QuizList', [
            'quizzes' => $quizzes,
        ]);
    }

    public function create()
    {
        $subjects = Subject::active()->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Teacher/CreateQuiz', [
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'subject_id'       => ['required', 'exists:subjects,id'],
            'difficulty'       => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:180'],
            'xp_reward'        => ['required', 'integer', 'min:0', 'max:1000'],
            'passing_score'    => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $quiz = Quiz::create([
            ...$validated,
            'created_by'   => Auth::id(),
            'is_published' => false,
            'is_active'    => true,
        ]);

        return redirect()->route('teacher.quizzes.edit', $quiz->id);
    }

    public function edit(Quiz $quiz)
    {
        abort_unless($quiz->created_by === Auth::id(), 403);

        $quiz->load(['questions.options', 'subject:id,name,icon,color']);
        $subjects = Subject::active()->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Teacher/EditQuiz', [
            'quiz' => [
                'id'               => $quiz->id,
                'title'            => $quiz->title,
                'description'      => $quiz->description,
                'subject_id'       => $quiz->subject_id,
                'subject'          => $quiz->subject ? ['name' => $quiz->subject->name, 'color' => $quiz->subject->color] : null,
                'difficulty'       => $quiz->difficulty,
                'duration_minutes' => $quiz->duration_minutes,
                'xp_reward'        => $quiz->xp_reward,
                'passing_score'    => $quiz->passing_score,
                'is_published'     => $quiz->is_published,
                'questions'        => $quiz->questions->map(fn ($q) => [
                    'id'            => $q->id,
                    'question_text' => $q->question_text,
                    'type'          => $q->type,
                    'explanation'   => $q->explanation,
                    'points'        => $q->points,
                    'options'       => $q->options->map(fn ($o) => [
                        'id'          => $o->id,
                        'option_text' => $o->option_text,
                        'is_correct'  => $o->is_correct,
                    ]),
                ]),
            ],
            'subjects' => $subjects,
        ]);
    }

    public function update(Request $request, Quiz $quiz)
    {
        abort_unless($quiz->created_by === Auth::id(), 403);

        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'subject_id'       => ['required', 'exists:subjects,id'],
            'difficulty'       => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:180'],
            'xp_reward'        => ['required', 'integer', 'min:0', 'max:1000'],
            'passing_score'    => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $quiz->update($validated);

        return redirect()->route('teacher.quizzes.edit', $quiz->id)->with('success', 'Quiz updated.');
    }

    public function storeQuestion(Request $request, Quiz $quiz)
    {
        abort_unless($quiz->created_by === Auth::id(), 403);

        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'type'          => ['required', Rule::in(['multiple_choice'])],
            'explanation'   => ['nullable', 'string'],
            'points'        => ['nullable', 'integer', 'min:1', 'max:100'],
            'options'                   => ['required', 'array', 'min:2', 'max:6'],
            'options.*.option_text'     => ['required', 'string', 'max:500'],
            'options.*.is_correct'      => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($validated, $quiz) {
            $orderIndex = $quiz->questions()->max('order_index') + 1;

            $question = Question::create([
                'quiz_id'       => $quiz->id,
                'question_text' => $validated['question_text'],
                'type'          => $validated['type'],
                'explanation'   => $validated['explanation'] ?? null,
                'points'        => $validated['points'] ?? 1,
                'order_index'   => $orderIndex,
                'is_active'     => true,
            ]);

            foreach ($validated['options'] as $i => $option) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'option_text' => $option['option_text'],
                    'is_correct'  => (bool) ($option['is_correct'] ?? false),
                    'order_index' => $i + 1,
                ]);
            }
        });

        return redirect()->route('teacher.quizzes.edit', $quiz->id)->with('success', 'Question added.');
    }

    public function destroyQuestion(Quiz $quiz, Question $question)
    {
        abort_unless($quiz->created_by === Auth::id(), 403);
        abort_unless($question->quiz_id === $quiz->id, 403);

        $question->options()->delete();
        $question->delete();

        return redirect()->route('teacher.quizzes.edit', $quiz->id)->with('success', 'Question removed.');
    }

    public function publish(Quiz $quiz)
    {
        abort_unless($quiz->created_by === Auth::id(), 403);

        $quiz->update(['is_published' => ! $quiz->is_published]);

        return back()->with('success', $quiz->is_published ? 'Quiz published.' : 'Quiz unpublished.');
    }

    public function destroy(Quiz $quiz)
    {
        abort_unless($quiz->created_by === Auth::id(), 403);

        DB::transaction(function () use ($quiz) {
            foreach ($quiz->questions as $question) {
                $question->options()->delete();
            }
            $quiz->questions()->delete();
            $quiz->delete();
        });

        return redirect()->route('teacher.quizzes.index')->with('success', 'Quiz deleted.');
    }
}
