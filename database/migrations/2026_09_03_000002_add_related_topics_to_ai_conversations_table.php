<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Related topics AI-generated per conversation (opsional 3)
        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->json('related_topics')->nullable()->after('total_messages');
        });
    }

    public function down(): void
    {
        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->dropColumn('related_topics');
        });
    }
};
