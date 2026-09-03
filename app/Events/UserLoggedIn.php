<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dipatch saat user login (streak check harian).
 * Trigger: UpdateStreak.
 */
class UserLoggedIn
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
    ) {}
}
