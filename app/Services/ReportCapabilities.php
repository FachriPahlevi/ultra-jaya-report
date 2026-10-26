<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Report;
use App\Models\User;

/** A request-local permission snapshot shared by record policies and report lists. */
final class ReportCapabilities
{
    private array $permissions;

    private array $subAreas = [];

    private array $subActivities = [];

    private array $activities = [];

    public function __construct(private readonly User $user)
    {
        $this->permissions = array_fill_keys($user->getAllPermissions()->pluck('name')->all(), true);
        if ($this->has('reports.solve.own.area')) {
            $user->loadMissing(['supervisedSubAreas:sub_areas.id', 'assignedSubActivities:sub_activities.id']);
            $this->subAreas = array_fill_keys($user->supervisedSubAreas->modelKeys(), true);
            $this->subActivities = array_fill_keys($user->assignedSubActivities->modelKeys(), true);
        }
        if ($this->has('reports.review.area')) {
            $user->loadMissing('assignedActivities:activities.id');
            $this->activities = array_fill_keys($user->assignedActivities->modelKeys(), true);
        }
    }

    public function view(Report $report): bool
    {
        return $this->has('reports.view.all') || $this->has('reports.solve.all') || $this->has('reports.edit.all') || $this->has('reports.delete.all')
            || ($report->author_id === $this->user->id && ($this->has('reports.view.own') || $this->has('reports.create') || $this->has('reports.edit.own') || $this->has('reports.delete.own')))
            || ($this->has('reports.solve.own.area') && isset($this->subAreas[$report->sub_area_id]))
            || ($this->has('reports.review.area') && isset($this->activities[$report->activity_id]));
    }

    public function update(Report $report): bool
    {
        return $report->isOpen() && ($this->has('reports.edit.all') || ($this->has('reports.edit.own') && $report->author_id === $this->user->id));
    }

    public function delete(Report $report): bool
    {
        return $report->isOpen() && ($this->has('reports.delete.all') || ($this->has('reports.delete.own') && $report->author_id === $this->user->id));
    }

    public function close(Report $report): bool
    {
        return $report->isOpen() && $report->category_snapshot === 'ISSUE'
            && ($this->has('reports.solve.all') || ($this->has('reports.solve.own.area') && isset($this->subAreas[$report->sub_area_id], $this->subActivities[$report->sub_activity_id])));
    }

    public function actions(Report $report): array
    {
        return ['update' => $this->update($report), 'delete' => $this->delete($report), 'close' => $this->close($report)];
    }

    private function has(string $permission): bool
    {
        return isset($this->permissions[$permission]);
    }
}
