<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function view(User $user, Report $report): bool
    {
        return $user->can('reports.view.all')
            || ($user->can('reports.view.own') && $report->author_id === $user->id)
            || ($user->can('reports.solve.own.area') && $this->isAreaPic($user, $report));
    }

    public function update(User $user, Report $report): bool
    {
        return $report->isOpen() && (
            $user->can('reports.edit.all')
            || ($user->can('reports.edit.own') && $report->author_id === $user->id)
        );
    }

    public function delete(User $user, Report $report): bool
    {
        return $report->isOpen() && (
            $user->can('reports.delete.all')
            || ($user->can('reports.delete.own') && $report->author_id === $user->id)
        );
    }

    public function close(User $user, Report $report): bool
    {
        return $report->isOpen() && (
            $user->can('reports.solve.all')
            || ($user->can('reports.solve.own.area') && $this->isAreaPic($user, $report))
        );
    }

    private function isAreaPic(User $user, Report $report): bool
    {
        $area = $report->area;

        return $area !== null && ($area->relationLoaded('pics')
            ? $area->pics->contains('id', $user->id)
            : $area->pics()->whereKey($user->id)->exists());
    }
}
