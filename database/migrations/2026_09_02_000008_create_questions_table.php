<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->text('question_text');
            $table->string('type', 20)->default('multiple_choice'); // multiple_choice | true_false
            $table->text('explanation')->nullable(); // AI / manual: kenapa jawaban benar
            $table->unsignedInteger('points')->default(10);
            $table->unsignedInteger('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['quiz_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
