<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDailyQuest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'daily_quest_id',
        'quest_date',
        'progress',
        'is_completed',
        'xp_awarded',
    ];

    protected $casts = [
        'quest_date' => 'date',
        'is_completed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quest(): BelongsTo
    {
        return $this->belongsTo(DailyQuest::class, 'daily_quest_id');
    }
}
