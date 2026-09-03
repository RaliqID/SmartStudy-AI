<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyQuest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'type',
        'target_key',
        'target_value',
        'xp_reward',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function userQuests(): HasMany
    {
        return $this->hasMany(UserDailyQuest::class);
    }
}
