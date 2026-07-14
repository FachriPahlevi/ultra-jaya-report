<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index()
    {
        $activities = Activity::with('parent:id,name')
            ->latest()
            ->paginate(10);

        $activities->through(function (Activity $activity) {
            return [
                'id' => $activity->id,
                'name' => $activity->name,
                'description' => $activity->description,
                'parent_id' => $activity->parent_id,
                'parent' => $activity->parent ? [
                    'id' => $activity->parent->id,
                    'name' => $activity->parent->name,
                ] : null,
                'level' => $activity->parent_id ? 'sub' : 'parent',
            ];
        });

        return Inertia::render('activities/Index', [
            'activities' => $activities,
            'parentActivities' => Activity::whereNull('parent_id')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:activities,name',
            'description' => 'nullable|string|max:500',
            'parent_id' => 'nullable|exists:activities,id',
        ]);

        Activity::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return redirect()->route('activities.index');
    }

    public function update(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:activities,name,' . $activity->id,
            'description' => 'nullable|string|max:500',
            'parent_id' => 'nullable|exists:activities,id|not_in:' . $activity->id,
        ]);

        $activity->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return redirect()->route('activities.index');
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();

        return redirect()->route('activities.index');
    }
}
