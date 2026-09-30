<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Tutor — 9router (Dev-Stack)
    |--------------------------------------------------------------------------
    | OpenAI-compatible gateway. Defaults point at the local 9router daemon
    | (http://localhost:20128/v1) with the Dev-Stack model. Override any of
    | these per environment in .env.
    */

    'ai' => [
        'base_url' => env('AI_BASE_URL', 'http://localhost:20128/v1'),
        'api_key' => env('AI_API_KEY'),
        'model' => env('AI_MODEL', 'Dev-Stack'),
        'timeout' => env('AI_TIMEOUT', 60),
        'max_tokens' => env('AI_MAX_TOKENS', 4096),
    ],

];
