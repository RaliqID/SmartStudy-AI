<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Tutor — xkiro (OpenAI-compatible)
    |--------------------------------------------------------------------------
    */

    'ai' => [
        'base_url' => env('AI_BASE_URL', 'https://api.xkiro.com/v1'),
        'api_key' => env('AI_API_KEY'),
        'model' => env('AI_MODEL', 'minimax/minimax-m2.7-highspeed:free'),
        'timeout' => env('AI_TIMEOUT', 60),
        'max_tokens' => env('AI_MAX_TOKENS', 2048),
    ],

];
