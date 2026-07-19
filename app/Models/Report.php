<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'author_id',
        'area_id',
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

    protected $casts = [
        'author_id' => 'integer',
        'area_id' => 'integer',
        'activity_id' => 'integer',
        'sub_activity_id' => 'integer',
        'closed_at' => 'datetime',
        'is_content_edited' => 'boolean'
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function activityType()
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function subActivity()
    {
        return $this->belongsTo(Activity::class, 'sub_activity_id');
    }

    public function closer()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
