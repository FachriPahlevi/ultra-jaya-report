<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('photo_after');
            $table->text('rejected_comment')->nullable()->after('status');
            $table->foreignId('rejected_by')->nullable()->constrained('users')->after('rejected_comment');
            $table->dateTime('rejected_at')->nullable()->after('rejected_by');
            $table->text('correction_comment')->nullable()->after('rejected_at');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropForeign(['rejected_by']);
            $table->dropColumn(['status', 'rejected_comment', 'rejected_by', 'rejected_at', 'correction_comment']);
        });
    }
};
