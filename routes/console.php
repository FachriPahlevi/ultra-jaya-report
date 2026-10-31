<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\SubActivity;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('activity-access:audit', function (): int {
    $missing = SubActivity::whereHas('activity', fn ($query) => $query->where('is_active', true))
        ->whereDoesntHave('accessRoles')->with('activity:id,name')->orderBy('activity_id')->orderBy('name')->get();
    if ($missing->isEmpty()) {
        $this->info('All active sub-activities have at least one access role. Review the assignments before enabling role-based access.');

        return 0;
    }
    $this->warn('Active sub-activities without access roles:');
    $this->table(['ID', 'Activity', 'Sub-activity'], $missing->map(fn ($sub) => [$sub->id, $sub->activity?->name, $sub->name])->all());

    return 1;
})->purpose('Find active sub-activities without a configured access role');
