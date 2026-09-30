<?php

namespace Database\Seeders;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $math = Subject::where('slug', 'mathematics')->first();
        if (! $math) {
            $this->command?->warn('Subject "mathematics" not found. Run DemoContentSeeder first.');
            return;
        }

        // Attribute the seeded quizzes to the demo teacher so they appear in the
        // teacher's own dashboard/lists (which scope by created_by). Fall back to
        // the admin when no teacher exists yet.
        $authorId = User::role('teacher')->value('id')
            ?? User::role('admin')->value('id')
            ?? User::value('id');

        $quizzes = [
            [
                'title' => 'Algebra Basics',
                'description' => 'Test your understanding of basic algebra concepts.',
                'difficulty' => 'easy',
                'duration_minutes' => 10,
                'xp_reward' => 50,
                'passing_score' => 60,
                'questions' => [
                    [
                        'text' => 'What is the value of x in the equation 2x + 3 = 7?',
                        'options' => ['1', '2', '3', '4'],
                        'correct' => 1,
                        'explanation' => 'Subtract 3 from both sides: 2x = 4, then divide by 2: x = 2.',
                    ],
                    [
                        'text' => 'Simplify: 3(x + 4) - 2x',
                        'options' => ['x + 12', 'x + 4', '5x + 12', '3x + 12'],
                        'correct' => 0,
                        'explanation' => 'Distribute: 3x + 12 - 2x = x + 12.',
                    ],
                    [
                        'text' => 'Solve for y: 5y - 2 = 18',
                        'options' => ['3', '4', '5', '6'],
                        'correct' => 1,
                        'explanation' => 'Add 2: 5y = 20; divide by 5: y = 4.',
                    ],
                    [
                        'text' => 'What is the slope of the line y = 2x + 1?',
                        'options' => ['1', '2', '3', '0'],
                        'correct' => 1,
                        'explanation' => 'The slope is the coefficient of x, which is 2.',
                    ],
                    [
                        'text' => 'Which expression is equivalent to (x + 2)(x - 2)?',
                        'options' => ['x² - 4', 'x² + 4', 'x² - 2x + 4', 'x² + 2x - 4'],
                        'correct' => 0,
                        'explanation' => 'Difference of squares: (x + 2)(x - 2) = x² - 4.',
                    ],
                ],
            ],
            [
                'title' => 'Linear Equations',
                'description' => 'Solve linear equations and graph lines.',
                'difficulty' => 'medium',
                'duration_minutes' => 15,
                'xp_reward' => 75,
                'passing_score' => 60,
                'questions' => [
                    [
                        'text' => 'Solve: 4x - 7 = 2x + 5',
                        'options' => ['4', '6', '8', '10'],
                        'correct' => 1,
                        'explanation' => 'Subtract 2x: 2x - 7 = 5; add 7: 2x = 12; x = 6.',
                    ],
                    [
                        'text' => 'What is the y-intercept of y = -3x + 6?',
                        'options' => ['-3', '0', '6', '-6'],
                        'correct' => 2,
                        'explanation' => 'The y-intercept is the constant term, which is 6.',
                    ],
                    [
                        'text' => 'Find the equation of a line with slope 2 passing through (1, 3).',
                        'options' => ['y = 2x + 1', 'y = 2x - 1', 'y = 2x + 3', 'y = 2x + 5'],
                        'correct' => 0,
                        'explanation' => 'Point-slope: y - 3 = 2(x - 1) → y = 2x + 1.',
                    ],
                    [
                        'text' => 'What is the x-intercept of y = 2x - 4?',
                        'options' => ['-2', '0', '2', '4'],
                        'correct' => 2,
                        'explanation' => 'Set y = 0: 0 = 2x - 4 → 2x = 4 → x = 2.',
                    ],
                    [
                        'text' => 'Solve for x: 3(x + 2) = 5x - 4',
                        'options' => ['5', '6', '7', '8'],
                        'correct' => 0,
                        'explanation' => '3x + 6 = 5x - 4 → 6 + 4 = 5x - 3x → 10 = 2x → x = 5.',
                    ],
                ],
            ],
            [
                'title' => 'Geometry Fundamentals',
                'description' => 'Challenge yourself with geometry concepts.',
                'difficulty' => 'hard',
                'duration_minutes' => 20,
                'xp_reward' => 100,
                'passing_score' => 70,
                'questions' => [
                    [
                        'text' => 'What is the area of a circle with radius 5? (Use π ≈ 3.14)',
                        'options' => ['78.5', '78.0', '79.0', '80.0'],
                        'correct' => 0,
                        'explanation' => 'Area = πr² = 3.14 × 25 = 78.5.',
                    ],
                    [
                        'text' => 'In a right triangle, the legs are 3 and 4. What is the hypotenuse?',
                        'options' => ['5', '6', '7', '8'],
                        'correct' => 0,
                        'explanation' => 'Pythagorean theorem: c² = 3² + 4² = 25 → c = 5.',
                    ],
                    [
                        'text' => 'What is the sum of the interior angles of a pentagon?',
                        'options' => ['360°', '540°', '720°', '900°'],
                        'correct' => 1,
                        'explanation' => 'Sum = (n - 2) × 180° = 3 × 180° = 540°.',
                    ],
                    [
                        'text' => 'A rectangle has length 8 and width 6. What is its perimeter?',
                        'options' => ['28', '30', '32', '34'],
                        'correct' => 0,
                        'explanation' => 'Perimeter = 2(l + w) = 2(8 + 6) = 28.',
                    ],
                    [
                        'text' => 'What is the volume of a cylinder with radius 2 and height 5? (Use π ≈ 3.14)',
                        'options' => ['62.8', '65.0', '60.0', '70.0'],
                        'correct' => 0,
                        'explanation' => 'Volume = πr²h = 3.14 × 4 × 5 = 62.8.',
                    ],
                ],
            ],
        ];

        foreach ($quizzes as $data) {
            $quiz = Quiz::firstOrCreate(
                ['title' => $data['title'], 'subject_id' => $math->id],
                [
                    'description' => $data['description'],
                    'created_by' => $authorId,
                    'difficulty' => $data['difficulty'],
                    'duration_minutes' => $data['duration_minutes'],
                    'xp_reward' => $data['xp_reward'],
                    'passing_score' => $data['passing_score'],
                    'is_published' => true,
                    'is_active' => true,
                ]
            );

            // Only seed questions if quiz has none (idempotent)
            if ($quiz->questions()->count() === 0) {
                $this->createQuestions($quiz, $data['questions']);
            }
        }
    }

    private function createQuestions(Quiz $quiz, array $questions): void
    {
        $order = 1;
        foreach ($questions as $q) {
            $question = Question::create([
                'quiz_id' => $quiz->id,
                'question_text' => $q['text'],
                'type' => 'multiple_choice',
                'explanation' => $q['explanation'],
                'points' => 10,
                'order_index' => $order++,
                'is_active' => true,
            ]);

            foreach ($q['options'] as $idx => $optionText) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'option_text' => $optionText,
                    'is_correct' => ($idx === $q['correct']),
                    'order_index' => $idx + 1,
                ]);
            }
        }
    }
}
