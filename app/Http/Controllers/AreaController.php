<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;

class AreaController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Admin dan SUPER_ADMIN bisa lihat semua area
        if ($user->can('areas.view.all') || $user->hasRole('SUPER_ADMIN') || $user->hasRole('ADMIN')) {
            $areas = Area::select('id', 'area', 'pic_user_id')
                ->with('pic')
                ->latest()
                ->paginate(10);
        } 
        // SUPERVISOR hanya lihat area yang dia menjadi PIC
        elseif ($user->hasRole('SUPERVISOR')) {
            $areas = Area::select('id', 'area', 'pic_user_id')
                ->with('pic')
                ->where('pic_user_id', $user->id)
                ->latest()
                ->paginate(10);
        }
        // USER biasa tidak bisa lihat area
        else {
            $areas = Area::select('id', 'area', 'pic_user_id')
                ->with('pic')
                ->where('pic_user_id', $user->id)
                ->latest()
                ->paginate(10);
        }
        
        // Kirim users untuk dropdown PIC (hanya untuk ADMIN dan SUPER_ADMIN)
        $users = [];
        if ($user->can('areas.assign.supervisor') || $user->hasRole('SUPER_ADMIN') || $user->hasRole('ADMIN')) {
            $users = \App\Models\User::role('SUPERVISOR')->select('id', 'name')->get();
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
                'pic_user_id' => 'nullable|exists:users,id',
            ]);

            $area = Area::create([
                'area' => $validated['name'],
                'pic_user_id' => $validated['pic_user_id'] ?? Auth::id(),
            ]);

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
                'pic_user_id' => 'nullable|exists:users,id',
            ]);

            $area->update([
                'area' => $validated['name'],
                'pic_user_id' => $validated['pic_user_id'] ?? $area->pic_user_id,
            ]);

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
}