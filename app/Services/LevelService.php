<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class LevelService
{
    /**
     * XP required per level: 500 XP = 1 level.
     * Level = floor(xp / 500) + 1
     */
    public const XP_PER_LEVEL = 500;

    public function levelForXp(int $xp): int
    {
        return intdiv($xp, self::XP_PER_LEVEL) + 1;
    }

    /**
     * Recalculate user level from XP. On level up:
     * - update current_level
     * - create a 'level_up' notification
     */
    public function recalculate(User $user): int
    {
        $newLevel = $this->levelForXp((int) $user->xp);
        $oldLevel = (int) $user->current_level;

        if ($newLevel > $oldLevel && $oldLevel >= 1) {
            $user->current_level = $newLevel;
            $user->save();

            Notification::create([
                'user_id' => $user->id,
                'type' => 'level_up',
                'title' => 'Level Up!',
                'body' => "Kamu sekarang Level {$newLevel}. Keep it up!",
                'icon' => 'military_tech',
                'action_url' => '/student/progress',
            ]);
        }

        return $newLevel;
    }
}
