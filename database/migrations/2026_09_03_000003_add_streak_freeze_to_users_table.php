<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Streak freeze (opsional 4) — gratis 2x/bulan, auto-apply saat skip sehari
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('streak_freezes')->default(2)->after('longest_streak');
            $table->unsignedTinyInteger('freezes_used_month')->default(0)->after('streak_freezes');
            $table->string('freezes_month_key', 7)->nullable()->after('freezes_used_month'); // YYYY-MM
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['streak_freezes', 'freezes_used_month', 'freezes_month_key']);
        });
    }
};
