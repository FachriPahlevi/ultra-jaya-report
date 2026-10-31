<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\SubActivity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100, -1], true) ? $perPage : 10;
        $search = trim($request->string('search')->toString());
        $activities = Activity::with(['managers:id,name', 'children' => fn ($query) => $query
            ->with(['supervisors:id,name', 'accessRoles:id,name'])->withCount('reportsAsSubType')->orderBy('name')])
            ->withCount(['children', 'reportsAsType'])
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested
                ->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereHas('children', fn ($child) => $child->where('name', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%"))))
            ->orderBy('name')->paginate($perPage === -1 ? 2147483647 : $perPage)->withQueryString();

        $activities->through(fn (Activity $activity) => [
            'id' => $activity->id, 'name' => $activity->name, 'description' => $activity->description,
            'is_active' => $activity->is_active, 'activity_id' => null, 'level' => 'parent',
            'children_count' => $activity->children_count, 'usage_count' => $activity->reports_as_type_count,
            'managers' => $activity->managers->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])->values(),
            'supervisors' => [],
            'children' => $activity->children->map(fn (SubActivity $child) => [
                'id' => $child->id, 'activity_id' => $activity->id, 'name' => $child->name,
                'description' => $child->description, 'category' => $child->category,
                'is_active' => $activity->is_active, 'level' => 'sub',
                'activity' => ['id' => $activity->id, 'name' => $activity->name],
                'managers' => [], 'supervisors' => $child->supervisors->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])->values(),
                'access_roles' => $child->accessRoles->map(fn (Role $role) => ['id' => $role->id, 'name' => $role->name])->values(),
                'usage_count' => $child->reports_as_sub_type_count,
            ])->values(),
        ]);

        return Inertia::render('activities/Index', [
            'activities' => $activities,
            'parentActivities' => Activity::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'managerOptions' => $this->canAssign($request, 'manager') ? User::permission('reports.review.area')->where('is_active', true)->orderBy('name')->get(['id', 'name']) : collect(),
            'supervisorOptions' => $this->canAssign($request, 'supervisor') ? User::permission(['reports.solve.own.area', 'reports.solve.all'])->where('is_active', true)->orderBy('name')->get(['id', 'name']) : collect(),
            'activityTotals' => ['all' => Activity::count() + SubActivity::count(), 'main' => Activity::count(), 'sub' => SubActivity::count(), 'active' => Activity::where('is_active', true)->count()],
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'canManageActivityCategory' => $request->user()->can('activities.category.manage'),
            'canAssignActivityManager' => $this->canAssign($request, 'manager'),
            'canAssignActivitySupervisor' => $this->canAssign($request, 'supervisor'),
            'canManageAccessRoles' => $request->user()->can('permissions.manage'),
            'roleAccessEnabled' => config('activity_access.role_based'),
            'roleOptions' => $request->user()->can('permissions.manage') ? Role::where('guard_name', 'web')->orderBy('name')->get(['id', 'name']) : collect(),
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->activityRules());
        Activity::create($validated);

        return $this->saved($request, 'Activity created successfully.');
    }

    public function update(Request $request, Activity $activity): JsonResponse|RedirectResponse
    {
        $activity->update($request->validate($this->activityRules($activity)));

        return $this->saved($request, 'Activity updated successfully.');
    }

    public function storeSubActivities(Request $request, Activity $activity): JsonResponse|RedirectResponse
    {
        abort_unless($activity->is_active, 422, 'This activity is inactive.');
        $validated = $request->validate([
            'sub_activities' => ['required', 'array', 'min:1'],
            'sub_activities.*.name' => ['required', 'string', 'max:255', 'distinct', Rule::unique('sub_activities', 'name')->where('activity_id', $activity->id)->whereNull('deleted_at')],
            'sub_activities.*.description' => ['nullable', 'string', 'max:500'],
            'sub_activities.*.category' => ['sometimes', 'required', Rule::in(['ISSUE', 'REPORT'])],
        ]);
        DB::transaction(function () use ($validated, $request, $activity): void {
            foreach ($validated['sub_activities'] as $item) {
                $activity->children()->create([
                    'name' => $item['name'], 'description' => $item['description'] ?? null,
                    'category' => $request->user()->can('activities.category.manage') ? ($item['category'] ?? 'ISSUE') : 'ISSUE',
                ]);
            }
        });

        return $this->saved($request, 'Sub-activities created successfully.');
    }

    public function updateSubActivity(Request $request, Activity $activity, SubActivity $subActivity): JsonResponse|RedirectResponse
    {
        $this->ensureBelongsTo($activity, $subActivity);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('sub_activities', 'name')->where('activity_id', $activity->id)->whereNull('deleted_at')->ignore($subActivity)],
            'description' => ['nullable', 'string', 'max:500'],
            'category' => ['sometimes', 'required', Rule::in(['ISSUE', 'REPORT'])],
            'activity_id' => ['prohibited'],
            'parent_id' => ['prohibited'],
        ]);
        if (! $request->user()->can('activities.category.manage')) {
            unset($validated['category']);
        }
        $subActivity->update($validated);

        return $this->saved($request, 'Sub-activity updated successfully.');
    }

    public function updateAssignees(Request $request, Activity $activity): JsonResponse
    {
        abort_unless($this->canAssign($request, 'manager'), 403);
        $ids = $this->assigneeIds($request, 'manager_ids', ['reports.review.area']);
        $activity->managers()->sync($ids);

        return response()->json(['message' => 'Reviewer assignments updated successfully.']);
    }

    public function updateSubActivityAssignees(Request $request, Activity $activity, SubActivity $subActivity): JsonResponse
    {
        $this->ensureBelongsTo($activity, $subActivity);
        abort_unless($this->canAssign($request, 'supervisor'), 403);
        $subActivity->supervisors()->sync($this->assigneeIds($request, 'supervisor_ids', ['reports.solve.own.area', 'reports.solve.all']));

        return response()->json(['message' => 'Ticket closer assignments updated successfully.']);
    }

    public function updateAccessRoles(Request $request, Activity $activity, SubActivity $subActivity): JsonResponse
    {
        $this->ensureBelongsTo($activity, $subActivity);
        $validated = $request->validate([
            'role_ids' => ['present', 'array'],
            'role_ids.*' => ['integer', 'distinct', Rule::exists('roles', 'id')->where('guard_name', 'web')],
        ]);
        $subActivity->accessRoles()->sync($validated['role_ids']);

        return response()->json(['message' => 'Sub-activity access roles updated successfully.']);
    }

    public function updateStatus(Request $request, Activity $activity): JsonResponse
    {
        $activity->update($request->validate(['is_active' => ['required', 'boolean']]));

        return response()->json(['message' => 'Activity status updated successfully.']);
    }

    public function destroy(Activity $activity): RedirectResponse
    {
        if ($activity->reportsAsType()->withTrashed()->exists()) {
            throw ValidationException::withMessages(['activity' => 'This activity is used in reports. Deactivate it instead if it is no longer needed.']);
        }
        if ($activity->children()->exists()) {
            throw ValidationException::withMessages(['activity' => 'Delete all sub-activities first.']);
        }
        $activity->delete();

        return redirect()->route('activities.index');
    }

    public function destroySubActivity(Activity $activity, SubActivity $subActivity): RedirectResponse
    {
        $this->ensureBelongsTo($activity, $subActivity);
        if ($subActivity->reportsAsSubType()->withTrashed()->exists()) {
            throw ValidationException::withMessages(['activity' => 'This sub-activity is used in reports and cannot be deleted.']);
        }
        $subActivity->delete();

        return redirect()->route('activities.index');
    }

    private function activityRules(?Activity $activity = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('activities', 'name')->whereNull('deleted_at')->ignore($activity)],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'parent_id' => ['prohibited'], 'activity_id' => ['prohibited'], 'category' => ['prohibited'],
            'manager_ids' => ['prohibited'], 'supervisor_ids' => ['prohibited'],
        ];
    }

    private function assigneeIds(Request $request, string $field, array $permissions): array
    {
        $validated = $request->validate([
            $field => ['present', 'array'],
            $field.'.*' => ['integer', 'distinct', Rule::exists('users', 'id')->whereNull('deleted_at')->where('is_active', true)],
        ]);
        $ids = $validated[$field];
        if (User::permission($permissions)->whereIn('id', $ids)->count() !== count($ids)) {
            throw ValidationException::withMessages([$field => 'Select active users with permission for this assignment.']);
        }

        return $ids;
    }

    private function canAssign(Request $request, string $role): bool
    {
        return $request->user()->can('activities.assign.'.$role);
    }

    private function ensureBelongsTo(Activity $activity, SubActivity $subActivity): void
    {
        abort_unless($subActivity->activity_id === $activity->id, 404);
    }

    private function saved(Request $request, string $message): JsonResponse|RedirectResponse
    {
        return $request->expectsJson() ? response()->json(['message' => $message]) : redirect()->route('activities.index');
    }
}
