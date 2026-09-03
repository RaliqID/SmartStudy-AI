<?php

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Pest Test Configuration
|--------------------------------------------------------------------------
*/

pest()->extend(TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');

// Fake all outbound HTTP (AI Tutor service) — prevents real network calls.
beforeEach(function () {
    Http::fake([
        '*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Fake AI response for testing.']],
            ],
            'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 10],
        ], 200),
    ]);
});
