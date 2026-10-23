<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubArea extends Model
{
    use SoftDeletes;

    protected $fillable = ['area_id', 'name', 'max_personnel', 'is_active'];

    protected function casts(): array
    {
        return ['area_id' => 'integer', 'max_personnel' => 'integer', 'is_active' => 'boolean'];
    }

    public function area(): BelongsTo { return $this->belongsTo(Area::class); }
    public function supervisors(): BelongsToMany { return $this->belongsToMany(User::class)->withTimestamps(); }

    public function reports(): HasMany { return $this->hasMany(Report::class); }
}
