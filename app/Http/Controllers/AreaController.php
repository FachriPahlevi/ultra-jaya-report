<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:areas,area',
        ]);

        Area::create([
            'area' => $validated['name'],
        ]);

        return redirect()->route('areas.index');
    }

    public function update(Request $request, Area $area)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:areas,area,' . $area->id,
        ]);

        $area->update([
            'area' => $validated['name'],
        ]);

        return redirect()->route('areas.index');
    }

    public function destroy(Area $area)
    {
        $area->delete();

        return redirect()->route('areas.index');
    }
}