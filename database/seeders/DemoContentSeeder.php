<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Unit;
use App\Models\Material;
use App\Models\Achievement;
use App\Models\DailyQuest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        // Attribute seeded materials to the demo teacher so the teacher-facing
        // Materials page (scoped by created_by) is populated after seeding.
        $authorId = \App\Models\User::role('teacher')->value('id')
            ?? \App\Models\User::role('admin')->value('id')
            ?? \App\Models\User::value('id');

        // ===== Subjects =====
        $subjectsData = [
            [
                'name' => 'Mathematics',
                'icon' => 'calculate',
                'color' => '#2b6c00',
                'description' => 'Master algebra, geometry, and calculus step by step.',
            ],
            [
                'name' => 'Physics',
                'icon' => 'science',
                'color' => '#006590',
                'description' => 'Explore mechanics, energy, and the laws of nature.',
            ],
            [
                'name' => 'Biology',
                'icon' => 'biotech',
                'color' => '#755b00',
                'description' => 'From cells to ecosystems, understand living systems.',
            ],
            [
                'name' => 'History',
                'icon' => 'history_edu',
                'color' => '#755b00',
                'description' => 'Key events, civilizations, and turning points.',
            ],
            [
                'name' => 'English',
                'icon' => 'translate',
                'color' => '#006590',
                'description' => 'Grammar, writing, and literature comprehension.',
            ],
            [
                'name' => 'Chemistry',
                'icon' => 'experiment',
                'color' => '#2b6c00',
                'description' => 'Elements, reactions, and molecular structures.',
            ],
        ];

        foreach ($subjectsData as $sd) {
            $subject = Subject::firstOrCreate(
                ['slug' => Str::slug($sd['name'])],
                [
                    'name' => $sd['name'],
                    'description' => $sd['description'],
                    'icon' => $sd['icon'],
                    'color' => $sd['color'],
                    'is_active' => true,
                ]
            );

            // Units per subject (3 contoh untuk Mathematics, 2 untuk lainnya)
            $unitCount = $subject->slug === 'mathematics' ? 4 : 2;

            for ($i = 1; $i <= $unitCount; $i++) {
                $unit = Unit::firstOrCreate(
                    [
                        'subject_id' => $subject->id,
                        'title' => $this->unitTitle($subject->slug, $i),
                    ],
                    [
                        'description' => 'Core concepts, worked examples, and practice.',
                        'order_index' => $i,
                        'is_active' => true,
                    ]
                );

                // Materials per unit
                for ($j = 1; $j <= 3; $j++) {
                    Material::firstOrCreate(
                        [
                            'unit_id' => $unit->id,
                            'title' => $this->materialTitle($j),
                        ],
                        [
                            'content_type' => $this->materialType($j),
                            'content_url' => $j === 2 ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : null,
                            'text_content' => $j === 3 ? $this->sampleTextContent($unit->title) : null,
                            'duration_minutes' => 10 + ($j * 5),
                            'order_index' => $j,
                            'is_active' => true,
                            'created_by' => $authorId,
                        ]
                    );
                }
            }
        }

        // ===== Achievements =====
        $achievements = [
            ['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'Complete your first lesson.', 'icon' => 'directions_walk', 'category' => 'learning', 'type' => 'count', 'condition_key' => 'materials_completed', 'condition_value' => 1, 'xp_reward' => 50],
            ['name' => 'Bookworm', 'slug' => 'bookworm', 'description' => 'Complete 10 lessons.', 'icon' => 'menu_book', 'category' => 'learning', 'type' => 'count', 'condition_key' => 'materials_completed', 'condition_value' => 10, 'xp_reward' => 150],
            ['name' => 'Quiz Rookie', 'slug' => 'quiz-rookie', 'description' => 'Complete your first quiz.', 'icon' => 'quiz', 'category' => 'quiz', 'type' => 'count', 'condition_key' => 'quizzes_completed', 'condition_value' => 1, 'xp_reward' => 50],
            ['name' => 'Quiz Master', 'slug' => 'quiz-master', 'description' => 'Complete 25 quizzes.', 'icon' => 'workspace_premium', 'category' => 'quiz', 'type' => 'count', 'condition_key' => 'quizzes_completed', 'condition_value' => 25, 'xp_reward' => 300],
            ['name' => 'Perfect Score', 'slug' => 'perfect-score', 'description' => 'Score 100% on any quiz.', 'icon' => 'stars', 'category' => 'quiz', 'type' => 'score', 'condition_key' => 'quiz_score', 'condition_value' => 100, 'xp_reward' => 200],
            ['name' => 'High Achiever', 'slug' => 'high-achiever', 'description' => 'Score 90+ on any quiz.', 'icon' => 'military_tech', 'category' => 'quiz', 'type' => 'score', 'condition_key' => 'quiz_score', 'condition_value' => 90, 'xp_reward' => 100],
            ['name' => 'On Fire', 'slug' => 'on-fire', 'description' => 'Reach a 3-day streak.', 'icon' => 'local_fire_department', 'category' => 'streak', 'type' => 'streak', 'condition_key' => 'current_streak', 'condition_value' => 3, 'xp_reward' => 75],
            ['name' => 'Unstoppable', 'slug' => 'unstoppable', 'description' => 'Reach a 7-day streak.', 'icon' => 'bolt', 'category' => 'streak', 'type' => 'streak', 'condition_key' => 'current_streak', 'condition_value' => 7, 'xp_reward' => 250],
            ['name' => 'XP Collector', 'slug' => 'xp-collector', 'description' => 'Earn 1,000 XP.', 'icon' => 'diamond', 'category' => 'general', 'type' => 'xp', 'condition_key' => 'total_xp', 'condition_value' => 1000, 'xp_reward' => 100],
        ];

        foreach ($achievements as $a) {
            Achievement::firstOrCreate(['slug' => $a['slug']], $a);
        }

        // ===== Daily Quests =====
        $quests = [
            ['name' => 'Complete 2 Lessons', 'slug' => 'daily-2-lessons', 'description' => 'Finish 2 lessons today.', 'icon' => 'menu_book', 'type' => 'count', 'target_key' => 'materials_completed', 'target_value' => 2, 'xp_reward' => 40],
            ['name' => 'Take a Quiz', 'slug' => 'daily-quiz', 'description' => 'Complete 1 quiz today.', 'icon' => 'quiz', 'type' => 'count', 'target_key' => 'quizzes_completed', 'target_value' => 1, 'xp_reward' => 50],
        ];

        foreach ($quests as $q) {
            DailyQuest::firstOrCreate(['slug' => $q['slug']], $q);
        }
    }

    protected function unitTitle(string $slug, int $i): string
    {
        $titles = [
            'mathematics' => ['Numbers & Operations', 'Algebra Basics', 'Linear Equations', 'Geometry Fundamentals'],
            'physics' => ['Motion & Forces', 'Energy & Work'],
            'biology' => ['Cell Structure', 'Genetics Basics'],
            'history' => ['Ancient Civilizations', 'Modern Era'],
            'english' => ['Grammar Essentials', 'Writing Skills'],
            'chemistry' => ['Atomic Structure', 'Chemical Reactions'],
        ];

        return $titles[$slug][$i - 1] ?? "Unit {$i}";
    }

    protected function materialTitle(int $j): string
    {
        return match ($j) {
            1 => 'Video Lesson',
            2 => 'Reading Material',
            3 => 'Practice & Summary',
            default => "Lesson {$j}",
        };
    }

    protected function materialType(int $j): string
    {
        return match ($j) {
            1 => 'video',
            2 => 'text',
            3 => 'pdf',
            default => 'text',
        };
    }

    protected function sampleTextContent(string $unitTitle): string
    {
        return "<h2>{$unitTitle}</h2><p>Welcome to this unit. Work through each lesson in order: watch the video, read the material, then test yourself with practice questions.</p><ul><li>Step 1: Watch the video lesson</li><li>Step 2: Read the notes</li><li>Step 3: Complete the practice set</li></ul>";
    }
}
