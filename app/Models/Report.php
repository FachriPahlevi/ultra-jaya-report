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
        'activity',
        'issue',
        'photo_before',
        'photo_after',
        'is_content_edited',
        'finished_date'
    ];
    
    protected $casts = [
        'author_id' => 'integer',
        'area_id' => 'integer',
        'activity_id' => 'integer',
        'finished_date' => 'datetime',
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
}