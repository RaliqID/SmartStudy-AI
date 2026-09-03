<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'avatar' => $request->user()->avatar,
                    'xp' => $request->user()->xp,
                    'current_level' => $request->user()->current_level,
                    'current_streak' => $request->user()->current_streak,
                    'streak_freezes_left' => max(
                        0,
                        \App\Services\StreakFreezeService::MONTHLY_LIMIT - $request->user()->freezes_used_month
                    ),
                    'roles' => $request->user()->getRoleNames()->toArray(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'csrf_token' => fn () => csrf_token(),
            'appName' => config('app.name'),
            'unreadNotificationsCount' => fn () => $request->user()
                ? \App\Models\Notification::where('user_id', $request->user()->id)->whereNull('read_at')->count()
                : 0,
        ];
    }
}
