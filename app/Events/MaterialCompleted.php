<?php

namespace App\Events;

use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dipatch saat student menandai material selesai.
 * Trigger: UpdateStudentProgress, CheckAchievements, UpdateDailyQuestProgress, UpdateStreak.
 */
class MaterialCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public Material $material,
    ) {}
}
