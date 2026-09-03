<?php

namespace App\Services;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Streak Freeze (opsional 4) — gratis 2x per bulan.
 * Saat user skip sehari (gap > 1 day), freeze dipakai otomatis:
 * streak tidak reset, hari kosong "ditutup" oleh freeze.
 */
class StreakFreezeService
{
    public const MONTHLY_LIMIT = 2;

    /**
     * Coba pakai freeze untuk menutup gap hari.
     * Return true kalau freeze berhasil dipakai (streak selamat).
     */
    public function tryUseFreeze(User $user, string $today, string $lastActiveDate): bool
    {
        $this->resetMonthlyCounterIfNeeded($user);

        if ($user->freezes_used_month >= self::MONTHLY_LIMIT) {
            return false; // kuota bulan ini habis
        }

        $user->freezes_used_month += 1;

        Notification::create([
            'user_id' => $user->id,
            'type' => 'streak_freeze',
            'title' => 'Streak Freeze Used!',
            'body' => "Kamu absen kemarin, tapi streak {$user->current_streak} hari kamu selamat berkat Streak Freeze. Sisa freeze bulan ini: " . (self::MONTHLY_LIMIT - $user->freezes_used_month) . '.',
            'icon' => 'ac_unit',
            'action_url' => '/student/progress',
        ]);

        Log::info('Streak freeze used', [
            'user' => $user->id,
            'streak_saved' => $user->current_streak,
            'remaining' => self::MONTHLY_LIMIT - $user->freezes_used_month,
        ]);

        return true;
    }

    /**
     * Reset counter bulanan kalau bulan berganti.
     * Freezes yang tersisa TIDAK di-refill penuh — user dapat 2 fresh setiap bulan.
     */
    protected function resetMonthlyCounterIfNeeded(User $user): void
    {
        $currentMonth = now()->format('Y-m');

        if ($user->freezes_month_key !== $currentMonth) {
            $user->freezes_month_key = $currentMonth;
            $user->freezes_used_month = 0;
            $user->streak_freezes = self::MONTHLY_LIMIT;
            $user->save();
        }
    }
}
