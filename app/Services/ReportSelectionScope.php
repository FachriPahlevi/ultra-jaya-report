<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\SubActivity;
use Illuminate\Validation\ValidationException;

final class ReportSelectionScope
{
    public function validate(User $user, int $areaId, int $subAreaId, int $activityId, int $subActivityId): void
    {
        $allowed = SubActivity::whereKey($subActivityId)->whereHas('accessRoles', fn ($roles) => $roles->whereIn('roles.id', $user->roles()->select('roles.id')))->exists();
        if (! $allowed) {
            throw ValidationException::withMessages(['sub_activity_id' => 'Your role cannot use this sub-activity.']);
        }
    }
}
