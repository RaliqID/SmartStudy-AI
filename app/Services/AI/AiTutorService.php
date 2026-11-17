<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * SmartStudy AI — AI Tutor Service.
 * Provider: OpenAI-compatible gateway (e.g. 9router, OpenAI, Ollama).
 * Features automatic smart educational fallback when external gateway is not configured or unreachable.
 *
 * All settings are read from config (config/services.php) rather than env()
 * so that the service keeps working after `php artisan config:cache`.
 *
 * .env keys: AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_TIMEOUT, AI_MAX_TOKENS
 */
class AiTutorService
{
    protected string $baseUrl;

    protected string $apiKey;

    protected string $model;

    protected int $timeout;

    protected int $maxTokens;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.ai.base_url'), '/');
        $this->apiKey = (string) config('services.ai.api_key');
        $this->model = (string) config('services.ai.model', 'Dev-Stack');
        $this->timeout = (int) config('services.ai.timeout', 60);
        $this->maxTokens = (int) config('services.ai.max_tokens', 4096);
    }

    /**
     * Check if an external AI gateway is configured.
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== '' && $this->baseUrl !== '';
    }

    /**
     * System prompt — persona AI tutor untuk konteks belajar.
     */
    public function systemPrompt(?string $subjectName = null, ?string $unitName = null): string
    {
        $context = '';
        if ($subjectName) {
            $context .= "The student is currently studying: {$subjectName}.";
            if ($unitName) {
                $context .= " Current unit/topic: {$unitName}.";
            }
        }

        return <<<PROMPT
You are SmartStudy AI Tutor — a friendly, encouraging AI tutor for an e-learning platform.
{$context}
Guidelines:
- Explain concepts step by step, simply and clearly.
- Use examples relevant to the subject when possible.
- Encourage the student; celebrate correct thinking.
- Keep answers concise but complete (max ~300 words unless asked for more).
- If the student asks something unrelated to learning, gently steer back to studying.
- Respond in the same language the student uses.
PROMPT;
    }

    /**
     * Chat completion — non-streaming.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array{content: string, prompt_tokens: ?int, completion_tokens: ?int}
     */
    public function chat(array $messages, ?string $systemContext = null): array
    {
        if ($this->isConfigured()) {
            try {
                $payload = [
                    'model' => $this->model,
                    'messages' => array_merge(
                        [['role' => 'system', 'content' => $systemContext ?? $this->systemPrompt()]],
                        $messages,
                    ),
                    'max_tokens' => $this->maxTokens,
                ];

                $response = Http::withToken($this->apiKey)
                    ->timeout($this->timeout)
                    ->retry(2, 1000)
                    ->post("{$this->baseUrl}/chat/completions", $payload);

                if ($response->successful()) {
                    $data = $response->json();

                    return [
                        'content' => $data['choices'][0]['message']['content'] ?? '',
                        'prompt_tokens' => $data['usage']['prompt_tokens'] ?? null,
                        'completion_tokens' => $data['usage']['completion_tokens'] ?? null,
                    ];
                }

                logger()->warning('AI Tutor API error from gateway, falling back to local engine', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
            } catch (\Throwable $e) {
                logger()->warning('AI Tutor API connection failed, falling back to local engine', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Local smart fallback
        $userMessage = $this->extractLatestUserMessage($messages);

        return [
            'content' => $this->generateSmartResponse($userMessage, $systemContext),
            'prompt_tokens' => null,
            'completion_tokens' => null,
        ];
    }

    /**
     * Chat completion — streaming (SSE chunks via generator).
     * Yields plain-text deltas.
     */
    public function chatStream(array $messages, ?string $systemContext = null): \Generator
    {
        if ($this->isConfigured()) {
            try {
                $payload = [
                    'model' => $this->model,
                    'messages' => array_merge(
                        [['role' => 'system', 'content' => $systemContext ?? $this->systemPrompt()]],
                        $messages,
                    ),
                    'max_tokens' => $this->maxTokens,
                    'stream' => true,
                ];

                $response = Http::withToken($this->apiKey)
                    ->timeout($this->timeout)
                    ->post("{$this->baseUrl}/chat/completions", $payload);

                if ($response->successful()) {
                    $stream = $response->toPsrResponse()->getBody();

                    while (! $stream->eof()) {
                        $line = $this->readSseLine($stream);

                        if ($line === null) {
                            continue;
                        }

                        if (str_starts_with($line, 'data: ')) {
                            $data = trim(substr($line, 6));

                            if ($data === '[DONE]') {
                                return;
                            }

                            $json = json_decode($data, true);
                            $delta = $json['choices'][0]['delta']['content'] ?? null;

                            if ($delta !== null && $delta !== '') {
                                yield $delta;
                            }
                        }
                    }

                    return;
                }

                logger()->warning('AI Tutor stream request failed, falling back to local engine', [
                    'status' => $response->status(),
                ]);
            } catch (\Throwable $e) {
                logger()->warning('AI Tutor stream connection failed, falling back to local engine', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Local smart generator stream
        $userMessage = $this->extractLatestUserMessage($messages);
        yield from $this->streamFallback($userMessage, $systemContext);
    }

    /**
     * Rekomendasi belajar personal — dipakai "Recommended for You" di dashboard.
     */
    public function learningRecommendation(string $studentContext): string
    {
        $result = $this->chat(
            [[
                'role' => 'user',
                'content' => "Based on this student's progress data, suggest the single most valuable next study action in one short sentence (max 25 words).\n\n{$studentContext}",
            ]],
            'You are a study-planning assistant. Reply with one actionable recommendation only, no preamble.'
        );

        return $result['content'] ?: 'Lanjutkan kuis harian dan review materi untuk menjaga streak belajarmu!';
    }

    /**
     * Penjelasan kenapa jawaban quiz benar/salah.
     */
    public function explainAnswer(string $questionText, string $studentAnswer, string $correctAnswer): string
    {
        $messages = [[
            'role' => 'user',
            'content' => "Question: {$questionText}\nStudent's answer: {$studentAnswer}\nCorrect answer: {$correctAnswer}\n\nExplain briefly (max 3 sentences) why the student's answer is correct or incorrect, and the key concept to remember.",
        ]];

        return $this->chat($messages, 'You are a quiz-review assistant. Be concise, kind, and clear.')['content'];
    }

    /**
     * Generate related topics untuk percakapan AI Tutor (opsional 3).
     * Return array of {title, subtitle} max 3 item.
     */
    public function relatedTopics(string $userMessage, string $assistantReply, ?string $subjectName = null): array
    {
        if ($this->isConfigured()) {
            try {
                $subjectLine = $subjectName ? "Subject context: {$subjectName}." : '';

                $result = $this->chat(
                    [[
                        'role' => 'user',
                        'content' => "Student asked: {$userMessage}\n\nTutor answered: ".Str::limit($assistantReply, 800)."\n\n{$subjectLine}\nSuggest 3 related study topics the student could explore next. Reply ONLY with a JSON array like: [{\"title\":\"Topic name\",\"subtitle\":\"Why it matters — max 8 words\"}]. No markdown, no explanation.",
                    ]],
                    'You generate study topic suggestions. Reply with valid JSON array only, max 3 items.'
                );

                $content = trim($result['content']);
                $content = preg_replace('/^```(json)?\s*|\s*```$/', '', $content);
                $topics = json_decode($content, true);

                if (is_array($topics) && ! empty($topics)) {
                    return collect($topics)
                        ->take(3)
                        ->filter(fn ($t) => is_array($t) && ! empty($t['title']))
                        ->map(fn ($t) => [
                            'title' => (string) $t['title'],
                            'subtitle' => (string) ($t['subtitle'] ?? 'Pelajari topik ini'),
                        ])
                        ->values()
                        ->all();
                }
            } catch (\Throwable $e) {
                logger()->warning('Related topics generation via API failed', ['error' => $e->getMessage()]);
            }
        }

        // Fallback related topics
        return $this->generateFallbackTopics($userMessage, $subjectName);
    }

    /**
     * Extract the latest user message from the messages array.
     */
    protected function extractLatestUserMessage(array $messages): string
    {
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            if (($messages[$i]['role'] ?? '') === 'user') {
                return (string) ($messages[$i]['content'] ?? '');
            }
        }

        return '';
    }

    /**
     * Stream fallback response with typing simulation.
     */
    protected function streamFallback(string $userMessage, ?string $systemContext = null): \Generator
    {
        $response = $this->generateSmartResponse($userMessage, $systemContext);

        // Split text into readable tokens/chunks (roughly 1 to 3 words or punctuation)
        $words = preg_split('/(\s+|[.,!?:;\n]+)/u', $response, -1, PREG_SPLIT_DELIM_CAPTURE);

        $buffer = '';
        foreach ($words as $piece) {
            $buffer .= $piece;
            if (mb_strlen($buffer) >= 6 || str_contains($piece, "\n")) {
                yield $buffer;
                $buffer = '';
                usleep(15000); // 15ms delay for smooth typing effect
            }
        }

        if ($buffer !== '') {
            yield $buffer;
        }
    }

    /**
     * Smart local educator response generator.
     */
    public function generateSmartResponse(string $userMessage, ?string $context = null): string
    {
        $text = trim($userMessage);
        $lower = mb_strtolower($text);

        // Check if Indonesian or English
        $isIndonesian = preg_match('/\b(halo|hai|apa|siapa|kenapa|mengapa|bagaimana|jelaskan|tolong|bantu|belajar|rumus|materi|soal|apakah|bisa|saya|kamu|guru|tutor|tanya)\b/i', $text)
            || ! preg_match('/\b(the|is|are|how|what|why|explain|please|help|math|science)\b/i', $text);

        // Greetings
        if (preg_match('/\b(halo|hai|hei|pagi|siang|sore|malam|assalamualaikum|permisi|hello|hi|hey)\b/i', $text)) {
            if ($isIndonesian) {
                return "Halo! 👋 Senang bertemu denganmu di **SmartStudy AI**.\n\nSaya adalah tutor AI pribadimu. Saya siap membantumu memahami materi pelajaran, menjelaskan rumus, membahas soal latihan, atau menyusun jadwal belajarmu.\n\n💡 **Ada materi atau topik apa yang ingin kita pelajari hari ini?** Kamu bisa langsung bertanya konsep apa pun!";
            } else {
                return "Hello there! 👋 Welcome to **SmartStudy AI**.\n\nI am your personal AI tutor. I am here to help you understand tricky concepts, break down step-by-step problem solving, or review your study material.\n\n💡 **What would you like to explore or practice today?** Feel free to ask any question!";
            }
        }

        // Mathematics
        if (preg_match('/\b(matematika|math|aljabar|algebra|kalkulus|calculus|pythagoras|pitagoras|persamaan|equation|integral|turunan|derivative|pecahan|fraction|geometri|segitiga|lingkaran|luas|volume|hitung|rumus)\b/i', $lower)) {
            if ($isIndonesian) {
                return "Pertanyaan matematika yang sangat bagus! 📐\n\nMari kita bedah konsepnya secara bertahap:\n\n### 1. Konsep Dasar\nDalam matematika, memahami logika dasar di balik suatu rumus jauh lebih penting daripada sekadar menghafalnya. Ketika kamu menghadapi persamaan atau soal perhitungan:\n- **Identifikasi variabel yang diketahui** dan apa yang ditanyakan.\n- **Pilih formula atau aturan relasi** yang menghubungkan informasi tersebut.\n\n### 2. Contoh Langkah Pengerjaan\nMisalnya dalam pemecahan persamaan atau geometri:\n1. Tuliskan rumus dasar terlebih dahulu.\n2. Substitusikan nilai yang diketahui ke dalam persamaan.\n3. Sederhanakan kedua sisi persamaan secara bertahap hingga nilai variabel ditemukan.\n\n### 3. Tips Cepat\n- Jangan lupa selalu periksa kembali hasil akhirmu dengan memasukkannya balik ke persamaan awal.\n\nKira-kira ada soal atau rumus spesifik yang sedang kamu kerjakan? Tuliskan di sini dan mari kita selesaikan bersama langkah demi langkah!";
            } else {
                return "Great math question! 📐\n\nLet's break down this mathematical concept step-by-step:\n\n### 1. Core Principle\nIn mathematics, understanding the underlying mechanism is much more effective than rote memorization:\n- **Identify given values** and determine exactly what you need to solve for.\n- **Set up the corresponding formula** or relational equation.\n\n### 2. Step-by-Step Approach\n1. State the formula clearly.\n2. Substitute the known parameters.\n3. Isolate the variable through inverse algebraic operations.\n\n### 3. Study Tip\n- Always verify your solution by plugging it back into the initial equation.\n\nDo you have a specific equation or problem you'd like us to solve together? Paste it right here!";
            }
        }

        // Physics
        if (preg_match('/\b(fisika|physics|newton|gaya|force|kecepatan|velocity|percepatan|acceleration|gravitasi|gravity|energi|energy|kinetik|potensial|usaha|work|listrik|magnet|termodinamika)\b/i', $lower)) {
            if ($isIndonesian) {
                return "Topik Fisika yang sangat menarik! ⚡\n\nFisika adalah ilmu yang mempelajari bagaimana alam semesta bekerja melalui hukum alam dan interaksi materi.\n\n### 1. Prinsip Utama\nDalam mekanika dan dinamika, kita menghubungkan gaya, massa, dan gerak. Misalnya pada **Hukum II Newton**:\n$$\\Sigma F = m \\cdot a$$\n- **Gaya ($F$)** menyebabkan benda bermassa ($m$) mengalami percepatan ($a$).\n- Jika gaya total nol, benda akan tetap diam atau bergerak dengan kecepatan konstan (Hukum I Newton).\n\n### 2. Penerapan dalam Kehidupan Sehari-hari\n- Mengapa saat mobil direm mendadak tubuh kita terdorong ke depan? Itu adalah inersia!\n- Mengapa benda jatuh ke bumi? Itu akibat tarikan gravitasi bumi ($g \\approx 9.8\\text{ m/s}^2$).\n\n### 3. Tips Belajar Fisika\n- Buatlah diagram gaya (*free-body diagram*) sebelum mulai menghitung angka.\n- Selalu perhatikan satuan standar internasional (SI) seperti Newton (N), Joule (J), dan meter/sekon (m/s).\n\nTuliskan bagian atau soal fisika mana yang ingin kita ulas lebih dalam!";
            } else {
                return "Fascinating physics topic! ⚡\n\nPhysics describes how our universe behaves through fundamental laws and forces.\n\n### 1. Key Concept\nFor motion and dynamics, Newton's Laws form the cornerstone:\n$$\\Sigma F = m \\cdot a$$\n- Force equals mass times acceleration.\n- Conservation of energy states that energy cannot be created or destroyed, only transformed.\n\n### 2. Practical Tip\n- Always sketch a quick free-body diagram to track all acting forces.\n- Keep units consistent in the SI system.\n\nWhat specific scenario or problem would you like to solve next?";
            }
        }

        // Biology
        if (preg_match('/\b(biologi|biology|fotosintesis|photosynthesis|sel|cell|dna|genetika|genetics|ekosistem|ecosystem|tumbuhan|hewan|organ|pernapasan|respirasi|klorofil)\b/i', $lower)) {
            if ($isIndonesian) {
                return "Mari kita pelajari Biologi! 🌿\n\nBiologi mempelajari sistem kehidupan dari tingkat molekuler, seluler, hingga ekosistem global.\n\n### 1. Konsep Kunci\nProses biologis selalu memiliki tujuan menjaga kelangsungan hidup (*homeostasis*). Contohnya pada **Fotosintesis**:\n$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Cahaya Matahari} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$\n- **Reaksi Terang:** Terjadi di tilakoid kloroplas, menghasilkan ATP dan NADPH serta melepas oksigen.\n- **Reaksi Gelap (Siklus Calvin):** Terjadi di stroma, mengikat karbon dioksida menjadi glukosa.\n\n### 2. Tips Mengingat\n- Gunakan asosiasi visual (seperti bagan alur proses atau diagram sel) agar memori lebih bertahan lama.\n- Hubungkan fungsi organel dengan analogi (misal: mitokondria sebagai 'pembangkit listrik' sel).\n\nAda bagian yang ingin kamu perdalam, misalnya struktur sel atau sistem metabolisme?";
            } else {
                return "Let's explore Biology! 🌿\n\nBiology explores living systems from microscopic cellular functions to macroscopic ecosystems.\n\n### 1. Core Concept\nLiving systems maintain equilibrium through biochemical reactions such as **Photosynthesis**:\n$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$\n- Chloroplasts capture solar photons to synthesize glucose, fueling the food web.\n\n### 2. Study Strategy\n- Draw flowcharts connecting organs, tissues, and cellular processes.\n\nWhich biological mechanism would you like to examine further?";
            }
        }

        // Chemistry
        if (preg_match('/\b(kimia|chemistry|atom|molekul|reaksi|reaction|tabel periodik|periodic table|larutan|solution|asam|basa|acid|base|ikatan|kovalen|ion|stoikiometri)\b/i', $lower)) {
            if ($isIndonesian) {
                return "Keren! Mari kita bahas konsep Kimia. 🧪\n\nKimia adalah sains tentang materi, sifat-sifatnya, struktur atom, dan perubahannya melalui reaksi kimia.\n\n### 1. Konsep Dasar Reaksi & Ikatan\n- **Hukum Kekekalan Massa (Lavoisier):** Jumlah atom sebelum dan sesudah reaksi harus sama persis (persamaan setara).\n- **Ikatan Ion vs Kovalen:** Ikatan ion terbentuk dari serah-terima elektron (logam + non-logam), sedangkan kovalen terbentuk dari pemakaian elektron bersama (non-logam + non-logam).\n\n### 2. Tips Memahami Kimia\n- Latihlah penyetaraan reaksi kimia secara berkala.\n- Pahami konsep mol sebagai jembatan antara massa gram dan jumlah partikel atom ($n = \\frac{m}{M_r}$).\n\nApakah kamu memiliki pertanyaan seputar stoikiometri, asam-basa, atau struktur atom?";
            } else {
                return "Awesome! Let's explore Chemistry. 🧪\n\nChemistry investigates the properties, atomic structures, and transformations of matter.\n\n### 1. Key Principles\n- **Conservation of Mass:** Total atoms must balance between reactants and products.\n- **Bonding:** Ionic (transfer of electrons) vs Covalent (shared electron pairs).\n\n### 2. Pro Tip\n- Use the mole concept as your central conversion hub ($n = \\frac{\\text{mass}}{\\text{molar mass}}$).\n\nWhat chemical reaction or equation would you like to review?";
            }
        }

        // English / Language
        if (preg_match('/\b(bahasa|english|grammar|tenses|tense|past|present|future|verb|noun|adjective|vocabulary|arti|terjemahkan|translate)\b/i', $lower)) {
            if ($isIndonesian) {
                return "Belajar Bahasa Inggris itu seru dan sangat bermanfaat! 📚\n\nKunci utama menguasai bahasa adalah **pemahaman pola (grammar)** dan **praktek konsisten (vocabulary in context)**.\n\n### 1. Konsep Tenses Dasar\n- **Simple Present:** Untuk fakta & rutinitas harian (*I study every day*).\n- **Simple Past:** Untuk kejadian yang sudah selesai di masa lampau (*I studied yesterday*).\n- **Present Perfect:** Untuk pengalaman atau hal yang masih ada efeknya sekarang (*I have studied this topic*).\n\n### 2. Tips Praktis\n- Buat kalimat sendiri menggunakan kosakata baru yang kamu temukan hari ini.\n- Jangan takut membuat kesalahan gramatikal saat latihan berbicara atau menulis!\n\nIngin kita latihan membuat kalimat, mengecek grammar, atau membahas vocabulary tertentu?";
            } else {
                return "English learning mode activated! 📚\n\nMastering English comes down to pattern recognition and consistent context-based practice.\n\n### 1. Essential Tense Framework\n- **Present Simple:** Habits and general truths (*I learn every day*).\n- **Past Simple:** Completed actions (*I learned yesterday*).\n- **Present Continuous:** Actions currently in progress (*I am learning right now*).\n\n### 2. Active Tip\n- Construct two original sentences right now with new vocabulary words you've learned.\n\nWould you like to review grammar, sentence structure, or vocabulary next?";
            }
        }

        // General Education Response
        if ($isIndonesian) {
            $contextHint = $context ? " (Konteks mata pelajaran: {$context})" : '';

            return "Terima kasih atas pertanyaanmu! 💡{$contextHint}\n\nBerikut penjelasan terstruktur untuk membantumu memahaminya dengan mudah:\n\n### 1. Ringkasan Konsep\nMateri ini sangat relevan dalam proses belajarmu. Inti utamanya berfokus pada pemahaman prinsip fundamental, kemudian menghubungkannya dengan contoh praktis agar mudah diingat.\n\n### 2. Langkah-Langkah Pemahaman\n1. **Pahami Definisi:** Kenali istilah kunci dan ide utama dari topik ini.\n2. **Kaitkan dengan Pola:** Lihat bagaimana konsep ini saling berhubungan dengan bab atau materi sebelumnya.\n3. **Uji dengan Latihan:** Cobalah menyelesaikan 1-2 pertanyaan latihan untuk menguji pemahamanmu secara langsung.\n\n### 3. Tips Belajar Efektif\n- Tuliskan kembali poin-poin di atas menggunakan bahasamu sendiri (*active recall*).\n- Jika ada istilah atau langkah yang terasa membingungkan, tanyakan saja langsung!\n\nBagian mana dari konsep ini yang ingin kamu bedah lebih rinci bersama saya?";
        } else {
            return "Thank you for asking! 💡\n\nHere is a structured overview to help you master this concept quickly:\n\n### 1. Fundamental Overview\nThis topic is a cornerstone of your study path. Focusing on the core principles and connecting them with realistic examples ensures long-term retention.\n\n### 2. Recommended Action Steps\n1. **Define Core Terms:** Clarify the key terms and mechanics involved.\n2. **Identify Relationships:** Notice how this concept connects to preceding units.\n3. **Apply & Practice:** Test your understanding with active problem-solving.\n\n### 3. Quick Study Tip\n- Practice *active recall* by summarizing this concept in your own words.\n\nWhich specific aspect would you like to explore further together?";
        }
    }

    /**
     * Fallback topics generator for exploration pills.
     */
    protected function generateFallbackTopics(string $userMessage, ?string $subjectName = null): array
    {
        $sub = mb_strtolower((string) $subjectName);
        $msg = mb_strtolower($userMessage);

        if (str_contains($sub, 'math') || str_contains($msg, 'hitung') || str_contains($msg, 'rumus') || str_contains($msg, 'aljabar')) {
            return [
                ['title' => 'Latihan Soal Aljabar', 'subtitle' => 'Perkuat pemahaman konsep dasar'],
                ['title' => 'Rumus & Persamaan Linear', 'subtitle' => 'Terapkan pada contoh kasus'],
                ['title' => 'Tips Berhitung Cepat', 'subtitle' => 'Metode praktis pengerjaan ujian'],
            ];
        }

        if (str_contains($sub, 'physic') || str_contains($msg, 'fisika') || str_contains($msg, 'gaya') || str_contains($msg, 'gerak')) {
            return [
                ['title' => 'Hukum Gerak Newton', 'subtitle' => 'Konsep dasar mekanika gerak'],
                ['title' => 'Energi Kinetik & Potensial', 'subtitle' => 'Hukum kekekalan energi'],
                ['title' => 'Latihan Soal Fisika', 'subtitle' => 'Uji pemahaman rumus'],
            ];
        }

        if (str_contains($sub, 'biolog') || str_contains($msg, 'sel') || str_contains($msg, 'fotosintesis')) {
            return [
                ['title' => 'Struktur Sel & Organel', 'subtitle' => 'Pahami fungsi unit kehidupan'],
                ['title' => 'Tahapan Fotosintesis', 'subtitle' => 'Reaksi terang dan reaksi gelap'],
                ['title' => 'Sistem Ekosistem Alam', 'subtitle' => 'Rantai makanan & simbiosis'],
            ];
        }

        return [
            ['title' => 'Ringkasan Materi Esensial', 'subtitle' => 'Kilas balik poin-poin penting'],
            ['title' => 'Kuis Pemahaman Cepat', 'subtitle' => 'Uji kesiapan pemahamanmu'],
            ['title' => 'Jadwal Belajar Rekomendasi', 'subtitle' => 'Atur waktu belajar yang konsisten'],
        ];
    }

    /**
     * Baca satu baris dari stream SSE.
     */
    protected function readSseLine($stream): ?string
    {
        $line = '';

        while (! $stream->eof()) {
            $char = $stream->read(1);

            if ($char === "\n") {
                return rtrim($line, "\r") ?: null;
            }

            $line .= $char;

            if (strlen($line) > 8192) {
                return null;
            }
        }

        return $line !== '' ? rtrim($line, "\r") : null;
    }
}
