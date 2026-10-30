<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\Area;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AreaController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $perPage = $this->resolvePerPage($request);
        $search = trim($request->string('search')->toString());

        if ($user->can('areas.view.all')) {
            $areas = Area::withTrashed()
                ->with(['managers:id,name', 'subAreas.supervisors:id,name'])
                ->when($search !== '', fn ($query) => $query->where('area', 'like', "%{$search}%"))
                ->latest()
                ->paginate($perPage === -1 ? 2147483647 : $perPage)
                ->withQueryString();
        } else {
            $areas = Area::with(['managers:id,name', 'subAreas.supervisors:id,name'])
                ->where('is_active', true)
                ->where(fn ($query) => $query->whereHas('pics', fn ($users) => $users->whereKey($user->id))
                    ->orWhereHas('subAreas.supervisors', fn ($users) => $users->whereKey($user->id)))
                ->when($search !== '', fn ($query) => $query->where('area', 'like', "%{$search}%"))
                ->latest()
                ->paginate($perPage === -1 ? 2147483647 : $perPage)
                ->withQueryString();
        }

        $areas->through(function (Area $area) {
            return [
                'id' => $area->id,
                'area' => $area->area,
                'deleted_at' => $area->deleted_at,
                'managers' => $area->managers->map(fn (User $manager) => [
                    'id' => $manager->id,
                    'name' => $manager->name,
                ])->values(),
                'sub_areas' => $area->subAreas->map(fn (SubArea $subArea) => [
                    'id' => $subArea->id,
                    'name' => $subArea->name,
                    'max_personnel' => $subArea->max_personnel,
                    'personnel_count' => $subArea->supervisors->count(),
                    'supervisors' => $subArea->supervisors
                        ->map(fn (User $supervisor) => ['id' => $supervisor->id, 'name' => $supervisor->name])
                        ->values(),
                ])->values(),
            ];
        });

        return Inertia::render('areas/Index', [
            'areas' => $areas,
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'managerOptions' => $user->can('users.assign.area') ? User::permission('reports.review.area')->where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'supervisorOptions' => $user->can('users.assign.area') ? User::permission(['reports.solve.own.area', 'reports.solve.all'])->where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function updateAssignees(Request $request, Area $area): JsonResponse
    {
        $this->ensureAreaAccessible($request, $area);
        $area->managers()->sync($this->assigneeIds($request, ['reports.review.area']));

        return response()->json(['message' => 'Area assignees updated successfully.']);
    }

    public function updateSubAreaAssignees(Request $request, Area $area, SubArea $subArea): JsonResponse
    {
        $this->ensureAreaAccessible($request, $area);
        $this->ensureSubAreaBelongsToArea($area, $subArea);
        $ids = $this->assigneeIds($request, ['reports.solve.own.area', 'reports.solve.all']);

        DB::transaction(function () use ($subArea, $ids): void {
            $locked = SubArea::whereKey($subArea->id)->lockForUpdate()->firstOrFail();
            $locked->supervisors()->sync($ids);
        });

        return response()->json(['message' => 'Sub-area assignees updated successfully.']);
    }

    private function ensureAreaAccessible(Request $request, Area $area): void
    {
        $user = $request->user();
        if ($user->can('areas.view.all')) {
            return;
        }
        abort_unless($area->is_active && ($area->pics()->whereKey($user->id)->exists()
            || $area->subAreas()->whereHas('supervisors', fn ($query) => $query->whereKey($user->id))->exists()), 403);
    }

    private function assigneeIds(Request $request, array $permissions): array
    {
        $validated = $request->validate([
            'user_ids' => ['present', 'array'],
            'user_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->whereNull('deleted_at')->where('is_active', true)],
        ]);
        $ids = $validated['user_ids'];
        if (User::permission($permissions)->whereIn('id', $ids)->count() !== count($ids)) {
            throw ValidationException::withMessages(['user_ids' => 'Select active users with permission for this assignment.']);
        }

        return $ids;
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', 10);

        return in_array($perPage, [10, 25, 50, 100, -1], true) ? $perPage : 10;
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->areaRules());

        $area = DB::transaction(function () use ($validated): Area {
            $area = Area::create([
                'area' => $validated['name'],
                'is_active' => true,
            ]);

            $area->subAreas()->create(['name' => 'General', 'max_personnel' => 1]);

            return $area;
        });

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'data' => $area], 201);
        }

        return redirect()->route('areas.index');
    }

    public function storeSubArea(Request $request, Area $area): JsonResponse
    {
        $validated = $request->validate($this->subAreaRules($area));

        return response()->json(['data' => $area->subAreas()->create($validated)], 201);
    }

    public function updateSubArea(Request $request, Area $area, SubArea $subArea): JsonResponse
    {
        $this->ensureSubAreaBelongsToArea($area, $subArea);
        $validated = $request->validate($this->subAreaRules($area, $subArea));
        $subArea->update($validated);

        return response()->json(['data' => $subArea->fresh()]);
    }

    public function destroySubArea(Area $area, SubArea $subArea): JsonResponse
    {
        $this->ensureSubAreaBelongsToArea($area, $subArea);

        if ($subArea->reports()->exists()) {
            throw new BusinessException('A sub-area with existing reports cannot be deleted.');
        }

        $subArea->supervisors()->detach();
        $subArea->delete();

        return response()->json(['message' => 'Sub-area deleted successfully.']);
    }

    public function update(Request $request, Area $area): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->areaRules($area));

        DB::transaction(function () use ($area, $validated): void {
            $area->update([
                'area' => $validated['name'],
            ]);

        });

        if ($request->wantsJson()) {
            return response()->json(['success' => true], 200);
        }

        return redirect()->route('areas.index');
    }

    public function destroy(Request $request, Area $area): JsonResponse|RedirectResponse
    {
        $area->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true], 200);
        }

        return redirect()->route('areas.index');
    }

    public function restore(int $areaId): JsonResponse
    {
        $area = Area::withTrashed()->findOrFail($areaId);

        if (! $area->trashed()) {
            throw new BusinessException('This area is not archived.');
        }

        $area->restore();

        return response()->json([
            'success' => true,
            'message' => 'Area restored successfully.',
        ]);

    }

    public function forceDestroy(int $areaId): JsonResponse
    {
        $area = Area::withTrashed()->findOrFail($areaId);

        if ($area->hasHistoricalReports()) {
            throw new BusinessException('An area with report history cannot be permanently deleted.');
        }

        DB::transaction(function () use ($area): void {
            $area->managers()->detach();
            $area->forceDelete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Area permanently deleted.',
        ]);

    }

    private function areaRules(?Area $area = null): array
    {
        $uniqueArea = Rule::unique('areas', 'area')->whereNull('deleted_at');

        if ($area !== null) {
            $uniqueArea->ignore($area);
        }

        return [
            'name' => ['required', 'string', 'max:255', $uniqueArea],
        ];
    }

    private function subAreaRules(Area $area, ?SubArea $subArea = null): array
    {
        $uniqueName = Rule::unique('sub_areas', 'name')
            ->where('area_id', $area->id)
            ->whereNull('deleted_at');

        if ($subArea !== null) {
            $uniqueName->ignore($subArea);
        }

        return [
            'name' => ['required', 'string', 'max:255', $uniqueName],
            'max_personnel' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }

    private function ensureSubAreaBelongsToArea(Area $area, SubArea $subArea): void
    {
        if ($subArea->area_id !== $area->id) {
            abort(404);
        }
    }
}
