<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\Area;
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
                ->with('pics:id,name')
                ->latest()
                ->paginate(10);
        } else {
            $areas = Area::with('pics:id,name')
                ->where('is_active', true)
                ->whereHas('pics', fn ($query) => $query->where('users.id', $user->id))
                ->latest()
                ->paginate(10);
        }

        $areas->through(function (Area $area) {
            return [
                'id' => $area->id,
                'area' => $area->area,
                'is_active' => $area->is_active,
                'deleted_at' => $area->deleted_at,
                'pics' => $area->pics->map(fn ($pic) => [
                    'id' => $pic->id,
                    'name' => $pic->name,
                ])->values(),
                'pic_user_ids' => $area->pics->pluck('id')->values(),
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
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $area->pics()->sync($picUserIds);

            return $area;
        });

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'data' => $area], 201);
        }

        return redirect()->route('areas.index');
    }

    public function update(Request $request, Area $area): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->areaRules($area));

        $picUserIds = $validated['pic_user_ids'] ?? [];
        $this->ensurePicsAvailable($picUserIds, $area->id);

        DB::transaction(function () use ($area, $validated, $picUserIds): void {
            $area->update([
                'area' => $validated['name'],
                'is_active' => $validated['is_active'] ?? $area->is_active,
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

    public function updateStatus(Request $request, Area $area): JsonResponse
    {
        $validated = $request->validate(['is_active' => ['required', 'boolean']]);

        $area->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $validated['is_active'] ? 'Area berhasil diaktifkan.' : 'Area berhasil dinonaktifkan.',
        ]);
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
            'is_active' => ['nullable', 'boolean'],
            'pic_user_ids' => ['nullable', 'array'],
            'pic_user_ids.*' => ['exists:users,id'],
        ];
    }
}
