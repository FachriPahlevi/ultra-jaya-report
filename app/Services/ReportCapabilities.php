<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Report;
use App\Models\User;
use App\Models\SubActivity;

/** A request-local permission snapshot shared by record policies and report lists. */
final class ReportCapabilities
{
    private array $permissions;

    private array $subAreas = [];

    private array $roleSubActivities = [];

    public function __construct(private readonly User $user)
    {
        $this->permissions = array_fill_keys($user->getAllPermissions()->pluck('name')->all(), true);
        $ids = SubActivity::withTrashed()->whereHas('accessRoles', fn ($roles) => $roles->whereIn('roles.id', $user->roles()->select('roles.id')))->pluck('id')->all();
        $this->roleSubActivities = array_fill_keys($ids, true);
        if ($this->has('reports.solve.own.area')) {
            $user->loadMissing('supervisedSubAreas:sub_areas.id');
            $this->subAreas = array_fill_keys($user->supervisedSubAreas->modelKeys(), true);
        }
    }

    public function view(Report $report): bool
    {
        return $this->has('reports.view.all') || $this->has('reports.solve.all') || $this->has('reports.edit.all') || $this->has('reports.delete.all')
            || ($report->author_id === $this->user->id && ($this->has('reports.view.own') || $this->has('reports.create') || $this->has('reports.edit.own') || $this->has('reports.delete.own')))
            || ($this->has('reports.solve.own.area') && isset($this->subAreas[$report->sub_area_id]))
            || ($this->has('reports.review.area') && isset($this->roleSubActivities[$report->sub_activity_id]));
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
        if (! $report->isOpen() || $report->category_snapshot !== 'ISSUE') {
            return false;
        }
        return isset($this->roleSubActivities[$report->sub_activity_id])
            && ($this->has('reports.solve.all') || ($this->has('reports.solve.own.area') && isset($this->subAreas[$report->sub_area_id])));
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
