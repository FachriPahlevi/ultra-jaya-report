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
    public function index(): Response
    {
        $user = Auth::user();

        if ($user->can('areas.view.all') || $user->hasRole('SUPER_ADMIN') || $user->hasRole('ADMIN')) {
            $areas = Area::withTrashed()
                ->with(['pics:id,name', 'subAreas.supervisors:id,name'])
                ->latest()
                ->paginate(10);
        } else {
            $areas = Area::with(['pics:id,name', 'subAreas.supervisors:id,name'])
                ->where('is_active', true)
                ->whereHas('pics', fn ($query) => $query->where('users.id', $user->id))
                ->latest()
                ->paginate(10);
        }

        $areas->through(function (Area $area) {
            return [
                'id' => $area->id,
                'area' => $area->area,
                'deleted_at' => $area->deleted_at,
                'pics' => $area->pics->map(fn ($pic) => [
                    'id' => $pic->id,
                    'name' => $pic->name,
                ])->values(),
                'pic_user_ids' => $area->pics->pluck('id')->values(),
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

        $users = [];
        if ($user->can('areas.assign.supervisor') || $user->hasRole('SUPER_ADMIN') || $user->hasRole('ADMIN')) {
            $users = User::role('SUPERVISOR')
                ->with(['assignedAreas:id,area'])
                ->select('id', 'name')
                ->get()
                ->map(function (User $supervisor) {
                    $assignedArea = $supervisor->assignedAreas->first();

                    return [
                        'id' => $supervisor->id,
                        'name' => $supervisor->name,
                        'assigned_area_id' => $assignedArea?->id,
                        'assigned_area_name' => $assignedArea?->area,
                    ];
                })
                ->values();
        }

        return Inertia::render('areas/Index', [
            'areas' => $areas,
            'users' => $users,
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->areaRules());

        $picUserIds = $validated['pic_user_ids'] ?? [];
        $this->ensurePicsAvailable($picUserIds);

        $area = DB::transaction(function () use ($validated, $picUserIds): Area {
            $area = Area::create([
                'area' => $validated['name'],
                'is_active' => true,
            ]);

            $area->pics()->sync($picUserIds);
            $area->subAreas()->create(['name' => 'Umum', 'max_personnel' => 1]);

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

        $subArea->update($request->validate($this->subAreaRules($area, $subArea)));

        return response()->json(['data' => $subArea->fresh()]);
    }

    public function destroySubArea(Area $area, SubArea $subArea): JsonResponse
    {
        $this->ensureSubAreaBelongsToArea($area, $subArea);

        if ($subArea->reports()->exists()) {
            throw new BusinessException('Sub-area yang sudah memiliki laporan tidak dapat dihapus.');
        }

        $subArea->supervisors()->detach();
        $subArea->delete();

        return response()->json(['message' => 'Sub-area berhasil dihapus.']);
    }

    public function update(Request $request, Area $area): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->areaRules($area));

        $picUserIds = $validated['pic_user_ids'] ?? [];
        $this->ensurePicsAvailable($picUserIds, $area->id);

        DB::transaction(function () use ($area, $validated, $picUserIds): void {
            $area->update([
                'area' => $validated['name'],
            ]);

            $area->pics()->sync($picUserIds);
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
            throw new BusinessException('Area ini tidak berada di arsip.');
        }

        $area->restore();

        return response()->json([
            'success' => true,
            'message' => 'Area berhasil dipulihkan.',
        ]);

    }

    public function forceDestroy(int $areaId): JsonResponse
    {
        $area = Area::withTrashed()->findOrFail($areaId);

        if ($area->hasHistoricalReports()) {
            throw new BusinessException('Area yang sudah memiliki riwayat laporan tidak dapat dihapus permanen.');
        }

        DB::transaction(function () use ($area): void {
            $area->pics()->detach();
            $area->forceDelete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Area berhasil dihapus permanen.',
        ]);

    }

    private function ensurePicsAvailable(array $picUserIds, ?int $currentAreaId = null): void
    {
        if ($picUserIds === []) {
            return;
        }

        $conflicts = DB::table('area_user')
            ->join('areas', 'areas.id', '=', 'area_user.area_id')
            ->join('users', 'users.id', '=', 'area_user.user_id')
            ->whereIn('area_user.user_id', $picUserIds)
            ->when($currentAreaId, fn ($query) => $query->where('area_user.area_id', '!=', $currentAreaId))
            ->select('users.name', 'areas.area')
            ->get()
            ->map(fn ($item) => "{$item->name} sudah ditetapkan sebagai PIC di area {$item->area}")
            ->values()
            ->all();

        if (! empty($conflicts)) {
            throw ValidationException::withMessages([
                'pic_user_ids' => $conflicts,
            ]);
        }
    }

    private function areaRules(?Area $area = null): array
    {
        $uniqueArea = Rule::unique('areas', 'area')->whereNull('deleted_at');

        if ($area !== null) {
            $uniqueArea->ignore($area);
        }

        return [
            'name' => ['required', 'string', 'max:255', $uniqueArea],
            'pic_user_ids' => ['nullable', 'array'],
            'pic_user_ids.*' => ['exists:users,id'],
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
