<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users: tambah kolom gamifikasi & profil (portable SQLite + PostgreSQL)
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('password');
            $table->unsignedBigInteger('xp')->default(0)->after('avatar');
            $table->unsignedInteger('current_level')->default(1)->after('xp');
            $table->unsignedInteger('current_streak')->default(0)->after('current_level');
            $table->unsignedInteger('longest_streak')->default(0)->after('current_streak');
            $table->timestamp('last_active_at')->nullable()->after('longest_streak');
            $table->boolean('is_active')->default(true)->after('last_active_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'xp', 'current_level', 'current_streak', 'longest_streak', 'last_active_at', 'is_active']);
        });
    }
};
