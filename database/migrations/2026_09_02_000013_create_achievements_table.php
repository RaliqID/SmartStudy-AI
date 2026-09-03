<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('icon')->nullable();            // Material Symbols name
            $table->string('category', 30)->default('general'); // learning | quiz | streak | social
            $table->string('type', 30)->default('count');   // count | score | streak | xp | custom
            $table->string('condition_key')->nullable();   // misal: quizzes_completed
            $table->unsignedInteger('condition_value')->nullable();
            $table->unsignedInteger('xp_reward')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
