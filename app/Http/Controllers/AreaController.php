<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreaController extends Controller
{
    public function index()
    {
        return Inertia::render('Areas/Index', [
            'areas' => Area::with('pic')->latest()->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'area' => 'required|string|max:255',
        ]);

        Area::create($validated);

        return redirect()
            ->route('areas.index')
            ->with('success', 'Area created successfully');
    }

    public function update(Request $request, Area $area)
    {
        $validated = $request->validate([
            'area' => 'required|string|max:255',
        ]);

        $area->update($validated);

        return redirect()
            ->route('areas.index')
            ->with('success', 'Area updated successfully');
    }

    public function destroy(Area $area)
    {
        $area->delete();

        return redirect()
            ->route('areas.index')
            ->with('success', 'Area deleted successfully');
    }
}
