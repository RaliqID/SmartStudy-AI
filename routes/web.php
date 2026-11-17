<?php

use App\Http\Controllers\Admin\AdminClassController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminSubjectController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Auth\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Student\AiTutorController;
use App\Http\Controllers\Student\DashboardController;
use App\Http\Controllers\Student\LeaderboardController;
use App\Http\Controllers\Student\MaterialsController;
use App\Http\Controllers\Student\NotificationController;
use App\Http\Controllers\Student\ProgressController;
use App\Http\Controllers\Student\QuizController;
use App\Http\Controllers\Student\ScheduleController;
use App\Http\Controllers\Student\SubjectsController;
use App\Http\Controllers\Teacher\TeacherClassController;
use App\Http\Controllers\Teacher\TeacherDashboardController;
use App\Http\Controllers\Teacher\TeacherMateriController;
use App\Http\Controllers\Teacher\TeacherQuizController;
use App\Http\Controllers\Teacher\TeacherReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| SmartStudy AI — Student / Teacher / Admin routing.
| Role-based redirects handled by AuthenticatedSessionController.
| Object-level authorization via Policies later.
*/

// Guest landing — HomeController handles role-based redirect for auth users.
Route::get('/', [HomeController::class, 'index'])->name('home');

// Student routes (role: student)
Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/subjects', [SubjectsController::class, 'index'])->name('subjects');
    Route::get('/subjects/{subject}', [SubjectsController::class, 'show'])->name('subjects.show');
    Route::get('/materials/{material}', [MaterialsController::class, 'show'])->name('materials.show');
    Route::post('/materials/{material}/complete', [MaterialsController::class, 'complete'])->name('materials.complete');

    // Quiz — result route declared BEFORE {quiz} routes to avoid pattern conflicts
    Route::get('/quiz', [QuizController::class, 'index'])->name('quiz');
    Route::get('/quiz/attempt/{attempt}/result', [QuizController::class, 'result'])->name('quiz.result');
    Route::post('/quiz/{quiz}/start', [QuizController::class, 'start'])->name('quiz.start');
    Route::get('/quiz/{quiz}/take', [QuizController::class, 'take'])->name('quiz.take');
    Route::post('/quiz/{quiz}/submit', [QuizController::class, 'submit'])->name('quiz.submit');

    Route::get('/ai', [AiTutorController::class, 'index'])->name('ai');
    Route::post('/ai/chat', [AiTutorController::class, 'sendMessage'])->name('ai.chat');

    // Schedule
    Route::get('/schedule', [ScheduleController::class, 'index'])->name('schedule');
    Route::post('/schedule', [ScheduleController::class, 'store'])->name('schedule.store');
    Route::put('/schedule/{schedule}', [ScheduleController::class, 'update'])->name('schedule.update');
    Route::delete('/schedule/{schedule}', [ScheduleController::class, 'destroy'])->name('schedule.destroy');
    Route::patch('/schedule/{schedule}/toggle', [ScheduleController::class, 'toggleComplete'])->name('schedule.toggle');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');

    // Progress
    Route::get('/progress', [ProgressController::class, 'index'])->name('progress');

    // Settings — alias ke profile edit
    Route::get('/settings', fn () => redirect()->route('profile.edit'))->name('settings');
});

// Teacher routes (role: teacher)
Route::middleware(['auth', 'verified', 'role:teacher'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('dashboard');

    // Materials
    Route::get('/materials', [TeacherMateriController::class, 'index'])->name('materials.index');
    Route::post('/materials', [TeacherMateriController::class, 'store'])->name('materials.store');
    Route::put('/materials/{material}', [TeacherMateriController::class, 'update'])->name('materials.update');
    Route::delete('/materials/{material}', [TeacherMateriController::class, 'destroy'])->name('materials.destroy');

    // Quizzes
    Route::get('/quizzes', [TeacherQuizController::class, 'index'])->name('quizzes.index');
    Route::get('/quizzes/create', [TeacherQuizController::class, 'create'])->name('quizzes.create');
    Route::post('/quizzes', [TeacherQuizController::class, 'store'])->name('quizzes.store');
    Route::get('/quizzes/{quiz}/edit', [TeacherQuizController::class, 'edit'])->name('quizzes.edit');
    Route::put('/quizzes/{quiz}', [TeacherQuizController::class, 'update'])->name('quizzes.update');
    Route::post('/quizzes/{quiz}/questions', [TeacherQuizController::class, 'storeQuestion'])->name('quizzes.storeQuestion');
    Route::delete('/quizzes/{quiz}/questions/{question}', [TeacherQuizController::class, 'destroyQuestion'])->name('quizzes.destroyQuestion');
    Route::patch('/quizzes/{quiz}/publish', [TeacherQuizController::class, 'publish'])->name('quizzes.publish');
    Route::delete('/quizzes/{quiz}', [TeacherQuizController::class, 'destroy'])->name('quizzes.destroy');

    // Classes
    Route::get('/classes', [TeacherClassController::class, 'index'])->name('classes.index');
    Route::post('/classes', [TeacherClassController::class, 'store'])->name('classes.store');
    Route::get('/classes/{class}', [TeacherClassController::class, 'show'])->name('classes.show');
    Route::post('/classes/{class}/students', [TeacherClassController::class, 'addStudent'])->name('classes.addStudent');
    Route::delete('/classes/{class}/students/{student}', [TeacherClassController::class, 'removeStudent'])->name('classes.removeStudent');

    // Reports
    Route::get('/reports', [TeacherReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/{class}', [TeacherReportController::class, 'show'])->name('reports.show');

    // Settings alias
    Route::get('/settings', fn () => redirect()->route('profile.edit'))->name('settings');
});

// Admin routes (role: admin)
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // User management
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::patch('/users/{user}/toggle-active', [AdminUserController::class, 'toggleActive'])->name('users.toggleActive');
    Route::post('/users/invite', [AdminUserController::class, 'invite'])->name('users.invite');

    // Subject management
    Route::get('/subjects', [AdminSubjectController::class, 'index'])->name('subjects.index');
    Route::post('/subjects', [AdminSubjectController::class, 'store'])->name('subjects.store');
    Route::put('/subjects/{subject}', [AdminSubjectController::class, 'update'])->name('subjects.update');
    Route::delete('/subjects/{subject}', [AdminSubjectController::class, 'destroy'])->name('subjects.destroy');

    // Class management
    Route::get('/classes', [AdminClassController::class, 'index'])->name('classes.index');
    Route::delete('/classes/{class}', [AdminClassController::class, 'destroy'])->name('classes.destroy');

    // Reports
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports');

    // Profile alias
    Route::get('/profile', fn () => redirect()->route('profile.edit'))->name('profile');
});

// Profile (auth required, any role)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Legacy dashboard redirect (student) — keep for backward compatibility but redirect to student.dashboard
Route::get('/dashboard', function () {
    return redirect()->route('student.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/auth.php';
