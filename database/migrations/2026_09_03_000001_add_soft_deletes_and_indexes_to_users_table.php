<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Soft delete users — preserve classes/quizzes/progress saat admin hapus user
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes()->after('is_active');
            $table->index('last_active_at'); // admin report: active users
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->index(['status', 'completed_at']); // admin report + dashboard weekly stats
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['last_active_at']);
            $table->dropSoftDeletes();
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropIndex(['status', 'completed_at']);
        });
    }
};
