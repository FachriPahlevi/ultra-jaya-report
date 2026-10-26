<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'parent_id',
        'category',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Activity::class, 'parent_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function managers(): BelongsToMany
    {
        return $this->assignees()->whereHas('roles', fn ($query) => $query->where('name', 'MANAGER'));
    }

    public function supervisors(): BelongsToMany
    {
        return $this->assignees()->whereHas('roles', fn ($query) => $query->where('name', 'SUPERVISOR'));
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function reportsAsType(): HasMany
    {
        return $this->hasMany(Report::class, 'activity_id');
    }

    public function reportsAsSubType(): HasMany
    {
        return $this->hasMany(Report::class, 'sub_activity_id');
    }
}
