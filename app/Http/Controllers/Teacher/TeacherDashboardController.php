<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Klass;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentProgress;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeacherDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $teacherKlassIds = Klass::where('teacher_id', $user->id)->pluck('id');

        $totalStudents = Klass::where('teacher_id', $user->id)
            ->withCount('students')
            ->get()
            ->sum('students_count');

        $totalQuizzes = Quiz::where('created_by', $user->id)->count();

        $totalMaterials = Material::where('created_by', $user->id)->count();

        $classes = Klass::where('teacher_id', $user->id)
            ->with(['subject:id,name,icon,color', 'students:id,name'])
            ->get()
            ->map(fn ($k) => [
                'id'          => $k->id,
                'name'        => $k->name,
                'join_code'   => $k->join_code,
                'subject'     => $k->subject ? ['id' => $k->subject->id, 'name' => $k->subject->name, 'icon' => $k->subject->icon, 'color' => $k->subject->color] : null,
                'students_count' => $k->students_count,
            ]);

        // Recent activity: last 5 quiz attempts + last 5 progress updates
        $recentAttempts = QuizAttempt::whereHas('quiz', fn ($q) => $q->whereIn('id', Quiz::whereIn('class_id', $teacherKlassIds)->pluck('id')))
            ->with(['user:id,name', 'quiz:id,title'])
            ->orderByDesc('completed_at')
            ->limit(5)
            ->get()
            ->map(fn ($a) => [
                'type'       => 'quiz_attempt',
                'user_name'  => $a->user->name ?? 'Student',
                'quiz_title' => $a->quiz->title ?? 'Quiz',
                'score'      => $a->score,
                'date'       => $a->completed_at?->toDateString(),
            ]);

        $recentProgress = StudentProgress::whereIn('user_id', function ($q) use ($teacherKlassIds) {
            $q->select('student_id')->from('class_students')->whereIn('class_id', $teacherKlassIds);
        })
            ->with(['user:id,name', 'subject:id,name'])
            ->orderByDesc('last_accessed_at')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'type'         => 'progress',
                'user_name'    => $p->user->name ?? 'Student',
                'subject_name' => $p->subject->name ?? 'Subject',
                'mastery'      => round($p->mastery_percentage),
                'date'         => $p->last_accessed_at?->toDateString(),
            ]);

        $recentActivity = $recentAttempts->merge($recentProgress)->sortByDesc('date')->values()->take(10);

        return Inertia::render('Teacher/Dashboard', [
            'user' => [
                'name'           => $user->name,
                'current_level'  => $user->current_level,
                'xp'             => $user->xp,
                'current_streak' => $user->current_streak,
            ],
            'classes'        => $classes,
            'recentActivity' => $recentActivity,
            'stats' => [
                'totalStudents' => (int) $totalStudents,
                'totalQuizzes'  => (int) $totalQuizzes,
                'totalClasses'  => $classes->count(),
                'totalMaterials'=> (int) $totalMaterials,
            ],
        ]);
    }
}
