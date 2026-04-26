<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users');
            $table->foreignId('area_id')->constrained();
            $table->foreignId('activity_id')->constrained();
            $table->string('issue');
            $table->binary('photo_before')->nullable();
            $table->binary('photo_after')->nullable();
            $table->boolean('is_content_edited')->nullable();
            $table->dateTime('finished_date');
            $table->timestamps();
            $table->softDeletes();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
