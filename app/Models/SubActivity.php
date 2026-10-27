<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubActivity extends Model
{
    use SoftDeletes;

    protected $fillable = ['activity_id', 'name', 'description', 'category'];

    protected $attributes = ['category' => 'ISSUE'];

    protected function casts(): array
    {
        return ['activity_id' => 'integer'];
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class)->withTrashed();
    }

    public function supervisors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'sub_activity_supervisors')->withTimestamps();
    }

    public function reportsAsSubType(): HasMany
    {
        return $this->hasMany(Report::class);
    }
}
