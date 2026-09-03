<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\HomeController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
    Route::get('/dashboard', [App\Http\Controllers\Student\DashboardController::class, 'index'])->name('dashboard');

    Route::get('/subjects', [App\Http\Controllers\Student\SubjectsController::class, 'index'])->name('subjects');
    Route::get('/subjects/{subject}', [App\Http\Controllers\Student\SubjectsController::class, 'show'])->name('subjects.show');
    Route::get('/materials/{material}', [App\Http\Controllers\Student\MaterialsController::class, 'show'])->name('materials.show');
    Route::post('/materials/{material}/complete', [App\Http\Controllers\Student\MaterialsController::class, 'complete'])->name('materials.complete');

    // Quiz — result route declared BEFORE {quiz} routes to avoid pattern conflicts
    Route::get('/quiz', [App\Http\Controllers\Student\QuizController::class, 'index'])->name('quiz');
    Route::get('/quiz/attempt/{attempt}/result', [App\Http\Controllers\Student\QuizController::class, 'result'])->name('quiz.result');
    Route::post('/quiz/{quiz}/start', [App\Http\Controllers\Student\QuizController::class, 'start'])->name('quiz.start');
    Route::get('/quiz/{quiz}/take', [App\Http\Controllers\Student\QuizController::class, 'take'])->name('quiz.take');
    Route::post('/quiz/{quiz}/submit', [App\Http\Controllers\Student\QuizController::class, 'submit'])->name('quiz.submit');

    Route::get('/ai', [App\Http\Controllers\Student\AiTutorController::class, 'index'])->name('ai');
    Route::post('/ai/chat', [App\Http\Controllers\Student\AiTutorController::class, 'sendMessage'])->name('ai.chat');

    // Schedule
    Route::get('/schedule', [App\Http\Controllers\Student\ScheduleController::class, 'index'])->name('schedule');
    Route::post('/schedule', [App\Http\Controllers\Student\ScheduleController::class, 'store'])->name('schedule.store');
    Route::put('/schedule/{schedule}', [App\Http\Controllers\Student\ScheduleController::class, 'update'])->name('schedule.update');
    Route::delete('/schedule/{schedule}', [App\Http\Controllers\Student\ScheduleController::class, 'destroy'])->name('schedule.destroy');
    Route::patch('/schedule/{schedule}/toggle', [App\Http\Controllers\Student\ScheduleController::class, 'toggleComplete'])->name('schedule.toggle');

    // Notifications
    Route::get('/notifications', [App\Http\Controllers\Student\NotificationController::class, 'index'])->name('notifications');
    Route::patch('/notifications/{notification}/read', [App\Http\Controllers\Student\NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [App\Http\Controllers\Student\NotificationController::class, 'markAllRead'])->name('notifications.readAll');

    // Leaderboard
    Route::get('/leaderboard', [App\Http\Controllers\Student\LeaderboardController::class, 'index'])->name('leaderboard');

    // Progress
    Route::get('/progress', [App\Http\Controllers\Student\ProgressController::class, 'index'])->name('progress');

    // Settings — alias ke profile edit
    Route::get('/settings', fn () => redirect()->route('profile.edit'))->name('settings');
});

// Teacher routes (role: teacher)
Route::middleware(['auth', 'verified', 'role:teacher'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Teacher\TeacherDashboardController::class, 'index'])->name('dashboard');

    // Materials
    Route::get('/materials',   [App\Http\Controllers\Teacher\TeacherMateriController::class, 'index'])->name('materials.index');
    Route::post('/materials',  [App\Http\Controllers\Teacher\TeacherMateriController::class, 'store'])->name('materials.store');
    Route::put('/materials/{material}', [App\Http\Controllers\Teacher\TeacherMateriController::class, 'update'])->name('materials.update');
    Route::delete('/materials/{material}', [App\Http\Controllers\Teacher\TeacherMateriController::class, 'destroy'])->name('materials.destroy');

    // Quizzes
    Route::get('/quizzes',                      [App\Http\Controllers\Teacher\TeacherQuizController::class, 'index'])->name('quizzes.index');
    Route::get('/quizzes/create',               [App\Http\Controllers\Teacher\TeacherQuizController::class, 'create'])->name('quizzes.create');
    Route::post('/quizzes',                     [App\Http\Controllers\Teacher\TeacherQuizController::class, 'store'])->name('quizzes.store');
    Route::get('/quizzes/{quiz}/edit',          [App\Http\Controllers\Teacher\TeacherQuizController::class, 'edit'])->name('quizzes.edit');
    Route::put('/quizzes/{quiz}',               [App\Http\Controllers\Teacher\TeacherQuizController::class, 'update'])->name('quizzes.update');
    Route::post('/quizzes/{quiz}/questions',    [App\Http\Controllers\Teacher\TeacherQuizController::class, 'storeQuestion'])->name('quizzes.storeQuestion');
    Route::delete('/quizzes/{quiz}/questions/{question}', [App\Http\Controllers\Teacher\TeacherQuizController::class, 'destroyQuestion'])->name('quizzes.destroyQuestion');
    Route::patch('/quizzes/{quiz}/publish',     [App\Http\Controllers\Teacher\TeacherQuizController::class, 'publish'])->name('quizzes.publish');
    Route::delete('/quizzes/{quiz}',            [App\Http\Controllers\Teacher\TeacherQuizController::class, 'destroy'])->name('quizzes.destroy');

    // Classes
    Route::get('/classes',                                    [App\Http\Controllers\Teacher\TeacherClassController::class, 'index'])->name('classes.index');
    Route::post('/classes',                                   [App\Http\Controllers\Teacher\TeacherClassController::class, 'store'])->name('classes.store');
    Route::get('/classes/{class}',                            [App\Http\Controllers\Teacher\TeacherClassController::class, 'show'])->name('classes.show');
    Route::post('/classes/{class}/students',                  [App\Http\Controllers\Teacher\TeacherClassController::class, 'addStudent'])->name('classes.addStudent');
    Route::delete('/classes/{class}/students/{student}',      [App\Http\Controllers\Teacher\TeacherClassController::class, 'removeStudent'])->name('classes.removeStudent');

    // Reports
    Route::get('/reports',           [App\Http\Controllers\Teacher\TeacherReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/{class}',   [App\Http\Controllers\Teacher\TeacherReportController::class, 'show'])->name('reports.show');
});

// Admin routes (role: admin)
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('dashboard');

    // User management
    Route::get('/users', [App\Http\Controllers\Admin\AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [App\Http\Controllers\Admin\AdminUserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [App\Http\Controllers\Admin\AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [App\Http\Controllers\Admin\AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::patch('/users/{user}/toggle-active', [App\Http\Controllers\Admin\AdminUserController::class, 'toggleActive'])->name('users.toggleActive');
    Route::post('/users/invite', [App\Http\Controllers\Admin\AdminUserController::class, 'invite'])->name('users.invite');

    // Subject management
    Route::get('/subjects', [App\Http\Controllers\Admin\AdminSubjectController::class, 'index'])->name('subjects.index');
    Route::post('/subjects', [App\Http\Controllers\Admin\AdminSubjectController::class, 'store'])->name('subjects.store');
    Route::put('/subjects/{subject}', [App\Http\Controllers\Admin\AdminSubjectController::class, 'update'])->name('subjects.update');
    Route::delete('/subjects/{subject}', [App\Http\Controllers\Admin\AdminSubjectController::class, 'destroy'])->name('subjects.destroy');

    // Class management
    Route::get('/classes', [App\Http\Controllers\Admin\AdminClassController::class, 'index'])->name('classes.index');
    Route::delete('/classes/{class}', [App\Http\Controllers\Admin\AdminClassController::class, 'destroy'])->name('classes.destroy');

    // Reports
    Route::get('/reports', [App\Http\Controllers\Admin\AdminReportController::class, 'index'])->name('reports');
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
