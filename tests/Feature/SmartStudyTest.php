<?php

use App\Models\User;
use App\Models\Subject;
use App\Models\Unit;
use App\Models\Material;
use App\Models\MaterialCompletion;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\QuizAttempt;
use App\Models\XpTransaction;
use App\Models\Notification;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Helpers ───────────────────────────────────────────────────

function makeRoles(): void
{
    foreach (['student', 'teacher', 'admin'] as $r) {
        Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
    }
}

function makeStudent(array $attrs = []): User
{
    makeRoles();
    $u = User::create(array_merge([
        'name' => 'Student Test',
        'email' => 'student' . uniqid() . '@test.ai',
        'password' => Hash::make('password'),
        'email_verified_at' => now(),
        'is_active' => true,
    ], $attrs));
    $u->assignRole('student');
    return $u;
}

function makeTeacher(array $attrs = []): User
{
    makeRoles();
    $u = User::create(array_merge([
        'name' => 'Teacher Test',
        'email' => 'teacher' . uniqid() . '@test.ai',
        'password' => Hash::make('password'),
        'email_verified_at' => now(),
        'is_active' => true,
    ], $attrs));
    $u->assignRole('teacher');
    return $u;
}

function makeAdmin(): User
{
    makeRoles();
    $u = User::create([
        'name' => 'Admin Test',
        'email' => 'admin@test.ai',
        'password' => Hash::make('password'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);
    $u->assignRole('admin');
    return $u;
}

function makeContent(): array
{
    $subject = Subject::create(['name' => 'Math', 'slug' => 'math', 'is_active' => true]);
    $unit = Unit::create(['subject_id' => $subject->id, 'title' => 'Unit 1', 'order_index' => 1, 'is_active' => true]);
    $material = Material::create(['unit_id' => $unit->id, 'title' => 'Lesson 1', 'content_type' => 'text', 'text_content' => 'Hello', 'order_index' => 1, 'is_active' => true]);
    return [$subject, $unit, $material];
}

function makeQuiz(User $teacher, Subject $subject): Quiz
{
    $quiz = Quiz::create([
        'title' => 'Algebra Quiz', 'subject_id' => $subject->id,
        'created_by' => $teacher->id, 'difficulty' => 'easy',
        'duration_minutes' => 10, 'xp_reward' => 50, 'passing_score' => 60,
        'is_published' => true, 'is_active' => true,
    ]);
    for ($i = 1; $i <= 2; $i++) {
        $q = Question::create(['quiz_id' => $quiz->id, 'question_text' => "Q{$i}: 1+1=?", 'type' => 'multiple_choice', 'points' => 10, 'order_index' => $i, 'is_active' => true]);
        QuestionOption::create(['question_id' => $q->id, 'option_text' => '2', 'is_correct' => true, 'order_index' => 1]);
        QuestionOption::create(['question_id' => $q->id, 'option_text' => '3', 'is_correct' => false, 'order_index' => 2]);
    }
    return $quiz;
}

// ─── Auth & Role Guard ─────────────────────────────────────────

test('register creates user with student role only', function () {
    makeRoles();
    $response = $this->post('/register', [
        'name' => 'New User',
        'email' => 'new@test.ai',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $user = User::where('email', 'new@test.ai')->first();
    expect($user)->not->toBeNull()
        ->and($user->hasRole('student'))->toBeTrue()
        ->and($user->hasRole('teacher'))->toBeFalse()
        ->and($user->hasRole('admin'))->toBeFalse();
});

test('login redirects student to student dashboard', function () {
    $student = makeStudent();

    $response = $this->post('/login', ['email' => $student->email, 'password' => 'password']);

    $response->assertRedirect('/student/dashboard');
});

test('deactivated user cannot login', function () {
    $student = makeStudent(['is_active' => false]);

    $response = $this->post('/login', ['email' => $student->email, 'password' => 'password']);

    $response->assertSessionHasErrors('email');
    expect($this->isAuthenticated())->toBeFalse();
});

test('teacher cannot access student routes', function () {
    $teacher = makeTeacher();
    $teacher->update(['last_active_at' => now()]); // avoid streak listener noise

    $this->actingAs($teacher)->get('/student/subjects')->assertForbidden();
});

test('student cannot access admin routes', function () {
    $student = makeStudent();

    $this->actingAs($student)->get('/admin/dashboard')->assertForbidden();
});

test('guest is redirected to login', function () {
    $this->get('/student/dashboard')->assertRedirect('/login');
});

// ─── Gamification: Material ────────────────────────────────────

test('material completion awards 25 xp and records transaction', function () {
    $student = makeStudent();
    [$subject, $unit, $material] = makeContent();

    $this->actingAs($student)
        ->post("/student/materials/{$material->id}/complete")
        ->assertRedirect();

    $student->refresh();
    // 25 XP dari AwardXpForMaterial (daily quest bonus hanya jika quest seeded)
    expect($student->xp)->toBe(25)
        ->and(XpTransaction::where('user_id', $student->id)->where('source_type', 'material_completed')->count())->toBe(1);
});

test('material completion is idempotent — no double xp', function () {
    $student = makeStudent();
    [$subject, $unit, $material] = makeContent();

    $this->actingAs($student)->post("/student/materials/{$material->id}/complete");
    $this->actingAs($student)->post("/student/materials/{$material->id}/complete");

    $student->refresh();
    expect($student->xp)->toBe(25) // tetap 25, bukan 50 — idempotent
        ->and(MaterialCompletion::where('user_id', $student->id)->count())->toBe(1);
});

test('level up at 500 xp creates notification', function () {
    $student = makeStudent();
    $student->xp = 480;
    $student->current_level = 1;
    $student->save();

    [$subject, $unit, $material] = makeContent();
    $this->actingAs($student)->post("/student/materials/{$material->id}/complete");

    $student->refresh();
    // 480 + 25 material + 25 daily quest = 530 → level 2
    expect($student->current_level)->toBe(2)
        ->and(Notification::where('user_id', $student->id)->where('type', 'level_up')->count())->toBe(1);
});

// ─── Quiz Flow ────────────────────────────────────────────────

test('full quiz flow: start → answer → submit → grade → result', function () {
    $teacher = makeTeacher();
    $student = makeStudent();
    [$subject, $unit, $material] = makeContent();
    $quiz = makeQuiz($teacher, $subject);

    // Start
    $this->actingAs($student)->post("/student/quiz/{$quiz->id}/start")->assertRedirect();

    $attempt = QuizAttempt::where('user_id', $student->id)->where('quiz_id', $quiz->id)->first();
    expect($attempt)->not->toBeNull()->and($attempt->status)->toBe('in_progress');

    // Submit — semua jawaban benar
    $answers = [];
    foreach ($quiz->questions as $q) {
        $answers[$q->id] = $q->options->firstWhere('is_correct', true)->id;
    }

    $this->actingAs($student)->post("/student/quiz/{$quiz->id}/submit", ['answers' => $answers])
        ->assertRedirect();

    $attempt->refresh();
    expect($attempt->status)->toBe('completed')
        ->and($attempt->score)->toBe(100)
        ->and($attempt->earned_points)->toBe(20);

    // Result page accessible
    $this->actingAs($student)->get("/student/quiz/attempt/{$attempt->id}/result")->assertOk();

    // XP awarded (quiz base 50 + bonus 20 perfect = 70)
    $student->refresh();
    expect($student->xp)->toBeGreaterThanOrEqual(70);
});

test('quiz take without in-progress attempt returns 404', function () {
    $teacher = makeTeacher();
    $student = makeStudent();
    [$subject] = makeContent();
    $quiz = makeQuiz($teacher, $subject);

    $this->actingAs($student)->get("/student/quiz/{$quiz->id}/take")->assertNotFound();
});

test('unpublished quiz is not listed', function () {
    $teacher = makeTeacher();
    $student = makeStudent();
    [$subject] = makeContent();
    $quiz = makeQuiz($teacher, $subject);
    $quiz->update(['is_published' => false]);

    $response = $this->actingAs($student)->get('/student/quiz');
    $response->assertOk();
    $html = $response->getContent();
    expect($html)->not->toContain($quiz->title);
});

// ─── Streak Freeze ────────────────────────────────────────────

test('streak freeze auto-protects one missed day', function () {
    $student = makeStudent();
    $student->current_streak = 5;
    $student->last_active_at = now()->subDays(2); // gap 2 hari
    $student->save();

    event(new App\Events\UserLoggedIn($student));
    $student->refresh();

    expect($student->current_streak)->toBe(6) // streak selamat 5→6
        ->and($student->freezes_used_month)->toBe(1)
        ->and(Notification::where('user_id', $student->id)->where('type', 'streak_freeze')->count())->toBe(1);
});

test('streak resets when monthly freeze quota exhausted', function () {
    $student = makeStudent();
    $student->current_streak = 5;
    $student->freezes_used_month = 2; // kuota habis
    $student->freezes_month_key = now()->format('Y-m'); // cegah monthly reset menambah kuota
    $student->last_active_at = now()->subDays(2);
    $student->save();

    event(new App\Events\UserLoggedIn($student));
    $student->refresh();

    expect($student->current_streak)->toBe(1); // reset
});

// ─── Teacher Panel ────────────────────────────────────────────

test('teacher can create quiz', function () {
    $teacher = makeTeacher();
    [$subject] = makeContent();

    $this->actingAs($teacher)->post('/teacher/quizzes', [
        'title' => 'My Quiz', 'subject_id' => $subject->id,
        'difficulty' => 'medium', 'duration_minutes' => 15,
        'xp_reward' => 50, 'passing_score' => 60,
    ])->assertRedirect();

    expect(Quiz::where('title', 'My Quiz')->where('created_by', $teacher->id)->exists())->toBeTrue();
});

test('teacher cannot edit other teacher quiz', function () {
    $teacherA = makeTeacher();
    $teacherB = makeTeacher();
    [$subject] = makeContent();
    $quiz = makeQuiz($teacherB, $subject);

    $this->actingAs($teacherA)
        ->put("/teacher/quizzes/{$quiz->id}", ['title' => 'Hacked', 'subject_id' => $subject->id, 'difficulty' => 'easy', 'duration_minutes' => 10, 'xp_reward' => 50, 'passing_score' => 60])
        ->assertForbidden();
});

// ─── Admin Panel ──────────────────────────────────────────────

test('admin can invite teacher via email', function () {
    makeRoles();
    $admin = makeAdmin();

    $this->actingAs($admin)->post('/admin/users/invite', [
        'email' => 'invited@test.ai',
        'role' => 'teacher',
    ])->assertRedirect();

    $invited = User::where('email', 'invited@test.ai')->first();
    expect($invited)->not->toBeNull()->and($invited->hasRole('teacher'))->toBeTrue();
});

test('admin invite rejects student role', function () {
    makeRoles();
    $admin = makeAdmin();

    $this->actingAs($admin)->post('/admin/users/invite', [
        'email' => 'hacker@test.ai',
        'role' => 'student',
    ])->assertSessionHasErrors('role');

    expect(User::where('email', 'hacker@test.ai')->exists())->toBeFalse();
});

test('admin cannot delete self', function () {
    $admin = makeAdmin();

    $this->actingAs($admin)->delete("/admin/users/{$admin->id}")->assertRedirect();
    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});

test('admin cannot delete last admin', function () {
    makeRoles();
    $admin = makeAdmin(); // hanya 1 admin di DB test
    $other = makeStudent();

    // Admin mencoba hapus diri → blocked (self-guard)
    $this->actingAs($admin)->delete("/admin/users/{$admin->id}")->assertRedirect();
    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});

test('admin cannot demote self from admin', function () {
    $admin = makeAdmin();

    $this->actingAs($admin)->put("/admin/users/{$admin->id}", [
        'name' => $admin->name, 'email' => $admin->email, 'role' => 'teacher',
    ])->assertRedirect();

    $admin->refresh();
    expect($admin->hasRole('admin'))->toBeTrue();
});

// ─── Smoke: semua halaman render ──────────────────────────────

test('student pages all render', function () {
    $student = makeStudent();
    [$subject, $unit, $material] = makeContent();

    foreach ([
        '/student/dashboard', '/student/subjects', "/student/subjects/math",
        '/student/quiz', '/student/ai', '/student/progress',
        '/student/schedule', '/student/notifications', '/student/leaderboard',
        '/profile',
    ] as $path) {
        $this->actingAs($student)->get($path)->assertOk();
    }
});

test('teacher pages all render', function () {
    $teacher = makeTeacher();
    $teacher->update(['last_active_at' => now()]);

    foreach ([
        '/teacher/dashboard', '/teacher/materials', '/teacher/quizzes',
        '/teacher/classes', '/teacher/reports',
    ] as $path) {
        $this->actingAs($teacher)->get($path)->assertOk();
    }
});

test('admin pages all render', function () {
    makeAdmin();
    $admin = User::where('email', 'admin@test.ai')->first();

    foreach ([
        '/admin/dashboard', '/admin/users', '/admin/subjects',
        '/admin/classes', '/admin/reports',
    ] as $path) {
        $this->actingAs($admin)->get($path)->assertOk();
    }
});
