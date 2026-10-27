<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use SoftDeletes;

    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'author_id',
        'area_id',
        'sub_area_id',
        'activity_id',
        'sub_activity_id',
        'category_snapshot',
        'activity',
        'issue',
        'status',
        'photo_before',
        'photo_after',
        'close_comment',
        'is_content_edited',
        'closed_at',
        'closed_by',
    ];

    protected function casts(): array
    {
        return [
            'author_id' => 'integer',
            'area_id' => 'integer',
            'sub_area_id' => 'integer',
            'activity_id' => 'integer',
            'sub_activity_id' => 'integer',
            'closed_at' => 'datetime',
            'is_content_edited' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    protected static function booted(): void
    {
        static::saving(function (Report $report): void {
            if (! $report->exists || $report->isDirty('sub_activity_id')) {
                $subActivity = SubActivity::withTrashed()->findOrFail($report->sub_activity_id);
                $report->activity_id = $subActivity->activity_id;
                $report->category_snapshot = $subActivity->category;
            } else {
                $report->category_snapshot = $report->getOriginal('category_snapshot');
                $report->activity_id = $report->getOriginal('activity_id');
            }
        });
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function subArea(): BelongsTo
    {
        return $this->belongsTo(SubArea::class);
    }

    public function activityType(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id')->withTrashed();
    }

    public function subActivity(): BelongsTo
    {
        return $this->belongsTo(SubActivity::class, 'sub_activity_id')->withTrashed();
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasAnyPermission(['reports.view.all', 'reports.solve.all', 'reports.edit.all', 'reports.delete.all'])) {
            return $query;
        }

        return $query->where(function (Builder $visible) use ($user): void {
            $visible->whereRaw('1 = 0');
            if ($user->hasAnyPermission(['reports.view.own', 'reports.create', 'reports.edit.own', 'reports.delete.own'])) {
                $visible->orWhere('author_id', $user->id);
            }
            if ($user->can('reports.review.area')) {
                $visible->orWhereHas('activityType.managers', fn (Builder $users) => $users->whereKey($user->id));
            }
            if ($user->can('reports.solve.own.area')) {
                $visible->orWhereHas('subArea.supervisors', fn (Builder $users) => $users->whereKey($user->id));
            }
        });
    }
}
