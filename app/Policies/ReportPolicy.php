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
            || ($user->can('reports.solve.own.area') && $this->isSupervisor($user, $report))
            || ($user->can('reports.review.area') && $user->managedAreas()->whereKey($report->area_id)->exists());
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
            || ($user->can('reports.solve.own.area') && $this->isSupervisor($user, $report))
        );
    }

    private function isSupervisor(User $user, Report $report): bool
    {
        return $report->subArea?->supervisors()->whereKey($user->id)->exists() ?? false;
    }
}
