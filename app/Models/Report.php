<?php

declare(strict_types=1);

namespace App\Models;

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

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
    public function subArea(): BelongsTo { return $this->belongsTo(SubArea::class); }

    public function activityType(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function subActivity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'sub_activity_id');
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }
}
