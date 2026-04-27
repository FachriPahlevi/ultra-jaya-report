<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::select('id', 'area')
            ->latest()
            ->paginate(10);
        
        return Inertia::render('areas/Index', [
            'areas' => $areas
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:areas,area',
            ]);

            $area = Area::create([
                'area' => $validated['name'],
                'pic_user_id' => auth()->id(),
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
            ]);

            $area->update([
                'area' => $validated['name'],
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