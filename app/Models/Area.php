<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Area extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'area',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function pics(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }
    public function subAreas(): HasMany { return $this->hasMany(SubArea::class); }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function hasHistoricalReports(): bool
    {
        return $this->reports()->withTrashed()->exists();
    }
}
