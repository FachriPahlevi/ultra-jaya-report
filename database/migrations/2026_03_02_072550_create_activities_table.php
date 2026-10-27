<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sub_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->noActionOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['ISSUE', 'REPORT'])->default('ISSUE');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('activity_managers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['activity_id', 'user_id']);
        });

        Schema::create('sub_activity_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['sub_activity_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_activity_supervisors');
        Schema::dropIfExists('activity_managers');
        Schema::dropIfExists('sub_activities');
        Schema::dropIfExists('activities');
    }
};
