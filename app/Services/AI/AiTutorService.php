<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

/**
 * SmartStudy AI — AI Tutor Service.
 * Provider: xkiro (OpenAI-compatible endpoint).
 * Config via .env: AI_BASE_URL, AI_API_KEY, AI_MODEL.
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
        $this->baseUrl = rtrim((string) (config('services.ai.base_url', env('AI_BASE_URL', 'https://api.xkiro.com/v1'))), '/');
        $this->apiKey = (string) (config('services.ai.api_key', env('AI_API_KEY', 'test-key')));
        $this->model = (string) (config('services.ai.model', env('AI_MODEL', 'minimax/minimax-m2.7-highspeed:free')));
        $this->timeout = (int) (config('services.ai.timeout', env('AI_TIMEOUT', 60)));
        $this->maxTokens = (int) (config('services.ai.max_tokens', env('AI_MAX_TOKENS', 2048)));
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
     * @param array<int, array{role: string, content: string}> $messages
     * @return array{content: string, prompt_tokens: ?int, completion_tokens: ?int}
     */
    public function chat(array $messages, ?string $systemContext = null): array
    {
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

        if ($response->failed()) {
            logger()->error('AI Tutor API error', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            throw new \RuntimeException('AI Tutor is temporarily unavailable. Please try again shortly.');
        }

        $data = $response->json();

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'prompt_tokens' => $data['usage']['prompt_tokens'] ?? null,
            'completion_tokens' => $data['usage']['completion_tokens'] ?? null,
        ];
    }

    /**
     * Chat completion — streaming (SSE chunks via generator).
     * Yields plain-text deltas.
     */
    public function chatStream(array $messages, ?string $systemContext = null): \Generator
    {
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

        if ($response->failed()) {
            logger()->error('AI Tutor stream error', ['status' => $response->status()]);
            throw new \RuntimeException('AI Tutor is temporarily unavailable. Please try again shortly.');
        }

        // Parse SSE stream
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

        return $result['content'];
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

        return $this->chat($messages, 'You are a quiz-review assistant. Be concise, kind, and clear.')->content;
    }

    /**
     * Generate related topics untuk percakapan AI Tutor (opsional 3).
     * Return array of {title, subtitle} max 3 item, atau [] kalau gagal.
     */
    public function relatedTopics(string $userMessage, string $assistantReply, ?string $subjectName = null): array
    {
        try {
            $subjectLine = $subjectName ? "Subject context: {$subjectName}." : '';

            $result = $this->chat(
                [[
                    'role' => 'user',
                    'content' => "Student asked: {$userMessage}\n\nTutor answered: " . Str::limit($assistantReply, 800) . "\n\n{$subjectLine}\nSuggest 3 related study topics the student could explore next. Reply ONLY with a JSON array like: [{\"title\":\"Topic name\",\"subtitle\":\"Why it matters — max 8 words\"}]. No markdown, no explanation.",
                ]],
                'You generate study topic suggestions. Reply with valid JSON array only, max 3 items.'
            );

            $content = trim($result['content']);
            // Strip markdown code fence kalau model balut
            $content = preg_replace('/^```(json)?\s*|\s*```$/', '', $content);

            $topics = json_decode($content, true);

            if (! is_array($topics)) {
                return [];
            }

            return collect($topics)
                ->take(3)
                ->filter(fn ($t) => is_array($t) && ! empty($t['title']))
                ->map(fn ($t) => [
                    'title' => (string) $t['title'],
                    'subtitle' => (string) ($t['subtitle'] ?? 'Explore this topic'),
                ])
                ->values()
                ->all();
        } catch (\Throwable $e) {
            logger()->warning('Related topics generation failed', ['error' => $e->getMessage()]);

            return [];
        }
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
                return null; // guard: baris terlalu panjang, skip
            }
        }

        return $line !== '' ? rtrim($line, "\r") : null;
    }
}
