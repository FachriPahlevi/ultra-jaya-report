<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users');
            $table->foreignId('area_id')->constrained();
            $table->foreignId('activity_id')->constrained();
            $table->string('activity')->nullable();
            $table->text('issue');
            $table->string('photo_before', 500)->nullable();
            $table->string('photo_after', 500)->nullable();
            $table->boolean('is_content_edited')->default(false);
            $table->dateTime('finished_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};