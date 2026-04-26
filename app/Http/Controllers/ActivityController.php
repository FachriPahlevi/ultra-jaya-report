<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index()
    {
        $activities = Activity::select('id', 'name', 'description')
            ->latest()
            ->paginate(10);
        
        return Inertia::render('activities/Index', [
            'activities' => $activities
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:activities,name',
            'description' => 'nullable|string|max:500',
        ]);

        Activity::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        return redirect()->route('activities.index');
    }

    public function update(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:activities,name,' . $activity->id,
            'description' => 'nullable|string|max:500',
        ]);

        $activity->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        return redirect()->route('activities.index');
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();

        return redirect()->route('activities.index');
    }
}