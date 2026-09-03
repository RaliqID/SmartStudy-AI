<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject_id',
        'mastery_percentage',
        'materials_completed',
        'quizzes_completed',
        'average_score',
        'time_spent_minutes',
        'last_accessed_at',
    ];

    protected $casts = [
        'mastery_percentage' => 'float',
        'average_score' => 'float',
        'time_spent_minutes' => 'float',
        'last_accessed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
