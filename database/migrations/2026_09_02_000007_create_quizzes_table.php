<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('difficulty', 20)->default('medium'); // easy | medium | hard
            $table->unsignedInteger('duration_minutes')->default(15);
            $table->unsignedInteger('xp_reward')->default(50);
            $table->unsignedInteger('passing_score')->default(60); // percent
            $table->boolean('is_published')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['subject_id', 'is_published']);
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
