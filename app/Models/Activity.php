<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Activity extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function children(): HasMany
    {
        return $this->hasMany(SubActivity::class);
    }

    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'activity_managers')->withTimestamps();
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function reportsAsType(): HasMany
    {
        return $this->hasMany(Report::class, 'activity_id');
    }
}
