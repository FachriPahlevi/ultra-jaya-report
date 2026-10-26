<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Validation\ValidationException;

final class ReportSelectionScope
{
    public function validate(User $user, int $areaId, int $subAreaId, int $activityId, int $subActivityId): void
    {
        if ($user->hasAnyPermission(['reports.view.all', 'reports.solve.all', 'reports.edit.all', 'reports.delete.all'])) {
            return;
        }
        $reviews = $user->can('reports.review.area');
        $closes = $user->can('reports.solve.own.area');
        if (! $reviews && ! $closes) {
            return;
        }
        if ($reviews && $user->managedAreas()->whereKey($areaId)->exists()
            && $user->assignedActivities()->whereKey($activityId)->exists()) {
            return;
        }
        if ($closes && $user->supervisedSubAreas()->whereKey($subAreaId)->exists()
            && $user->assignedSubActivities()->whereKey($subActivityId)->exists()) {
            return;
        }

        throw ValidationException::withMessages(['sub_activity_id' => 'The selected location and sub-activity are outside your assigned scope.']);
    }
}
