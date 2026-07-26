<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AreaController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->can('areas.view.all') || $user->hasRole('SUPER_ADMIN') || $user->hasRole('ADMIN')) {
            $areas = Area::with('pics:id,name')
                ->latest()
                ->paginate(10);
        } elseif ($user->hasRole('SUPERVISOR')) {
            $areas = Area::with('pics:id,name')
                ->whereHas('pics', fn($query) => $query->where('users.id', $user->id))
                ->latest()
                ->paginate(10);
        } else {
            $areas = Area::with('pics:id,name')
                ->whereHas('pics', fn($query) => $query->where('users.id', $user->id))
                ->latest()
                ->paginate(10);
        }

        $areas->through(function (Area $area) {
            return [
                'id' => $area->id,
                'area' => $area->area,
                'pics' => $area->pics->map(fn($pic) => [
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:areas,area',
                'pic_user_ids' => 'nullable|array',
                'pic_user_ids.*' => 'exists:users,id',
            ]);

            $picUserIds = $validated['pic_user_ids'] ?? [];
            $this->ensurePicsAvailable($picUserIds);

            $area = Area::create(['area' => $validated['name']]);
            $area->pics()->sync($picUserIds);

            if ($request->wantsJson()) {
                return response()->json(['success' => true, 'data' => $area], 200);
            }

            return redirect()->route('areas.index');
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Area $area)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:areas,area,' . $area->id,
                'pic_user_ids' => 'nullable|array',
                'pic_user_ids.*' => 'exists:users,id',
            ]);

            $picUserIds = $validated['pic_user_ids'] ?? [];
            $this->ensurePicsAvailable($picUserIds, $area->id);

            $area->update(['area' => $validated['name']]);
            $area->pics()->sync($picUserIds);

            if ($request->wantsJson()) {
                return response()->json(['success' => true], 200);
            }

            return redirect()->route('areas.index');
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Area $area)
    {
        try {
            $area->delete();

            if (request()->wantsJson()) {
                return response()->json(['success' => true], 200);
            }

            return redirect()->route('areas.index');
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'Failed to delete area'
            ], 500);
        }
    }

    private function ensurePicsAvailable(array $picUserIds, ?int $currentAreaId = null): void
    {
        if (empty($picUserIds)) {
            return;
        }

        $conflicts = DB::table('area_user')
            ->join('areas', 'areas.id', '=', 'area_user.area_id')
            ->join('users', 'users.id', '=', 'area_user.user_id')
            ->whereIn('area_user.user_id', $picUserIds)
            ->when($currentAreaId, fn($query) => $query->where('area_user.area_id', '!=', $currentAreaId))
            ->select('users.name', 'areas.area')
            ->get()
            ->map(fn($item) => "{$item->name} is already assigned to {$item->area}")
            ->values()
            ->all();

        if (!empty($conflicts)) {
            throw ValidationException::withMessages([
                'pic_user_ids' => $conflicts,
            ]);
        }
    }
}
