<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);
        if (! in_array($perPage, [10, 25, 50, 100, -1], true)) {
            $perPage = 10;
        }
        $search = trim($request->string('search')->toString());

        $activities = Activity::with([
            'managers:id,name',
            'supervisors:id,name',
            'children' => fn ($query) => $query
                ->with(['managers:id,name', 'supervisors:id,name'])
                ->withCount(['reportsAsType', 'reportsAsSubType'])
                ->orderBy('name'),
        ])
            ->withCount(['children', 'reportsAsType', 'reportsAsSubType'])
            ->whereNull('parent_id')
            ->when($search !== '', fn ($query) => $query->where(function ($nestedQuery) use ($search) {
                $nestedQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('children', function ($childQuery) use ($search) {
                        $childQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
            }))
            ->orderBy('name')
            ->paginate($perPage === -1 ? 2147483647 : $perPage)
            ->withQueryString();

        $activities->through(function (Activity $activity) {
            return [
                'id' => $activity->id,
                'name' => $activity->name,
                'description' => $activity->description,
                'is_active' => $activity->is_active,
                'parent_id' => null,
                'parent' => null,
                'level' => 'parent',
                'children_count' => $activity->children_count,
                'usage_count' => $activity->reports_as_type_count + $activity->reports_as_sub_type_count,
                'managers' => $activity->managers->map(fn (User $manager) => ['id' => $manager->id, 'name' => $manager->name])->values(),
                'supervisors' => $activity->supervisors->map(fn (User $supervisor) => ['id' => $supervisor->id, 'name' => $supervisor->name])->values(),
                'children' => $activity->children->map(fn (Activity $child) => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'description' => $child->description,
                    'category' => $child->category,
                    'managers' => $child->managers->map(fn (User $manager) => ['id' => $manager->id, 'name' => $manager->name])->values(),
                    'supervisors' => $child->supervisors->map(fn (User $supervisor) => ['id' => $supervisor->id, 'name' => $supervisor->name])->values(),
                    'is_active' => $child->is_active,
                    'parent_id' => $child->parent_id,
                    'parent' => [
                        'id' => $activity->id,
                        'name' => $activity->name,
                    ],
                    'level' => 'sub',
                    'usage_count' => $child->reports_as_type_count + $child->reports_as_sub_type_count,
                ])->values(),
            ];
        });

        return Inertia::render('activities/Index', [
            'activities' => $activities,
            'parentActivities' => Activity::whereNull('parent_id')
                ->where('is_active', true)
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'managerOptions' => User::role('MANAGER')->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'supervisorOptions' => User::role('SUPERVISOR')->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'activityTotals' => [
                'all' => Activity::count(),
                'main' => Activity::whereNull('parent_id')->count(),
                'sub' => Activity::whereNotNull('parent_id')->count(),
                'active' => Activity::where('is_active', true)->count(),
            ],
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'canManageActivityCategory' => $request->user()?->hasRole('SUPER_ADMIN') ?? false,
            'canAssignActivityManager' => $this->canAssignManager($request),
            'canAssignActivitySupervisor' => $this->canAssignSupervisor($request),
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->storeRules($request));
        $isBulkSubActivity = $request->filled('parent_id') && $request->filled('sub_activities');
        $assigneeIds = $isBulkSubActivity ? [] : $this->resolveAssigneeIds($request, $validated, $request->filled('parent_id'));

        if ($isBulkSubActivity) {
            foreach ($validated['sub_activities'] as $subActivity) {
                Activity::create([
                    'name' => $subActivity['name'],
                    'description' => $subActivity['description'] ?? null,
                    'category' => $this->categoryForCreate($request, $subActivity['category'] ?? null),
                    'is_active' => true,
                    'parent_id' => $validated['parent_id'],
                ]);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Subaktivitas berhasil dibuat.',
                ]);
            }

            return redirect()->route('activities.index');
        }

        $activity = Activity::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'parent_id' => $validated['parent_id'] ?? null,
            'category' => $this->categoryForCreate($request, $validated['category'] ?? null),
        ]);

        $activity->assignees()->sync($assigneeIds);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Aktivitas berhasil dibuat.',
            ]);
        }

        return redirect()->route('activities.index');
    }

    public function update(Request $request, Activity $activity): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->updateRules($activity));
        $isSubActivity = ($validated['parent_id'] ?? $activity->parent_id) !== null;
        $assigneeIds = $this->resolveAssigneeIds($request, $validated, $isSubActivity, $activity);

        if (($validated['parent_id'] ?? null) && $activity->children()->exists()) {
            throw ValidationException::withMessages([
                'parent_id' => 'Aktivitas utama yang memiliki subaktivitas tidak dapat dijadikan subaktivitas.',
            ]);
        }

        $activity->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'is_active' => $activity->parent_id !== null ? true : ($validated['is_active'] ?? $activity->is_active),
            'parent_id' => $validated['parent_id'] ?? null,
            'category' => $this->categoryForUpdate($request, $activity, $validated['category'] ?? null),
        ]);

        $activity->assignees()->sync($assigneeIds);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Aktivitas berhasil diperbarui.',
            ]);
        }

        return redirect()->route('activities.index');
    }

    public function updateAssignees(Request $request, Activity $activity): JsonResponse
    {
        $validated = $request->validate($this->assignmentRules());
        $assigneeIds = $this->resolveAssigneeIds($request, $validated, $activity->parent_id !== null, $activity);

        $activity->assignees()->sync($assigneeIds);

        return response()->json([
            'message' => 'Penugasan pengguna berhasil diperbarui.',
        ]);
    }

    public function updateStatus(Request $request, Activity $activity): JsonResponse
    {
        if ($activity->parent_id !== null) {
            throw new BusinessException('Subaktivitas tidak memiliki status aktif atau nonaktif. Hapus subaktivitas jika sudah tidak diperlukan.');
        }

        $validated = $request->validate(['is_active' => ['required', 'boolean']]);

        $activity->update([
            'is_active' => $validated['is_active'],
        ]);

        if ($activity->parent_id === null) {
            $activity->children()->update([
                'is_active' => $validated['is_active'],
            ]);
        }

        return response()->json([
            'message' => 'Status aktivitas berhasil diperbarui.',
        ]);
    }

    public function destroy(Activity $activity): RedirectResponse
    {
        $usageCount = $activity->reportsAsType()->count() + $activity->reportsAsSubType()->count();

        if ($usageCount > 0) {
            throw ValidationException::withMessages([
                'activity' => 'Aktivitas ini sudah digunakan pada laporan. Nonaktifkan aktivitas jika sudah tidak diperlukan.',
            ]);
        }

        if ($activity->children()->exists()) {
            throw ValidationException::withMessages([
                'activity' => 'Hapus atau pindahkan semua subaktivitas sebelum menghapus aktivitas utama ini.',
            ]);
        }

        $activity->delete();

        return redirect()->route('activities.index');
    }

    private function storeRules(Request $request): array
    {
        return [
            'name' => [
                $request->filled('parent_id') && $request->filled('sub_activities') ? 'nullable' : 'required',
                'string',
                'max:255',
                Rule::unique('activities', 'name')->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'parent_id' => [
                'nullable',
                Rule::exists('activities', 'id')->whereNull('deleted_at')->whereNull('parent_id')->where('is_active', true),
            ],
            'sub_activities' => ['nullable', 'array', 'min:1'],
            'sub_activities.*.name' => [
                'required_with:sub_activities',
                'string',
                'max:255',
                'distinct',
                Rule::unique('activities', 'name')->whereNull('deleted_at'),
            ],
            'sub_activities.*.description' => ['nullable', 'string', 'max:500'],
            'sub_activities.*.category' => ['nullable', Rule::in(['REPORT', 'ISSUE'])],
            'category' => ['nullable', Rule::in(['REPORT', 'ISSUE'])],
            'manager_ids' => ['nullable', 'array'],
            'manager_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'supervisor_ids' => ['nullable', 'array'],
            'supervisor_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
        ];
    }

    private function updateRules(Activity $activity): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('activities', 'name')->ignore($activity)->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'parent_id' => [
                'nullable',
                'not_in:'.$activity->id,
                Rule::exists('activities', 'id')->whereNull('deleted_at')->whereNull('parent_id')->where('is_active', true),
            ],
            'category' => ['nullable', Rule::in(['REPORT', 'ISSUE'])],
            'manager_ids' => ['nullable', 'array'],
            'manager_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'supervisor_ids' => ['nullable', 'array'],
            'supervisor_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
        ];
    }

    private function assignmentRules(): array
    {
        return [
            'manager_ids' => ['nullable', 'array'],
            'manager_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'supervisor_ids' => ['nullable', 'array'],
            'supervisor_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
        ];
    }

    private function categoryForCreate(Request $request, ?string $category): string
    {
        if ($request->user()?->hasRole('SUPER_ADMIN') && in_array($category, ['REPORT', 'ISSUE'], true)) {
            return $category;
        }

        return 'ISSUE';
    }

    private function resolveAssigneeIds(Request $request, array $validated, bool $isSubActivity, ?Activity $activity = null): array
    {
        $hasManagerInput = array_key_exists('manager_ids', $validated);
        $hasSupervisorInput = array_key_exists('supervisor_ids', $validated);
        $managerIds = $hasManagerInput ? $validated['manager_ids'] : ($isSubActivity ? [] : $activity?->managers()->pluck('users.id')->all() ?? []);
        $supervisorIds = $hasSupervisorInput ? $validated['supervisor_ids'] : ($isSubActivity ? $activity?->supervisors()->pluck('users.id')->all() ?? [] : []);

        if ($hasManagerInput && ! $this->canAssignManager($request)) {
            throw new BusinessException('Anda tidak memiliki izin untuk menugaskan Manager reviewer.', 403);
        }

        if ($hasSupervisorInput && ! $this->canAssignSupervisor($request)) {
            throw new BusinessException('Anda tidak memiliki izin untuk menugaskan SPV penutup tiket.', 403);
        }

        if ($isSubActivity && $managerIds !== []) {
            throw ValidationException::withMessages(['manager_ids' => 'Manager reviewer hanya dapat ditugaskan pada aktivitas utama.']);
        }

        if (! $isSubActivity && $supervisorIds !== []) {
            throw ValidationException::withMessages(['supervisor_ids' => 'SPV penutup tiket hanya dapat ditugaskan pada sub-aktivitas.']);
        }

        $validManagerIds = User::role('MANAGER')->where('is_active', true)->whereIn('id', $managerIds)->pluck('id')->all();
        $validSupervisorIds = User::role('SUPERVISOR')->where('is_active', true)->whereIn('id', $supervisorIds)->pluck('id')->all();

        if (count($validManagerIds) !== count(array_unique($managerIds))) {
            throw ValidationException::withMessages(['manager_ids' => 'Hanya pengguna dengan role Manager yang dapat ditugaskan sebagai reviewer.']);
        }

        if (count($validSupervisorIds) !== count(array_unique($supervisorIds))) {
            throw ValidationException::withMessages(['supervisor_ids' => 'Hanya pengguna dengan role SPV yang dapat ditugaskan untuk menutup tiket.']);
        }

        return array_values(array_unique([...$validManagerIds, ...$validSupervisorIds]));
    }

    private function canAssignManager(Request $request): bool
    {
        return $request->user()?->hasRole('SUPER_ADMIN') || $request->user()?->can('activities.assign.manager');
    }

    private function canAssignSupervisor(Request $request): bool
    {
        return $request->user()?->hasRole('SUPER_ADMIN') || $request->user()?->can('activities.assign.supervisor');
    }

    private function categoryForUpdate(Request $request, Activity $activity, ?string $category): string
    {
        if (! $request->user()?->hasRole('SUPER_ADMIN')) {
            return $activity->category ?? 'ISSUE';
        }

        return $category ?? $activity->category ?? 'ISSUE';
    }
}
