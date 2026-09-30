<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\XpTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->query('period', 'weekly');
        if (! in_array($period, ['weekly', 'monthly', 'all'])) {
            $period = 'weekly';
        }

        /** @var \App\Models\User $me */
        $me = auth()->user();

        if ($period === 'all') {
            // All-time: users.xp column
            $top = User::query()
                ->where('xp', '>', 0)
                ->orderByDesc('xp')
                ->limit(10)
                ->get(['id', 'name', 'avatar', 'xp']);

            $leaderboard = $top->values()->map(fn (User $u, int $i) => [
                'rank' => $i + 1,
                'name' => $u->name,
                'avatar' => $u->avatar,
                'xp' => $u->xp,
                'is_you' => $u->id === $me->id,
            ])->all();

            // My rank: count users with more XP + 1
            $myRank = User::where('xp', '>', $me->xp)->count() + 1;

        } else {
            $since = $period === 'weekly'
                ? now()->startOfWeek()
                : now()->startOfMonth();

            // Top 10 by summed XP transactions in period
            $top = XpTransaction::query()
                ->where('created_at', '>=', $since)
                ->select('user_id', DB::raw('SUM(xp_amount) as total_xp'))
                ->groupBy('user_id')
                ->orderByDesc('total_xp')
                ->limit(10)
                ->get();

            $userIds = $top->pluck('user_id');
            $users = User::whereIn('id', $userIds)->get(['id', 'name', 'avatar'])->keyBy('id');

            $leaderboard = $top->map(function ($row, int $i) use ($users, $me) {
                $u = $users->get($row->user_id);
                if (! $u) {
                    return null;
                }

                return [
                    'rank' => $i + 1,
                    'name' => $u->name,
                    'avatar' => $u->avatar,
                    'xp' => (int) $row->total_xp,
                    'is_you' => $u->id === $me->id,
                ];
            })->filter()->values()->all();

            // My rank in period (even outside top 10)
            $myXp = (int) XpTransaction::where('user_id', $me->id)
                ->where('created_at', '>=', $since)
                ->sum('xp_amount');

            $myRank = $myXp > 0
                ? (int) XpTransaction::query()
                    ->where('created_at', '>=', $since)
                    ->select('user_id', DB::raw('SUM(xp_amount) as total_xp'))
                    ->groupBy('user_id')
                    ->havingRaw('SUM(xp_amount) > ?', [$myXp])
                    ->count() + 1
                : null;
        }

        return Inertia::render('Student/Leaderboard', [
            'leaderboard' => $leaderboard,
            'period' => $period,
            'myRank' => $myRank,
        ]);
    }
}
