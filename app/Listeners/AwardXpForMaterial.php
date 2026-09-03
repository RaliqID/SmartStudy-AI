<?php

namespace App\Listeners;

use App\Events\MaterialCompleted;
use App\Models\XpTransaction;
use App\Services\LevelService;
use Illuminate\Support\Facades\Log;

class AwardXpForMaterial
{
    public function handle(MaterialCompleted $event): void
    {
        $user = $event->user;
        $material = $event->material;

        $xpAmount = 25;

        // Add XP to user
        $user->xp += $xpAmount;
        $user->save();

        // Log transaction
        XpTransaction::create([
            'user_id' => $user->id,
            'source_type' => 'material_completed',
            'source_id' => $material->id,
            'xp_amount' => $xpAmount,
        ]);

        // Recalculate level (level up notification handled inside)
        app(LevelService::class)->recalculate($user);

        Log::info('XP awarded for material', [
            'user' => $user->id,
            'material' => $material->id,
            'xp' => $xpAmount,
        ]);
    }
}
