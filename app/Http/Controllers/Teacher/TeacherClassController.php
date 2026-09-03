<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Klass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TeacherClassController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $classes = Klass::where('teacher_id', $user->id)
            ->withCount('students')
            ->with('subject:id,name,icon,color')
            ->get()
            ->map(fn ($k) => [
                'id'             => $k->id,
                'name'           => $k->name,
                'description'    => $k->description,
                'join_code'      => $k->join_code,
                'is_active'      => $k->is_active,
                'students_count' => $k->students_count,
                'subject'        => $k->subject ? ['id' => $k->subject->id, 'name' => $k->subject->name, 'icon' => $k->subject->icon, 'color' => $k->subject->color] : null,
            ]);

        $subjects = Subject::active()->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Teacher/ClassList', [
            'classes'  => $classes,
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'subject_id'  => ['required', 'exists:subjects,id'],
        ]);

        Klass::create([
            ...$validated,
            'teacher_id'  => Auth::id(),
            'join_code'   => Str::upper(Str::random(8)),
            'is_active'   => true,
        ]);

        return redirect()->route('teacher.classes.index')->with('success', 'Class created. Share the join code with students!');
    }

    public function show(Klass $class)
    {
        abort_unless($class->teacher_id === Auth::id(), 403);

        $class->load(['students:id,name,email,avatar,created_at', 'subject:id,name,icon,color']);

        $studentIds = $class->students->pluck('id');
        $progress   = \App\Models\StudentProgress::whereIn('user_id', $studentIds)->get();

        $studentData = $class->students->map(function ($student) use ($progress) {
            $studentProgress = $progress->where('user_id', $student->id);
            return [
                'id'      => $student->id,
                'name'    => $student->name,
                'email'   => $student->email,
                'avatar'  => $student->avatar,
                'enrolled_at' => $student->created_at->toDateString(),
                'avg_mastery' => $studentProgress->count() > 0 ? round($studentProgress->avg('mastery_percentage')) : 0,
                'avg_score'   => $studentProgress->count() > 0 ? round($studentProgress->avg('average_score')) : 0,
                'quizzes_taken' => $studentProgress->sum('quizzes_completed'),
            ];
        });

        return Inertia::render('Teacher/ClassDetail', [
            'klass' => [
                'id'        => $class->id,
                'name'      => $class->name,
                'description' => $class->description,
                'join_code' => $class->join_code,
                'is_active' => $class->is_active,
                'subject'   => $class->subject ? ['id' => $class->subject->id, 'name' => $class->subject->name, 'icon' => $class->subject->icon, 'color' => $class->subject->color] : null,
            ],
            'students' => $studentData,
        ]);
    }

    public function addStudent(Request $request, Klass $class)
    {
        abort_unless($class->teacher_id === Auth::id(), 403);

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $student = User::where('email', $validated['email'])->first();

        if (!$student->hasRole('student')) {
            return back()->withErrors(['email' => 'This user is not a student.'])->withInput();
        }

        if ($class->students()->where('user_id', $student->id)->exists()) {
            return back()->withErrors(['email' => 'Student is already in this class.'])->withInput();
        }

        $class->students()->attach($student->id);

        return redirect()->route('teacher.classes.show', $class->id)->with('success', "{$student->name} added to the class.");
    }

    public function removeStudent(Klass $class, User $student)
    {
        abort_unless($class->teacher_id === Auth::id(), 403);

        $class->students()->detach($student->id);

        return redirect()->route('teacher.classes.show', $class->id)->with('success', "{$student->name} removed from the class.");
    }
}
