<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Klass;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeacherReportController extends Controller
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
                'students_count' => $k->students_count,
                'subject'        => $k->subject ? ['name' => $k->subject->name, 'color' => $k->subject->color] : null,
            ]);

        return Inertia::render('Teacher/Reports', [
            'classes' => $classes,
        ]);
    }

    public function show(Klass $class)
    {
        abort_unless($class->teacher_id === Auth::id(), 403);

        $class->load(['students:id,name,email,avatar', 'subject:id,name']);

        $studentIds = $class->students->pluck('id');
        $progress = \App\Models\StudentProgress::whereIn('user_id', $studentIds)
            ->with('subject:id,name,color')
            ->get();

        $rows = $class->students->map(function ($student) use ($progress) {
            $sp = $progress->where('user_id', $student->id);

            return [
                'id'         => $student->id,
                'name'       => $student->name,
                'email'      => $student->email,
                'avatar'     => $student->avatar,
                'avg_mastery' => $sp->count() > 0 ? round($sp->avg('mastery_percentage')) : 0,
                'avg_score'   => $sp->count() > 0 ? round($sp->avg('average_score')) : 0,
                'materials_completed' => (int) $sp->sum('materials_completed'),
                'quizzes_completed'   => (int) $sp->sum('quizzes_completed'),
                'time_spent_minutes'  => (int) $sp->sum('time_spent_minutes'),
                'subjectBreakdown' => $sp->map(fn ($p) => [
                    'subject_name' => $p->subject?->name ?? 'Unknown',
                    'color'        => $p->subject?->color ?? '#006590',
                    'mastery'      => round($p->mastery_percentage),
                    'avg_score'    => round($p->average_score),
                ])->values(),
            ];
        });

        return Inertia::render('Teacher/Reports', [
            'classes' => Klass::where('teacher_id', Auth::id())
                ->withCount('students')
                ->with('subject:id,name,icon,color')
                ->get()
                ->map(fn ($k) => [
                    'id'             => $k->id,
                    'name'           => $k->name,
                    'students_count' => $k->students_count,
                    'subject'        => $k->subject ? ['name' => $k->subject->name, 'color' => $k->subject->color] : null,
                ]),
            'currentClass' => [
                'id'        => $class->id,
                'name'      => $class->name,
                'join_code' => $class->join_code,
                'subject'   => $class->subject ? ['name' => $class->subject->name] : null,
            ],
            'students' => $rows,
        ]);
    }
}
