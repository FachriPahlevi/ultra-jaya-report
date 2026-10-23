<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('area');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('sub_areas', function (Blueprint $table) {
            $table->id(); $table->foreignId('area_id')->constrained()->cascadeOnDelete(); $table->string('name'); $table->unsignedSmallInteger('max_personnel')->default(1); $table->boolean('is_active')->default(true); $table->timestamps(); $table->softDeletes(); $table->unique(['area_id', 'name']);
        });
        Schema::create('sub_area_user', function (Blueprint $table) {
            $table->id(); $table->foreignId('sub_area_id')->constrained()->cascadeOnDelete(); $table->foreignId('user_id')->constrained()->cascadeOnDelete(); $table->timestamps(); $table->unique(['sub_area_id', 'user_id']);
        });

        Schema::create('area_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['area_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_area_user'); Schema::dropIfExists('sub_areas');
        Schema::dropIfExists('area_user');
        Schema::dropIfExists('areas');
    }
};
