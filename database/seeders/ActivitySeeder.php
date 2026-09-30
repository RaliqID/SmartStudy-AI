<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Klass;
use App\Models\Material;
use App\Models\MaterialCompletion;
use App\Models\Notification;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\Schedule;
use App\Models\StudentProgress;
use App\Models\Subject;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\XpTransaction;
use App\Services\LevelService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * ActivitySeeder
 *
 * Populates realistic demo *activity* on top of the baseline content created by
 * DatabaseSeeder (DemoContentSeeder + QuizSeeder). It exists so that the Student
 * Dashboard, Progress, Leaderboard, Teacher Reports and Admin Reports screens
 * render with meaningful data instead of empty states.
 *
 * What it creates (all idempotent — safe to run repeatedly):
 *   - 8+ extra student users (deterministic names/emails) with varied XP/level/streak
 *   - 4 classes taught by the demo teacher, with students attached via class_students
 *   - Material completions (~30-70%) spread over the last ~30 days
 *   - Completed quiz attempts (score consistent with earned/total points) + answers
 *   - StudentProgress rows derived from the completions/attempts
 *   - XpTransaction ledger roughly summing to each user's total xp
 *   - UserAchievements honouring each achievement's condition
 *   - Schedules (study events) for the demo student across the current month
 *   - Notifications (mixed read/unread) for the demo student
 *
 * Determinism: the PRNG is seeded with mt_srand(42) and all "random" choices are
 * derived from fixed arrays, so repeated runs produce the exact same rows.
 *
 * Notes on the schema (verified against migrations + models):
 *   - users.xp is the XP column (there is no total_xp column).
 *   - The gamification columns (xp, current_level, current_streak, ...) are NOT
 *     mass-assignable on the User model, so they are assigned as attributes and saved.
 *   - material_completions has no completed_at column; completed_at is implied by
 *     the row's created_at timestamp (that is what the dashboard/report queries use).
 */
class ActivitySeeder extends Seeder
{
    /** Budget-safe reference date for the whole run (immutable). */
    private CarbonImmutable $now;

    public function run(): void
    {
        // Deterministic randomness — same rows every run.
        mt_srand(42);

        $this->now = CarbonImmutable::now();

        DB::transaction(function () {
            // Ensure the student role exists (DatabaseSeeder normally creates it).
            Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

            $subjects = Subject::orderBy('id')->get();
            $materials = Material::where('is_active', true)->orderBy('id')->get();
            $quizzes = Quiz::where('is_published', true)->orderBy('id')->get();

            if ($subjects->isEmpty() || $materials->isEmpty() || $quizzes->isEmpty()) {
                $this->command?->warn('ActivitySeeder: content missing (subjects/materials/quizzes). Run DatabaseSeeder first.');

                return;
            }

            $demoStudent = User::where('email', 'student@smartstudy.ai')->first();
            $teacher = User::where('email', 'teacher@smartstudy.ai')->first();

            if (! $demoStudent || ! $teacher) {
                $this->command?->warn('ActivitySeeder: demo student/teacher not found. Run DatabaseSeeder first.');

                return;
            }

            // 1. Give the demo student a populated profile, then create extra students.
            $this->seedDemoStudentProfile($demoStudent);
            $students = $this->seedStudents();
            $allStudents = collect([$demoStudent])->concat($students);

            // 2. Classes + pivot.
            $classes = $this->seedClasses($teacher, $subjects, $allStudents);

            // 3. Material completions -> returns per-user completed material collections.
            $completionsByUser = $this->seedMaterialCompletions($allStudents, $materials);

            // 4. Quiz attempts (+ answers) -> returns per-user attempt collections.
            $attemptsByUser = $this->seedQuizAttempts($allStudents, $quizzes);

            // 5. XP ledger, 6. StudentProgress, 7. Achievements, 8. Schedules, 9. Notifications.
            foreach ($allStudents as $student) {
                $completions = $completionsByUser[$student->id] ?? collect();
                $attempts = $attemptsByUser[$student->id] ?? collect();

                $this->seedXpLedger($student, $completions, $attempts);
                $this->seedStudentProgress($student, $subjects, $completions, $attempts);
                $this->seedAchievements($student, $completions, $attempts);
            }

            $this->seedSchedules($demoStudent, $subjects);
            $this->seedNotifications($demoStudent);

            // Keep demo classes referenced so the collection is not "unused".
            $this->command?->info(sprintf(
                'ActivitySeeder: %d students, %d classes, %d material completions, %d quiz attempts.',
                $allStudents->count(),
                $classes->count(),
                MaterialCompletion::count(),
                QuizAttempt::count(),
            ));
        });
    }

    /**
     * Give the pre-existing demo student (student@smartstudy.ai) a populated
     * gamification profile so the logged-in dashboard is not empty.
     */
    private function seedDemoStudentProfile(User $user): void
    {
        $xp = 3120;
        $streak = 12;

        $user->xp = $xp;
        $user->current_level = app(LevelService::class)->levelForXp($xp);
        $user->current_streak = $streak;
        $user->longest_streak = 18;
        $user->last_active_at = $this->now->subHours(2);
        $user->streak_freezes = 2;
        $user->freezes_used_month = 0;
        $user->freezes_month_key = $this->now->format('Y-m');
        $user->is_active = true;
        $user->save();

        $user->assignRole('student');
    }

    /**
     * Create the extra demo students with fixed identities and varied gamification stats.
     *
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function seedStudents()
    {
        // Deterministic profiles: email => [name, xp, current_streak, longest_streak, freezes_used]
        $profiles = [
            ['name' => 'Andi Pratama',      'email' => 'andi.pratama@student.smartstudy.ai',      'xp' => 4820, 'streak' => 21, 'longest' => 28, 'freezes' => 1],
            ['name' => 'Siti Nurhaliza',    'email' => 'siti.nurhaliza@student.smartstudy.ai',    'xp' => 3610, 'streak' => 14, 'longest' => 19, 'freezes' => 0],
            ['name' => 'Budi Santoso',      'email' => 'budi.santoso@student.smartstudy.ai',      'xp' => 2985, 'streak' => 9,  'longest' => 15, 'freezes' => 2],
            ['name' => 'Putri Wulandari',   'email' => 'putri.wulandari@student.smartstudy.ai',   'xp' => 2440, 'streak' => 7,  'longest' => 12, 'freezes' => 1],
            ['name' => 'Rizky Ramadhan',    'email' => 'rizky.ramadhan@student.smartstudy.ai',    'xp' => 1875, 'streak' => 5,  'longest' => 9,  'freezes' => 0],
            ['name' => 'Dewi Lestari',      'email' => 'dewi.lestari@student.smartstudy.ai',      'xp' => 1320, 'streak' => 4,  'longest' => 7,  'freezes' => 1],
            ['name' => 'Ahmad Fauzi',       'email' => 'ahmad.fauzi@student.smartstudy.ai',       'xp' => 1065, 'streak' => 3,  'longest' => 5,  'freezes' => 0],
            ['name' => 'Maya Anggraini',    'email' => 'maya.anggraini@student.smartstudy.ai',    'xp' => 845,  'streak' => 2,  'longest' => 3,  'freezes' => 2],
            ['name' => 'James Anderson',    'email' => 'james.anderson@student.smartstudy.ai',    'xp' => 2050, 'streak' => 11, 'longest' => 14, 'freezes' => 0],
            ['name' => 'Chloe Martinez',    'email' => 'chloe.martinez@student.smartstudy.ai',    'xp' => 990,  'streak' => 6,  'longest' => 8,  'freezes' => 1],
        ];

        $levelService = app(LevelService::class);
        $students = collect();

        foreach ($profiles as $profile) {
            $user = User::firstOrCreate(
                ['email' => $profile['email']],
                [
                    'name' => $profile['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => $this->now,
                    'is_active' => true,
                ]
            );

            // Gamification columns are not mass-assignable → set + save directly.
            $user->xp = $profile['xp'];
            $user->current_level = $levelService->levelForXp($profile['xp']);
            $user->current_streak = $profile['streak'];
            $user->longest_streak = $profile['longest'];
            $user->last_active_at = $this->now->subDays(mt_rand(0, 3));
            $user->streak_freezes = 2;
            $user->freezes_used_month = $profile['freezes'];
            $user->freezes_month_key = $this->now->format('Y-m');
            $user->is_active = true;
            $user->save();

            $user->assignRole('student');

            $students->push($user);
        }

        return $students;
    }

    /**
     * Create classes taught by the teacher and attach students via the pivot.
     *
     * @param  \Illuminate\Support\Collection<int, Subject>  $subjects
     * @param  \Illuminate\Support\Collection<int, User>  $allStudents
     * @return \Illuminate\Support\Collection<int, Klass>
     */
    private function seedClasses(User $teacher, $subjects, $allStudents)
    {
        $definitions = [
            ['name' => 'Mathematics — Grade 10A',  'slug' => 'mathematics', 'code' => 'MATH10A', 'desc' => 'Algebra, geometry and calculus essentials.'],
            ['name' => 'Physics — Grade 11B',      'slug' => 'physics',     'code' => 'PHYS11B', 'desc' => 'Mechanics, energy and the laws of nature.'],
            ['name' => 'Biology — Grade 10C',      'slug' => 'biology',     'code' => 'BIO10C',  'desc' => 'Cells, genetics and living systems.'],
            ['name' => 'English — Grade 12A',      'slug' => 'english',     'code' => 'ENG12A',  'desc' => 'Grammar, writing and literature comprehension.'],
        ];

        $classes = collect();

        foreach ($definitions as $def) {
            $subject = $subjects->firstWhere('slug', $def['slug']);

            $klass = Klass::updateOrCreate(
                ['join_code' => $def['code']],
                [
                    'name' => $def['name'],
                    'description' => $def['desc'],
                    'teacher_id' => $teacher->id,
                    'subject_id' => $subject?->id,
                    'is_active' => true,
                ]
            );

            // Attach a deterministic subset of students. Class membership is stable
            // per run because it only depends on the fixed student list ordering.
            $members = $allStudents
                ->filter(fn (User $u, int $i) => ($i + $klass->id) % 2 === 0 || $i === 0)
                ->pluck('id')
                ->all();

            // syncWithoutDetaching keeps the pivot idempotent.
            $klass->students()->syncWithoutDetaching($members);

            $classes->push($klass);
        }

        return $classes;
    }

    /**
     * Mark a realistic subset (30-70%) of materials completed per student.
     *
     * @param  \Illuminate\Support\Collection<int, User>  $students
     * @param  \Illuminate\Support\Collection<int, Material>  $materials
     * @return array<int, \Illuminate\Support\Collection<int, MaterialCompletion>>
     */
    private function seedMaterialCompletions($students, $materials): array
    {
        $byUser = [];

        foreach ($students as $student) {
            $ratio = 0.30 + (mt_rand(0, 40) / 100); // 0.30 - 0.70
            $count = max(1, (int) floor($materials->count() * $ratio));

            // Deterministic selection: shuffle material ids with the seeded PRNG.
            $ids = $materials->pluck('id')->all();
            shuffle($ids);
            $selectedIds = array_slice($ids, 0, $count);

            $byUser[$student->id] = collect();

            foreach ($selectedIds as $materialId) {
                // Spread completions across the last ~30 days.
                $completedAt = $this->now
                    ->subDays(mt_rand(0, 30))
                    ->setTime(mt_rand(6, 22), mt_rand(0, 59));

                $completion = MaterialCompletion::firstOrCreate(
                    ['user_id' => $student->id, 'material_id' => $materialId],
                    ['created_at' => $completedAt, 'updated_at' => $completedAt]
                );

                $byUser[$student->id]->push($completion);
            }
        }

        return $byUser;
    }

    /**
     * Create completed quiz attempts (with answers for one attempt per user).
     *
     * @param  \Illuminate\Support\Collection<int, User>  $students
     * @param  \Illuminate\Support\Collection<int, Quiz>  $quizzes
     * @return array<int, \Illuminate\Support\Collection<int, QuizAttempt>>
     */
    private function seedQuizAttempts($students, $quizzes): array
    {
        $byUser = [];

        foreach ($students as $student) {
            $byUser[$student->id] = collect();

            foreach ($quizzes as $quiz) {
                $questions = $quiz->questions()->with('options')->get();
                if ($questions->isEmpty()) {
                    continue;
                }

                $totalPoints = (int) $questions->sum('points');

                // Deterministic score band per user+quiz: 55-100.
                $score = mt_rand(55, 100);

                // Derive earned points so that score == round(earned/total*100).
                $earned = (int) round($totalPoints * $score / 100);
                // Recompute an exact integer percentage from earned/total.
                $score = $totalPoints > 0 ? (int) round($earned / $totalPoints * 100) : 0;

                $completedAt = $this->now
                    ->subDays(mt_rand(0, 28))
                    ->setTime(mt_rand(8, 21), mt_rand(0, 59));
                $startedAt = $completedAt->subMinutes($quiz->duration_minutes + mt_rand(1, 8));
                $timeSpent = abs($startedAt->diffInSeconds($completedAt));

                $attempt = QuizAttempt::updateOrCreate(
                    [
                        'user_id' => $student->id,
                        'quiz_id' => $quiz->id,
                    ],
                    [
                        'status' => 'completed',
                        'score' => $score,
                        'total_points' => $totalPoints,
                        'earned_points' => $earned,
                        'started_at' => $startedAt,
                        'completed_at' => $completedAt,
                        'time_spent_seconds' => $timeSpent,
                    ]
                );

                // Provide answer rows for the FIRST attempt of each quiz only, to keep
                // the Quiz Result review page populated without bloating the DB.
                if ($attempt->answers()->count() === 0) {
                    $this->seedAttemptAnswers($attempt, $questions, $earned);
                }

                $byUser[$student->id]->push($attempt->fresh());
            }
        }

        return $byUser;
    }

    /**
     * Fabricate answer rows whose correct count matches the attempt's earned points.
     *
     * @param  \Illuminate\Support\Collection<int, Question>  $questions
     */
    private function seedAttemptAnswers(QuizAttempt $attempt, $questions, int $earnedPoints): void
    {
        // Number of questions the student answered correctly, derived from earned points.
        $pointsPerQuestion = $questions->first()->points ?: 10;
        $correctCount = (int) round($earnedPoints / $pointsPerQuestion);

        $ordered = $questions->values();
        $correctIndexes = range(0, max(0, $correctCount - 1));

        foreach ($ordered as $index => $question) {
            $isCorrect = in_array($index, $correctIndexes, true);
            $options = $question->options;

            $chosen = $isCorrect
                ? $options->firstWhere('is_correct', true)
                : $options->firstWhere('is_correct', false);

            QuizAttemptAnswer::updateOrCreate(
                ['quiz_attempt_id' => $attempt->id, 'question_id' => $question->id],
                [
                    'question_option_id' => $chosen?->id,
                    'answer_text' => $chosen?->option_text,
                    'is_correct' => $isCorrect,
                    'points_earned' => $isCorrect ? $question->points : 0,
                ]
            );
        }
    }

    /**
     * Build an XP ledger whose sum matches the student's authoritative users.xp value.
     *
     * Strategy: emit one material_completed (25 XP) and one quiz_completed (quiz reward
     * + high-score bonus) transaction per activity, then place the remaining XP into a
     * single "achievement_unlocked" catch-all row so the ledger reconciles exactly.
     *
     * @param  \Illuminate\Support\Collection<int, MaterialCompletion>  $completions
     * @param  \Illuminate\Support\Collection<int, QuizAttempt>  $attempts
     */
    private function seedXpLedger(User $student, $completions, $attempts): void
    {
        $targetXp = (int) $student->xp;
        $ledgerSum = 0;

        foreach ($completions as $completion) {
            $xp = 25;
            XpTransaction::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'source_type' => 'material_completed',
                    'source_id' => $completion->material_id,
                ],
                ['xp_amount' => $xp, 'created_at' => $completion->created_at, 'updated_at' => $completion->created_at]
            );
            $ledgerSum += $xp;
        }

        foreach ($attempts as $attempt) {
            $quiz = $attempt->quiz;
            $baseXp = (int) ($quiz->xp_reward ?? 50);
            $bonus = $attempt->score >= 90 ? 20 : ($attempt->score >= 70 ? 10 : 0);
            $xp = $baseXp + $bonus;

            XpTransaction::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'source_type' => 'quiz_completed',
                    'source_id' => $attempt->id,
                ],
                ['xp_amount' => $xp, 'created_at' => $attempt->completed_at, 'updated_at' => $attempt->completed_at]
            );
            $ledgerSum += $xp;
        }

        // Reconcile: a single synthetic row carries whatever is left so that
        // sum(xp_transactions.xp_amount) === users.xp for every student.
        // If the computed activity XP already exceeds the target (possible for
        // low-XP profiles with lots of activity), bump users.xp up to the ledger
        // sum so the two never diverge — the ledger is treated as authoritative.
        if ($ledgerSum > $targetXp) {
            $student->xp = $ledgerSum;
            $student->current_level = app(LevelService::class)->levelForXp($ledgerSum);
            $student->save();
            $targetXp = $ledgerSum;
        }

        $remainder = $targetXp - $ledgerSum;

        XpTransaction::updateOrCreate(
            [
                'user_id' => $student->id,
                'source_type' => 'xp_adjustment',
                'source_id' => null,
            ],
            [
                'xp_amount' => max(0, $remainder),
                'created_at' => $this->now->subDays(29)->setTime(9, 0),
                'updated_at' => $this->now->subDays(29)->setTime(9, 0),
            ]
        );
    }

    /**
     * Derive one StudentProgress row per (user, subject) that has activity.
     *
     * @param  \Illuminate\Support\Collection<int, Subject>  $subjects
     * @param  \Illuminate\Support\Collection<int, MaterialCompletion>  $completions
     * @param  \Illuminate\Support\Collection<int, QuizAttempt>  $attempts
     */
    private function seedStudentProgress(User $student, $subjects, $completions, $attempts): void
    {
        // Map material_id -> subject_id so we can bucket completions by subject.
        $materialToSubject = Material::with('unit:id,subject_id')
            ->get()
            ->mapWithKeys(fn (Material $m) => [$m->id => $m->unit?->subject_id]);

        $completedBySubject = $completions->groupBy(
            fn (MaterialCompletion $c) => $materialToSubject[$c->material_id] ?? null
        );

        $attemptsBySubject = $attempts->groupBy(fn (QuizAttempt $a) => $a->quiz->subject_id);

        foreach ($subjects as $subject) {
            $subjectCompletions = $completedBySubject->get($subject->id, collect());
            $subjectAttempts = $attemptsBySubject->get($subject->id, collect());

            if ($subjectCompletions->isEmpty() && $subjectAttempts->isEmpty()) {
                continue;
            }

            $totalMaterials = Material::whereIn(
                'unit_id',
                $subject->units()->pluck('id')
            )->where('is_active', true)->count();

            $materialsCompleted = $subjectCompletions->count();
            $quizzesCompleted = $subjectAttempts->count();
            $averageScore = $quizzesCompleted > 0
                ? round($subjectAttempts->avg('score'), 2)
                : 0.0;

            // Mastery blends material coverage and quiz performance.
            $coverage = $totalMaterials > 0 ? ($materialsCompleted / $totalMaterials) : 0;
            $scoreFactor = $averageScore / 100;
            $mastery = round(min(100, ($coverage * 0.6 + $scoreFactor * 0.4) * 100), 2);

            $timeSpent = $materialsCompleted * 15 + $quizzesCompleted * 12;

            $lastDates = $subjectCompletions->pluck('created_at')
                ->merge($subjectAttempts->pluck('completed_at'))
                ->filter();
            $lastAccessed = $lastDates->max() ?? $this->now;

            StudentProgress::updateOrCreate(
                ['user_id' => $student->id, 'subject_id' => $subject->id],
                [
                    'mastery_percentage' => $mastery,
                    'materials_completed' => $materialsCompleted,
                    'quizzes_completed' => $quizzesCompleted,
                    'average_score' => $averageScore,
                    'time_spent_minutes' => $timeSpent,
                    'last_accessed_at' => $lastAccessed,
                ]
            );
        }
    }

    /**
     * Unlock a sensible subset of achievements, honouring each condition.
     *
     * @param  \Illuminate\Support\Collection<int, MaterialCompletion>  $completions
     * @param  \Illuminate\Support\Collection<int, QuizAttempt>  $attempts
     */
    private function seedAchievements(User $student, $completions, $attempts): void
    {
        $materialsCompleted = $completions->count();
        $quizzesCompleted = $attempts->count();
        $bestScore = (int) ($attempts->max('score') ?? 0);
        $streak = (int) $student->current_streak;
        $xp = (int) $student->xp;

        foreach (Achievement::all() as $achievement) {
            $unlocked = match ($achievement->type) {
                'count' => match ($achievement->condition_key) {
                    'materials_completed' => $materialsCompleted >= $achievement->condition_value,
                    'quizzes_completed' => $quizzesCompleted >= $achievement->condition_value,
                    default => false,
                },
                'score' => $achievement->condition_key === 'quiz_score'
                    && $bestScore >= $achievement->condition_value,
                'streak' => $achievement->condition_key === 'current_streak'
                    && $streak >= $achievement->condition_value,
                'xp' => $achievement->condition_key === 'total_xp'
                    && $xp >= $achievement->condition_value,
                default => false,
            };

            if (! $unlocked) {
                continue;
            }

            UserAchievement::updateOrCreate(
                ['user_id' => $student->id, 'achievement_id' => $achievement->id],
                ['unlocked_at' => $this->now->subDays(mt_rand(1, 25))->setTime(mt_rand(8, 20), mt_rand(0, 59))]
            );
        }
    }

    /**
     * Create study events for the demo student spread across the current month.
     *
     * @param  \Illuminate\Support\Collection<int, Subject>  $subjects
     */
    private function seedSchedules(User $student, $subjects): void
    {
        $definitions = [
            ['title' => 'Algebra Revision Session',   'type' => 'study_session', 'offset' => -12, 'start' => '18:00', 'end' => '19:30', 'completed' => true],
            ['title' => 'Physics Lab Practice',       'type' => 'live_session',  'offset' => -9,  'start' => '15:00', 'end' => '16:30', 'completed' => true],
            ['title' => 'Biology Quiz Prep',          'type' => 'quiz',          'offset' => -6,  'start' => '19:00', 'end' => '20:00', 'completed' => true],
            ['title' => 'English Essay Workshop',     'type' => 'study_session', 'offset' => -3,  'start' => '17:00', 'end' => '18:00', 'completed' => true],
            ['title' => 'Geometry Practice Problems', 'type' => 'study_session', 'offset' => -1,  'start' => '18:30', 'end' => '19:30', 'completed' => false],
            ['title' => 'Chemistry Mid-term Exam',    'type' => 'exam',          'offset' => 1,   'start' => '09:00', 'end' => '11:00', 'completed' => false],
            ['title' => 'Physics Live Class',         'type' => 'live_session',  'offset' => 2,   'start' => '14:00', 'end' => '15:30', 'completed' => false],
            ['title' => 'Biology Study Group',        'type' => 'study_session', 'offset' => 3,   'start' => '16:00', 'end' => '17:30', 'completed' => false],
            ['title' => 'Mathematics Weekly Quiz',    'type' => 'quiz',          'offset' => 5,   'start' => '10:00', 'end' => '11:00', 'completed' => false],
            ['title' => 'English Reading Session',    'type' => 'study_session', 'offset' => 7,   'start' => '19:00', 'end' => '20:00', 'completed' => false],
        ];

        $palette = ['#2b6c00', '#006590', '#755b00', '#7c3aed', '#dc2626'];

        // Anchor event dates to the start of the current week (stable across runs),
        // so re-seeding does not shift dates and create duplicate rows.
        $anchor = $this->now->startOfWeek();

        foreach ($definitions as $i => $def) {
            $subject = $subjects[$i % $subjects->count()] ?? null;
            $eventDate = $anchor->addDays($def['offset'])->toDateString();

            Schedule::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'title' => $def['title'],
                ],
                [
                    'subject_id' => $subject?->id,
                    'description' => $def['title'] . ' — scheduled session.',
                    'event_type' => $def['type'],
                    'event_date' => $eventDate,
                    'start_time' => $def['start'],
                    'end_time' => $def['end'],
                    'location' => $def['type'] === 'live_session' ? 'Online (Zoom)' : 'Study Room A',
                    'color' => $palette[$i % count($palette)],
                    'is_completed' => $def['completed'],
                    'is_active' => true,
                ]
            );
        }
    }

    /**
     * Create a mix of read/unread notifications for the demo student.
     */
    private function seedNotifications(User $student): void
    {
        $notifications = [
            ['type' => 'achievement_unlocked', 'title' => 'Achievement Unlocked: First Steps', 'body' => 'You completed your first lesson. Keep going!', 'icon' => 'emoji_events', 'url' => '/student/progress', 'read' => true,  'offset' => -9],
            ['type' => 'level_up',             'title' => 'Level Up!',                          'body' => 'You reached Level 5. Amazing progress!',       'icon' => 'military_tech', 'url' => '/student/progress', 'read' => true,  'offset' => -7],
            ['type' => 'quest_completed',      'title' => 'Daily Quest Completed: Quiz',         'body' => 'You completed "Take a Quiz". +50 XP!',         'icon' => 'task_alt',      'url' => '/student/dashboard', 'read' => true,  'offset' => -5],
            ['type' => 'streak_reminder',      'title' => 'Keep Your Streak Alive!',            'body' => 'Complete one lesson today to extend your streak.', 'icon' => 'local_fire_department', 'url' => '/student/dashboard', 'read' => false, 'offset' => -2],
            ['type' => 'friend_activity',      'title' => 'Andi Pratama passed you!',           'body' => 'Andi just earned 120 XP. Catch up on the leaderboard!', 'icon' => 'group', 'url' => '/student/leaderboard', 'read' => false, 'offset' => -1],
            ['type' => 'announcement',         'title' => 'New Physics Unit Available',         'body' => 'Unit "Energy & Work" has new materials.',      'icon' => 'campaign',      'url' => '/student/subjects',  'read' => false, 'offset' => 0],
            ['type' => 'achievement_unlocked', 'title' => 'Achievement Unlocked: Bookworm',     'body' => 'You completed 10 lessons.',                    'icon' => 'menu_book',     'url' => '/student/progress',  'read' => true,  'offset' => -12],
            ['type' => 'streak_freeze',        'title' => 'Streak Freeze Used!',                'body' => 'Your streak was saved by a Streak Freeze.',    'icon' => 'ac_unit',       'url' => '/student/progress',  'read' => true,  'offset' => -3],
            ['type' => 'quest_completed',      'title' => 'Daily Quest Completed: Lessons',      'body' => 'You completed "Complete 2 Lessons". +40 XP!',  'icon' => 'task_alt',      'url' => '/student/dashboard', 'read' => false, 'offset' => 0],
        ];

        foreach ($notifications as $n) {
            $createdAt = $this->now->addDays($n['offset'])->setTime(mt_rand(8, 21), mt_rand(0, 59));

            Notification::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'type' => $n['type'],
                    'title' => $n['title'],
                ],
                [
                    'body' => $n['body'],
                    'icon' => $n['icon'],
                    'action_url' => $n['url'],
                    'read_at' => $n['read'] ? $createdAt->addHours(mt_rand(1, 5)) : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );
        }
    }
}
