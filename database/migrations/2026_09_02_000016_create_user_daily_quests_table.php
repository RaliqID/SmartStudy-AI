<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_daily_quests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('daily_quest_id')->constrained()->cascadeOnDelete();
            $table->date('quest_date');
            $table->unsignedInteger('progress')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'daily_quest_id', 'quest_date']);
            $table->index(['user_id', 'quest_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_daily_quests');
    }
};
