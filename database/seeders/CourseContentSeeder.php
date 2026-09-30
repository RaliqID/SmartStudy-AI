<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Unit;
use App\Models\Material;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * CourseContentSeeder
 *
 * Populates each of the six core subjects (Mathematics, Physics, Biology,
 * History, English, Chemistry) with a real, subject-specific curriculum:
 * meaningful units plus topically accurate video / text / practice materials.
 *
 * Unlike DemoContentSeeder (which produces generic "Video Lesson" /
 * "Reading Material" / "Practice & Summary" placeholders), every unit here
 * has genuinely descriptive titles and real HTML study notes, so the app
 * looks convincingly populated.
 *
 * The seeder is fully idempotent — it uses firstOrCreate keyed on
 * (subject_id, unit title) and (unit_id, material title), so re-running it
 * only fills in missing rows and never duplicates or destroys data.
 */
class CourseContentSeeder extends Seeder
{
    /**
     * Generic placeholder material titles produced by DemoContentSeeder.
     * These are removed from any unit this seeder populates so the generic
     * boilerplate is replaced by real, topic-specific content.
     *
     * @var array<int, string>
     */
    private const PLACEHOLDER_TITLES = [
        'Video Lesson',
        'Reading Material',
        'Practice & Summary',
    ];

    /**
     * Map of YouTube embeds used for the video materials, cycled by index.
     *
     * @var array<int, string>
     */
    private array $videoIds = [
        'WUvTyaaNkzM', 'NybHckSEQBI', 'kJnYvgUJvPY', 'zw0ns2BmHf0',
        '2Zg--GK4tTM', '0JqWSCmwxLo', 'ZcbKbOzcOoo', 'fQ0Z3rJzIxE',
        'gHhbNbYzLnA', 'hMJQ0wUcDxY', 'vKwGQCJPyZs', 'VkXILbo1UbI',
    ];

    /**
     * The full curriculum, keyed by subject slug.
     *
     * Each subject is an ordered list of units; each unit is an ordered list
     * of materials. Material shape:
     *   - title            (string, required)
     *   - type             (video | text | pdf)
     *   - duration         (int, minutes)
     *   - content          (string, HTML — text/pdf only)
     *
     * @var array<string, array<int, array{title: string, description: string, materials: array<int, array<string, mixed>>}>>
     */
    private array $curriculum = [];

    /**
     * Cached author id for created materials (resolved on first use).
     */
    private ?int $authorId = null;

    /**
     * Attribute seeded materials to the demo teacher so the teacher-facing
     * Materials/Reports pages (scoped by created_by) are populated. Falls back
     * to the admin, then any user, when roles have not been seeded yet.
     */
    private function resolveAuthorId(): ?int
    {
        return \App\Models\User::role('teacher')->value('id')
            ?? \App\Models\User::role('admin')->value('id')
            ?? \App\Models\User::value('id');
    }

    public function run(): void
    {
        $this->curriculum = $this->buildCurriculum();

        foreach ($this->curriculum as $subjectSlug => $units) {
            $subject = Subject::where('slug', $subjectSlug)->first();

            if (! $subject) {
                $this->command?->warn("Skipping '{$subjectSlug}' — subject not found. Run DemoContentSeeder first.");

                continue;
            }

            foreach ($units as $unitIndex => $unitData) {
                $unit = Unit::firstOrCreate(
                    [
                        'subject_id' => $subject->id,
                        'title' => $unitData['title'],
                    ],
                    [
                        'description' => $unitData['description'],
                        'order_index' => $unitIndex + 1,
                        'is_active' => true,
                    ]
                );

                // Remove the generic placeholder materials that DemoContentSeeder
                // creates (same 3 titles for every unit) so this unit is left
                // holding only the real, subject-specific content below.
                // Only these exact placeholder titles are touched — no other
                // rows are ever deleted.
                Material::where('unit_id', $unit->id)
                    ->whereIn('title', self::PLACEHOLDER_TITLES)
                    ->delete();

                foreach ($unitData['materials'] as $materialIndex => $material) {
                    $type = $material['type'];

                    Material::firstOrCreate(
                        [
                            'unit_id' => $unit->id,
                            'title' => $material['title'],
                        ],
                        [
                            'content_type' => $type,
                            'content_url' => $type === 'video' ? $this->videoUrl($unitIndex, $materialIndex) : null,
                            'text_content' => $this->textContentFor($material),
                            'duration_minutes' => $material['duration'],
                            'order_index' => $materialIndex + 1,
                            'is_active' => true,
                            // Owned by the demo teacher so the teacher Materials
                            // page (which scopes by created_by) is populated.
                            'created_by' => $this->authorId ??= $this->resolveAuthorId(),
                        ]
                    );
                }
            }
        }
    }

    /**
     * Resolve the HTML body for a text/pdf material.
     */
    private function textContentFor(array $material): ?string
    {
        return $material['type'] === 'video'
            ? null
            : ($material['content'] ?? null);
    }

    /**
     * Deterministic, plausible YouTube embed URL for a video material.
     */
    private function videoUrl(int $unitIndex, int $materialIndex): string
    {
        $id = $this->videoIds[($unitIndex + $materialIndex) % count($this->videoIds)];

        return "https://www.youtube.com/embed/{$id}";
    }

    /**
     * Build and return the complete subject -> units -> materials tree.
     *
     * @return array<string, array<int, array{title: string, description: string, materials: array<int, array<string, mixed>>}>>
     */
    private function buildCurriculum(): array
    {
        return [
            'mathematics' => [
                [
                    'title' => 'Numbers & Operations',
                    'description' => 'Place value, the four operations, factors and fractions.',
                    'materials' => [
                        [
                            'title' => 'Understanding Place Value',
                            'type' => 'video',
                            'duration' => 12,
                        ],
                        [
                            'title' => 'Order of Operations (PEMDAS)',
                            'type' => 'text',
                            'duration' => 15,
                            'content' => $this->h(
                                'Order of Operations',
                                '<p>When an expression contains more than one operation, mathematicians agree on a fixed order so that everyone gets the same answer. The order is: <strong>Parentheses, Exponents, Multiplication and Division (left to right), then Addition and Subtraction (left to right)</strong> — often remembered as PEMDAS.</p>',
                                '<p>Work through this example: <strong>3 + 4 × 2</strong>. Multiplication comes before addition, so first compute 4 × 2 = 8, then add 3 to get <strong>11</strong>. If you simply went left to right you would wrongly get 14.</p>',
                                '<ul><li>Simplify anything inside parentheses first.</li><li>Evaluate exponents (powers and roots) next.</li><li>Do multiplication and division before addition and subtraction.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Fractions & Decimals Practice',
                            'type' => 'pdf',
                            'duration' => 20,
                            'content' => $this->h(
                                'Fractions & Decimals Practice',
                                '<p>This worksheet drills conversion between fractions and decimals, plus addition and subtraction of fractions with unlike denominators.</p>',
                                '<p>Key rule: to add fractions you need a common denominator. For example, 1/3 + 1/4 becomes 4/12 + 3/12 = <strong>7/12</strong>.</p>',
                                '<ul><li>Convert 3/5 to a decimal (answer: 0.6).</li><li>Simplify 18/24 (answer: 3/4).</li><li>Compute 2/7 + 3/7 (answer: 5/7).</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Algebra Basics',
                    'description' => 'Variables, expressions, and simplifying like terms.',
                    'materials' => [
                        [
                            'title' => 'What Are Variables?',
                            'type' => 'video',
                            'duration' => 10,
                        ],
                        [
                            'title' => 'Simplifying Algebraic Expressions',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'Simplifying Algebraic Expressions',
                                '<p>An <strong>algebraic expression</strong> combines numbers, variables and operations, such as 4x + 3y − 2x. A variable is simply a letter standing in for an unknown number.</p>',
                                '<p>To simplify, combine <strong>like terms</strong> — terms with the same variable and exponent. In 4x + 3y − 2x the terms 4x and −2x are alike, so they become 2x, leaving <strong>2x + 3y</strong>.</p>',
                                '<ul><li>Like terms: 5a and 3a — combine to 8a.</li><li>Unlike terms: 5a and 3b — cannot be combined.</li><li>Always keep the sign in front of each term with that term.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Like Terms Worksheet',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'Like Terms Worksheet',
                                '<p>Practise collecting like terms and using the distributive property to expand expressions.</p>',
                                '<p>Worked example: 3(2x + 5) expands to 6x + 15 because 3 multiplies each term inside the bracket.</p>',
                                '<ul><li>Simplify 7m + 2 − 3m + 8.</li><li>Expand 5(y − 4).</li><li>Simplify 2a + 3b − a + 4b.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Linear Equations',
                    'description' => 'Solving one-step and multi-step equations and graphing lines.',
                    'materials' => [
                        [
                            'title' => 'Solving One-Step Equations',
                            'type' => 'video',
                            'duration' => 14,
                        ],
                        [
                            'title' => 'Graphing Linear Functions',
                            'type' => 'text',
                            'duration' => 20,
                            'content' => $this->h(
                                'Graphing Linear Functions',
                                '<p>A linear function has the form <strong>y = mx + b</strong>, where m is the slope and b is the y-intercept — the point where the line crosses the y-axis.</p>',
                                '<p>To graph y = 2x + 1, start at the y-intercept (0, 1). The slope 2 means "rise 2, run 1", so from (0, 1) you move to (1, 3). Draw a straight line through the points.</p>',
                                '<ul><li>Slope m = rise ÷ run.</li><li>A positive slope rises left to right; a negative slope falls.</li><li>Two points are always enough to draw a straight line.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Slope & Intercept Practice',
                            'type' => 'pdf',
                            'duration' => 25,
                            'content' => $this->h(
                                'Slope & Intercept Practice',
                                '<p>Find slopes and intercepts, then sketch lines from their equations.</p>',
                                '<p>To isolate the variable in x + 5 = 12, subtract 5 from both sides to get <strong>x = 7</strong>. The same inverse-operation idea solves 3x = 21 by dividing both sides by 3 to get x = 7.</p>',
                                '<ul><li>Find the slope of the line through (1, 2) and (4, 8).</li><li>Graph y = −x + 4.</li><li>Write the equation of a line with slope 3 and y-intercept −2.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Geometry Fundamentals',
                    'description' => 'Angles, triangles, and the properties of polygons.',
                    'materials' => [
                        [
                            'title' => 'Angles & Their Measures',
                            'type' => 'video',
                            'duration' => 13,
                        ],
                        [
                            'title' => 'Triangles & the Angle Sum',
                            'type' => 'text',
                            'duration' => 16,
                            'content' => $this->h(
                                'Triangles & the Angle Sum',
                                '<p>A triangle is a three-sided polygon, and the interior angles of <strong>any</strong> triangle always add up to 180°.</p>',
                                '<p>If two angles of a triangle are 65° and 45°, the third must be 180 − 65 − 45 = <strong>70°</strong>. Triangles are classified by sides (equilateral, isosceles, scalene) and by angles (acute, right, obtuse).</p>',
                                '<ul><li>Equilateral: all three sides and angles equal (60° each).</li><li>Isosceles: two equal sides and two equal angles.</li><li>Right triangle: one angle is exactly 90°.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Polygon Properties Practice',
                            'type' => 'pdf',
                            'duration' => 24,
                            'content' => $this->h(
                                'Polygon Properties Practice',
                                '<p>Use the interior-angle formula and perimeter/area formulas for common polygons.</p>',
                                '<p>The sum of interior angles of an n-sided polygon is (n − 2) × 180°. For a hexagon (n = 6) that is 4 × 180 = <strong>720°</strong>.</p>',
                                '<ul><li>Find the area of a rectangle 8 cm by 5 cm.</li><li>Calculate the interior angle sum of a pentagon.</li><li>Find the third angle of a triangle given 30° and 90°.</li></ul>'
                            ),
                        ],
                    ],
                ],
            ],

            'physics' => [
                [
                    'title' => 'Motion & Forces',
                    'description' => "Speed, velocity, acceleration and Newton's laws.",
                    'materials' => [
                        [
                            'title' => 'Speed vs Velocity',
                            'type' => 'video',
                            'duration' => 11,
                        ],
                        [
                            'title' => "Newton's Three Laws of Motion",
                            'type' => 'text',
                            'duration' => 20,
                            'content' => $this->h(
                                "Newton's Three Laws of Motion",
                                '<p>Newton\'s laws describe how forces change the motion of objects. The <strong>first law</strong> (inertia) says an object stays at rest or moves at constant velocity unless acted on by a net force.</p>',
                                '<p>The <strong>second law</strong> is F = m × a: force equals mass times acceleration. A 2 kg object accelerating at 3 m/s² requires a force of 6 N. The <strong>third law</strong> states that every action has an equal and opposite reaction.</p>',
                                '<ul><li>First law — inertia: objects resist changes to their motion.</li><li>Second law — F = ma relates force, mass and acceleration.</li><li>Third law — forces come in equal and opposite pairs.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Force & Acceleration Problems',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'Force & Acceleration Problems',
                                '<p>Apply F = ma to solve for the unknown quantity in each problem.</p>',
                                '<p>Rearrange the formula as needed: to find acceleration use a = F ÷ m, and to find mass use m = F ÷ a. Watch your units — Newtons, kilograms and m/s².</p>',
                                '<ul><li>Find the force on a 10 kg mass accelerating at 2 m/s².</li><li>A 12 N force acts on 4 kg — what is the acceleration?</li><li>Explain why a seatbelt matters using the first law.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Energy & Work',
                    'description' => 'Work, kinetic and potential energy, and conservation of energy.',
                    'materials' => [
                        [
                            'title' => 'Kinetic & Potential Energy',
                            'type' => 'video',
                            'duration' => 15,
                        ],
                        [
                            'title' => 'Work and the Conservation of Energy',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'Work and the Conservation of Energy',
                                '<p><strong>Work</strong> is done when a force moves an object over a distance: W = F × d. Pushing a box 3 m with a 10 N force does 30 joules of work.</p>',
                                '<p>Energy cannot be created or destroyed, only transformed. As a ball falls, its gravitational potential energy (PE = mgh) converts into kinetic energy (KE = ½mv²). At the top all the energy is potential; just before impact nearly all of it is kinetic.</p>',
                                '<ul><li>KE = ½ × mass × velocity².</li><li>PE = mass × gravity × height.</li><li>Total mechanical energy stays constant without friction.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Energy Calculations Practice',
                            'type' => 'pdf',
                            'duration' => 26,
                            'content' => $this->h(
                                'Energy Calculations Practice',
                                '<p>Compute kinetic and potential energy, then trace energy transformations.</p>',
                                '<p>Example: a 2 kg ball moving at 3 m/s has KE = ½ × 2 × 3² = <strong>9 J</strong>. A book raised 2 m on Earth (g ≈ 9.8 m/s²) has PE ≈ 19.6 × mass joules.</p>',
                                '<ul><li>Find the KE of a 4 kg object at 5 m/s.</li><li>Find the PE of a 3 kg mass raised 10 m.</li><li>Describe energy changes on a roller coaster.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Waves & Optics',
                    'description' => 'Wave properties, the electromagnetic spectrum, and light.',
                    'materials' => [
                        [
                            'title' => 'Wave Properties: Amplitude & Frequency',
                            'type' => 'video',
                            'duration' => 13,
                        ],
                        [
                            'title' => 'Reflection and Refraction of Light',
                            'type' => 'text',
                            'duration' => 17,
                            'content' => $this->h(
                                'Reflection and Refraction of Light',
                                '<p><strong>Reflection</strong> happens when light bounces off a surface: the angle of incidence equals the angle of reflection. This is why you can see yourself in a mirror.</p>',
                                '<p><strong>Refraction</strong> is the bending of light as it passes between materials of different density, such as from air into water. The change in speed causes the bend, which is why a straw looks broken in a glass of water.</p>',
                                '<ul><li>Reflection: angle in = angle out.</li><li>Refraction: light bends because its speed changes.</li><li>Prisms split white light into the spectrum by refraction.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Wave Speed Problems',
                            'type' => 'pdf',
                            'duration' => 20,
                            'content' => $this->h(
                                'Wave Speed Problems',
                                '<p>Use the wave equation v = f × λ (speed equals frequency times wavelength).</p>',
                                '<p>A wave with frequency 50 Hz and wavelength 2 m travels at 50 × 2 = <strong>100 m/s</strong>. Frequency is measured in hertz (Hz) and wavelength in metres.</p>',
                                '<ul><li>A 200 Hz wave has a 1.5 m wavelength — find its speed.</li><li>List the regions of the electromagnetic spectrum.</li><li>Explain why sound needs a medium but light does not.</li></ul>'
                            ),
                        ],
                    ],
                ],
            ],

            'biology' => [
                [
                    'title' => 'Cell Structure',
                    'description' => 'Organelles, and the difference between prokaryotes and eukaryotes.',
                    'materials' => [
                        [
                            'title' => 'Parts of a Cell',
                            'type' => 'video',
                            'duration' => 12,
                        ],
                        [
                            'title' => 'Prokaryotes vs Eukaryotes',
                            'type' => 'text',
                            'duration' => 16,
                            'content' => $this->h(
                                'Prokaryotes vs Eukaryotes',
                                '<p><strong>Prokaryotic</strong> cells (bacteria) have no nucleus — their DNA floats freely in the cytoplasm. <strong>Eukaryotic</strong> cells (plants, animals, fungi) contain a true nucleus that holds the DNA.</p>',
                                '<p>Eukaryotes also contain membrane-bound organelles such as mitochondria (energy) and the endoplasmic reticulum (protein transport), which prokaryotes lack. Both cell types are surrounded by a plasma membrane and contain ribosomes.</p>',
                                '<ul><li>Prokaryotes: no nucleus, no membrane-bound organelles.</li><li>Eukaryotes: nucleus plus specialised organelles.</li><li>Mitochondria are the "powerhouse" of the eukaryotic cell.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Cell Diagram Worksheet',
                            'type' => 'pdf',
                            'duration' => 20,
                            'content' => $this->h(
                                'Cell Diagram Worksheet',
                                '<p>Label the organelles of plant and animal cells and match each to its function.</p>',
                                '<p>The <strong>nucleus</strong> controls the cell and stores DNA, the <strong>cell membrane</strong> controls what enters and exits, and chloroplasts in plant cells carry out photosynthesis.</p>',
                                '<ul><li>Label: nucleus, membrane, mitochondria, ribosomes.</li><li>List two structures found in plant but not animal cells.</li><li>Describe the job of the cell wall.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Genetics Basics',
                    'description' => 'DNA, genes, alleles, and patterns of inheritance.',
                    'materials' => [
                        [
                            'title' => 'DNA and Genes Explained',
                            'type' => 'video',
                            'duration' => 14,
                        ],
                        [
                            'title' => 'Alleles and Inheritance',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'Alleles and Inheritance',
                                '<p><strong>DNA</strong> is the molecule that stores genetic information; a <strong>gene</strong> is a section of DNA that codes for a trait. Different versions of a gene are called <strong>alleles</strong>.</p>',
                                '<p>An organism inherits one allele from each parent. A <strong>dominant</strong> allele is expressed even if only one copy is present, while a <strong>recessive</strong> allele shows only when two copies are inherited. In a Punnett square, Bb × Bb gives a 3:1 ratio of dominant to recessive offspring.</p>',
                                '<ul><li>Genotype = the allele combination; phenotype = the visible trait.</li><li>Homozygous = two identical alleles; heterozygous = two different.</li><li>Recessive traits appear only in homozygous individuals.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Punnett Square Practice',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'Punnett Square Practice',
                                '<p>Draw Punnett squares and predict the probability of each genotype and phenotype.</p>',
                                '<p>Crossing two heterozygous parents (Bb × Bb) yields genotypes BB, Bb, Bb, bb — so 75% show the dominant trait and 25% the recessive trait.</p>',
                                '<ul><li>Cross Bb × bb and list the outcomes.</li><li>What fraction will show the recessive trait?</li><li>Define genotype and phenotype in your own words.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Human Body Systems',
                    'description' => 'Circulatory, respiratory, and digestive systems.',
                    'materials' => [
                        [
                            'title' => 'The Circulatory System',
                            'type' => 'video',
                            'duration' => 13,
                        ],
                        [
                            'title' => 'Circulation and Gas Exchange',
                            'type' => 'text',
                            'duration' => 19,
                            'content' => $this->h(
                                'Circulation and Gas Exchange',
                                '<p>The <strong>circulatory system</strong> uses the heart as a pump to move blood through arteries, capillaries and veins. Blood carries oxygen, nutrients and hormones while removing carbon dioxide and waste.</p>',
                                '<p>In the lungs, <strong>gas exchange</strong> occurs across the thin walls of the alveoli: oxygen diffuses into the blood and carbon dioxide diffuses out. This links the respiratory and circulatory systems into one transport network.</p>',
                                '<ul><li>Arteries carry blood away from the heart; veins carry it back.</li><li>Capillaries are one cell thick for efficient exchange.</li><li>Alveoli provide a huge surface area for gas exchange.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Body Systems Review Sheet',
                            'type' => 'pdf',
                            'duration' => 24,
                            'content' => $this->h(
                                'Body Systems Review Sheet',
                                '<p>Match each organ to its system and describe how the systems work together.</p>',
                                '<p>Digestion begins in the mouth and continues in the stomach and small intestine, where nutrients are absorbed into the bloodstream and delivered by the circulatory system.</p>',
                                '<ul><li>Match: heart, lungs, stomach, small intestine.</li><li>Name the main function of the respiratory system.</li><li>Explain how digestion and circulation rely on each other.</li></ul>'
                            ),
                        ],
                    ],
                ],
            ],

            'history' => [
                [
                    'title' => 'Ancient Civilizations',
                    'description' => 'Mesopotamia, Egypt, and the first great cities.',
                    'materials' => [
                        [
                            'title' => 'The Rise of Mesopotamia',
                            'type' => 'video',
                            'duration' => 14,
                        ],
                        [
                            'title' => 'Ancient Egypt and the Nile',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'Ancient Egypt and the Nile',
                                '<p>Ancient Egyptian civilization flourished along the <strong>Nile River</strong> for over three thousand years. The Nile\'s predictable annual flooding deposited fertile soil, making large-scale farming possible in an otherwise desert region.</p>',
                                '<p>Stable agriculture supported cities, a powerful state and monumental architecture — the Great Pyramid of Giza was built around 2560 BCE. The Egyptians also developed hieroglyphic writing and a calendar based on the flooding cycle.</p>',
                                '<ul><li>The Nile provided water, transport and fertile land.</li><li>The pharaoh was both political and religious leader.</li><li>Hieroglyphs and papyrus preserved records.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Ancient Civilizations Timeline',
                            'type' => 'pdf',
                            'duration' => 20,
                            'content' => $this->h(
                                'Ancient Civilizations Timeline',
                                '<p>Place key events of Mesopotamia, Egypt, the Indus Valley and Shang China in chronological order.</p>',
                                '<p>Writing first appeared in Mesopotamia around 3200 BCE with cuneiform — wedge-shaped marks pressed into clay tablets used for trade records.</p>',
                                '<ul><li>Order: Sumer, Old Kingdom Egypt, Hammurabi\'s Code.</li><li>Which civilization built Mohenjo-daro?</li><li>Name two inventions credited to Mesopotamia.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Modern Era',
                    'description' => 'The twentieth century, global conflict, and the world today.',
                    'materials' => [
                        [
                            'title' => 'The Cold War in Brief',
                            'type' => 'video',
                            'duration' => 14,
                        ],
                        [
                            'title' => 'Decolonisation and the Modern World',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'Decolonisation and the Modern World',
                                '<p>After 1945 the world reorganised around two superpowers — the United States and the Soviet Union — in the decades-long <strong>Cold War</strong>. This rivalry shaped global politics, technology and space exploration.</p>',
                                '<p>At the same time, former colonies in Africa and Asia won independence in a wave of <strong>decolonisation</strong>. New nations joined the United Nations, and the balance of global power shifted away from European empires.</p>',
                                '<ul><li>The Cold War was a standoff without direct superpower war.</li><li>Decolonisation created dozens of new states.</li><li>The UN became a key forum for international diplomacy.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Modern Era Timeline Task',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'Modern Era Timeline Task',
                                '<p>Build a timeline of twentieth-century events and note cause and effect between them.</p>',
                                '<p>Key markers include the founding of the UN (1945), the Berlin Wall\'s fall (1989) and the collapse of the Soviet Union (1991), which ended the Cold War.</p>',
                                '<ul><li>Place these events in order on a timeline.</li><li>Give one cause of the Cold War.</li><li>Explain why 1991 was a turning point.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'World War II',
                    'description' => 'Causes, major events, and the aftermath of the global conflict.',
                    'materials' => [
                        [
                            'title' => 'Causes of World War II',
                            'type' => 'video',
                            'duration' => 15,
                        ],
                        [
                            'title' => 'Key Turning Points of the War',
                            'type' => 'text',
                            'duration' => 20,
                            'content' => $this->h(
                                'Key Turning Points of the War',
                                '<p>World War II (1939–1945) reshaped the modern world. It began when Germany invaded Poland on 1 September 1939, drawing Britain and France into the conflict.</p>',
                                '<p>Several battles proved decisive. The <strong>Battle of Stalingrad</strong> (1942–43) halted Germany\'s advance in the east, while <strong>D-Day</strong> (6 June 1944) opened a western front. In the Pacific, the Battle of Midway shifted the balance against Japan.</p>',
                                '<ul><li>1939: Invasion of Poland begins the war.</li><li>1944: D-Day landings open the western front.</li><li>1945: War in Europe ends in May, in the Pacific in September.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'WWII Events Match-Up',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'WWII Events Match-Up',
                                '<p>Match dates to events and describe each event\'s significance.</p>',
                                '<p>After the war, the United Nations was founded (1945) to promote peace and prevent another global conflict of that scale.</p>',
                                '<ul><li>Match: 1939, 1941, 1944, 1945 to major events.</li><li>What was the significance of Pearl Harbor?</li><li>Why was the UN created?</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'The Industrial Revolution',
                    'description' => 'Inventions, factories, and social change.',
                    'materials' => [
                        [
                            'title' => 'Inventions of the Industrial Age',
                            'type' => 'video',
                            'duration' => 13,
                        ],
                        [
                            'title' => 'From Farms to Factories',
                            'type' => 'text',
                            'duration' => 17,
                            'content' => $this->h(
                                'From Farms to Factories',
                                '<p>The <strong>Industrial Revolution</strong> began in Britain in the late 1700s. The steam engine, mechanised textile mills and improved iron production transformed how goods were made.</p>',
                                '<p>Millions moved from rural villages into rapidly growing cities to work in factories. This <strong>urbanisation</strong> created new opportunities but also overcrowding, long working hours and pollution, prompting early labour reforms and the growth of trade unions.</p>',
                                '<ul><li>Steam power replaced human and animal labour.</li><li>Factory work was central to the new economy.</li><li>Railways and canals linked markets quickly.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Industrial Revolution Sources',
                            'type' => 'pdf',
                            'duration' => 24,
                            'content' => $this->h(
                                'Industrial Revolution Sources',
                                '<p>Analyse primary sources describing working conditions in nineteenth-century factories.</p>',
                                '<p>Historians use testimony, factory reports and census data to assess how ordinary people experienced industrial change.</p>',
                                '<ul><li>List three social effects of industrialisation.</li><li>Compare rural and urban life in this era.</li><li>Why did trade unions form?</li></ul>'
                            ),
                        ],
                    ],
                ],
            ],

            'english' => [
                [
                    'title' => 'Grammar Essentials',
                    'description' => 'Parts of speech, sentence structure, and punctuation.',
                    'materials' => [
                        [
                            'title' => 'Parts of Speech Overview',
                            'type' => 'video',
                            'duration' => 12,
                        ],
                        [
                            'title' => 'Sentence Structure & Punctuation',
                            'type' => 'text',
                            'duration' => 16,
                            'content' => $this->h(
                                'Sentence Structure & Punctuation',
                                '<p>Every complete sentence needs a <strong>subject</strong> (who or what the sentence is about) and a <strong>predicate</strong> (what the subject does or is). "The dog barked" is a complete sentence; "The dog" on its own is a fragment.</p>',
                                '<p>Punctuation clarifies meaning. A full stop ends a statement, a comma separates items in a list or clauses, and an apostrophe shows possession (the cat\'s toy) or contraction (do not → don\'t).</p>',
                                '<ul><li>Subject + predicate = a complete sentence.</li><li>Use commas to separate independent clauses with a conjunction.</li><li>Avoid run-on sentences with proper punctuation.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Grammar & Punctuation Exercises',
                            'type' => 'pdf',
                            'duration' => 20,
                            'content' => $this->h(
                                'Grammar & Punctuation Exercises',
                                '<p>Identify parts of speech and correct the punctuation in each sentence.</p>',
                                '<p>Watch for common errors: confusing "its" (possessive) with "it\'s" (it is), and using a comma splice where a full stop or semicolon is required.</p>',
                                '<ul><li>Label the parts of speech in a short sentence.</li><li>Fix punctuation in five incorrect sentences.</li><li>Rewrite two fragments as complete sentences.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Writing Skills',
                    'description' => 'Paragraphs, essay structure, and persuasive writing.',
                    'materials' => [
                        [
                            'title' => 'Building Strong Paragraphs',
                            'type' => 'video',
                            'duration' => 11,
                        ],
                        [
                            'title' => 'The Five-Paragraph Essay',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'The Five-Paragraph Essay',
                                '<p>A classic essay has an <strong>introduction</strong>, three <strong>body paragraphs</strong> and a <strong>conclusion</strong>. The introduction ends with a thesis statement that states your main argument.</p>',
                                '<p>Each body paragraph should begin with a topic sentence, provide evidence, and explain how that evidence supports the thesis. The conclusion restates the thesis in fresh words and summarises the argument without introducing new ideas.</p>',
                                '<ul><li>Thesis = the central claim of your essay.</li><li>Each body paragraph covers one main point.</li><li>Transitions link ideas smoothly between paragraphs.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Persuasive Essay Practice',
                            'type' => 'pdf',
                            'duration' => 25,
                            'content' => $this->h(
                                'Persuasive Essay Practice',
                                '<p>Plan and draft a persuasive essay using ethos, pathos and logos.</p>',
                                '<p><strong>Ethos</strong> builds credibility, <strong>pathos</strong> appeals to emotion, and <strong>logos</strong> uses logic and evidence. Strong arguments combine all three.</p>',
                                '<ul><li>Choose a debatable topic and write a thesis.</li><li>Outline three supporting arguments.</li><li>Add a counter-argument and rebuttal.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Literature & Reading',
                    'description' => 'Comprehension, literary devices, and character analysis.',
                    'materials' => [
                        [
                            'title' => 'Identifying Literary Devices',
                            'type' => 'video',
                            'duration' => 13,
                        ],
                        [
                            'title' => 'Theme, Symbolism and Character',
                            'type' => 'text',
                            'duration' => 17,
                            'content' => $this->h(
                                'Theme, Symbolism and Character',
                                '<p>A <strong>theme</strong> is the central idea a text explores, such as love, justice or loss — it is different from the plot, which is what literally happens.</p>',
                                '<p><strong>Symbolism</strong> uses objects to represent larger ideas; a rising sun might symbolise hope. A <strong>character</strong> is developed through what they say, do, and how others respond to them, as well as through direct description.</p>',
                                '<ul><li>Theme = underlying message; plot = the events.</li><li>Symbols carry meaning beyond the literal.</li><li>Characterisation can be direct or indirect.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Literary Analysis Worksheet',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'Literary Analysis Worksheet',
                                '<p>Analyse an extract by identifying its theme, imagery and character development.</p>',
                                '<p>Support every point with a short quotation from the text, then explain how the quotation proves your interpretation.</p>',
                                '<ul><li>Name the theme of the passage.</li><li>Find one symbol and explain its meaning.</li><li>Describe how the main character changes.</li></ul>'
                            ),
                        ],
                    ],
                ],
            ],

            'chemistry' => [
                [
                    'title' => 'Atomic Structure',
                    'description' => 'Protons, neutrons, electrons and the periodic table.',
                    'materials' => [
                        [
                            'title' => 'Inside the Atom',
                            'type' => 'video',
                            'duration' => 12,
                        ],
                        [
                            'title' => 'The Periodic Table Explained',
                            'type' => 'text',
                            'duration' => 18,
                            'content' => $this->h(
                                'The Periodic Table Explained',
                                '<p>Atoms consist of a central <strong>nucleus</strong> of protons and neutrons, surrounded by <strong>electrons</strong>. The number of protons (the atomic number) defines the element.</p>',
                                '<p>The periodic table arranges elements by increasing atomic number. Columns are called <strong>groups</strong> and rows are <strong>periods</strong>. Elements in the same group share similar chemical properties because they have the same number of outer-shell electrons.</p>',
                                '<ul><li>Atomic number = number of protons.</li><li>Group 1 metals are highly reactive.</li><li>Group 18 noble gases are largely inert.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Atomic Structure Worksheet',
                            'type' => 'pdf',
                            'duration' => 20,
                            'content' => $this->h(
                                'Atomic Structure Worksheet',
                                '<p>Determine the number of protons, neutrons and electrons for given elements and isotopes.</p>',
                                '<p>In a neutral atom the number of electrons equals the number of protons. The mass number is the total of protons and neutrons, so neutrons = mass number − atomic number.</p>',
                                '<ul><li>How many protons does carbon (Z = 6) have?</li><li>Find the neutrons in an isotope with mass 14.</li><li>Sketch the electron shells of oxygen.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Chemical Reactions',
                    'description' => 'Types of reactions, balancing equations and conservation of mass.',
                    'materials' => [
                        [
                            'title' => 'Balancing Chemical Equations',
                            'type' => 'video',
                            'duration' => 15,
                        ],
                        [
                            'title' => 'Types of Chemical Reactions',
                            'type' => 'text',
                            'duration' => 19,
                            'content' => $this->h(
                                'Types of Chemical Reactions',
                                '<p>Chemical reactions follow the law of <strong>conservation of mass</strong>: atoms are rearranged, never created or destroyed. This is why equations must be balanced.</p>',
                                '<p>Common reaction types include <strong>synthesis</strong> (A + B → AB), <strong>decomposition</strong> (AB → A + B), <strong>single replacement</strong>, <strong>double replacement</strong>, and <strong>combustion</strong>, which produces carbon dioxide and water from a fuel and oxygen.</p>',
                                '<ul><li>Synthesis combines; decomposition splits.</li><li>Combustion needs oxygen and releases energy.</li><li>Balancing keeps atom counts equal on both sides.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'Reaction Practice Set',
                            'type' => 'pdf',
                            'duration' => 24,
                            'content' => $this->h(
                                'Reaction Practice Set',
                                '<p>Classify reactions and balance the equations, checking that each element has equal atoms on both sides.</p>',
                                '<p>Example: to balance H₂ + O₂ → H₂O use coefficients 2H₂ + O₂ → 2H₂O, giving four hydrogen and two oxygen atoms on each side.</p>',
                                '<ul><li>Classify: 2Mg + O₂ → 2MgO.</li><li>Balance: Fe + O₂ → Fe₂O₃.</li><li>Identify the products of methane combustion.</li></ul>'
                            ),
                        ],
                    ],
                ],
                [
                    'title' => 'Acids, Bases & pH',
                    'description' => 'The pH scale, neutralisation, and common reactions.',
                    'materials' => [
                        [
                            'title' => 'Understanding the pH Scale',
                            'type' => 'video',
                            'duration' => 12,
                        ],
                        [
                            'title' => 'Acids, Bases and Neutralisation',
                            'type' => 'text',
                            'duration' => 17,
                            'content' => $this->h(
                                'Acids, Bases and Neutralisation',
                                '<p>The <strong>pH scale</strong> runs from 0 to 14. Values below 7 are <strong>acidic</strong> (like lemon juice), 7 is <strong>neutral</strong> (pure water), and above 7 is <strong>basic</strong> (like soap).</p>',
                                '<p>Acids release hydrogen ions (H⁺) in solution; bases release hydroxide ions (OH⁻). When an acid and a base react they <strong>neutralise</strong> each other, producing a salt and water — for example HCl + NaOH → NaCl + H₂O.</p>',
                                '<ul><li>pH &lt; 7 = acid, pH &gt; 7 = base.</li><li>Each whole step changes acidity tenfold.</li><li>Neutralisation forms a salt plus water.</li></ul>'
                            ),
                        ],
                        [
                            'title' => 'pH & Neutralisation Practice',
                            'type' => 'pdf',
                            'duration' => 22,
                            'content' => $this->h(
                                'pH & Neutralisation Practice',
                                '<p>Classify substances by pH and write balanced neutralisation equations.</p>',
                                '<p>Indicators such as litmus and universal indicator change colour with pH — red in acid, blue and green through neutral, purple in strong base.</p>',
                                '<ul><li>Classify: vinegar, baking soda, pure water.</li><li>Write the equation for HCl + KOH.</li><li>Explain why each pH step is a tenfold change.</li></ul>'
                            ),
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Small helper that assembles HTML study notes from a heading and
     * a variable number of block fragments (paragraphs / lists).
     */
    private function h(string $heading, string ...$blocks): string
    {
        return '<h2>' . $heading . '</h2>' . implode('', $blocks);
    }
}
