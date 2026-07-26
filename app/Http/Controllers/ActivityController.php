<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index()
    {
        $activities = Activity::with([
            'children' => fn($query) => $query
                ->withCount(['reportsAsType', 'reportsAsSubType'])
                ->orderBy('name'),
        ])
            ->withCount(['children', 'reportsAsType', 'reportsAsSubType'])
            ->whereNull('parent_id')
            ->orderBy('name')
            ->paginate(10);

        $activities->through(function (Activity $activity) {
            return [
                'id' => $activity->id,
                'name' => $activity->name,
                'description' => $activity->description,
                'is_active' => $activity->is_active,
                'parent_id' => null,
                'parent' => null,
                'level' => 'parent',
                'children_count' => $activity->children_count,
                'usage_count' => $activity->reports_as_type_count + $activity->reports_as_sub_type_count,
                'children' => $activity->children->map(fn(Activity $child) => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'description' => $child->description,
                    'is_active' => $child->is_active,
                    'parent_id' => $child->parent_id,
                    'parent' => [
                        'id' => $activity->id,
                        'name' => $activity->name,
                    ],
                    'level' => 'sub',
                    'usage_count' => $child->reports_as_type_count + $child->reports_as_sub_type_count,
                ])->values(),
            ];
        });

        return Inertia::render('activities/Index', [
            'activities' => $activities,
            'parentActivities' => Activity::whereNull('parent_id')
                ->where('is_active', true)
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'activityTotals' => [
                'all' => Activity::count(),
                'main' => Activity::whereNull('parent_id')->count(),
                'sub' => Activity::whereNotNull('parent_id')->count(),
                'active' => Activity::where('is_active', true)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
            'parent_id' => [
                'nullable',
                Rule::exists('activities', 'id')
                    ->whereNull('deleted_at')
                    ->whereNull('parent_id')
                    ->where('is_active', true),
            ],
            'sub_activities' => 'nullable|array|min:1',
            'sub_activities.*.name' => 'required_with:sub_activities|string|max:255',
            'sub_activities.*.description' => 'nullable|string|max:500',
        ]);

        if ($request->filled('parent_id') && $request->filled('sub_activities')) {
            foreach ($validated['sub_activities'] as $subActivity) {
                validator(
                    ['name' => $subActivity['name']],
                    ['name' => [Rule::unique('activities', 'name')->whereNull('deleted_at')]]
                )->validate();

                Activity::create([
                    'name' => $subActivity['name'],
                    'description' => $subActivity['description'] ?? null,
                    'is_active' => true,
                    'parent_id' => $validated['parent_id'],
                ]);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Sub activities created successfully.',
                ]);
            }

            return redirect()->route('activities.index');
        }

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('activities', 'name')->whereNull('deleted_at'),
            ],
        ]);

        Activity::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Activity created successfully.',
            ]);
        }

        return redirect()->route('activities.index');
    }

    public function update(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('activities', 'name')
                    ->ignore($activity->id)
                    ->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
            'parent_id' => [
                'nullable',
                'not_in:' . $activity->id,
                Rule::exists('activities', 'id')
                    ->whereNull('deleted_at')
                    ->whereNull('parent_id')
                    ->where('is_active', true),
            ],
        ]);

        if (($validated['parent_id'] ?? null) && $activity->children()->exists()) {
            return back()->withErrors([
                'parent_id' => 'Main activity with sub activities cannot be converted into a sub activity.',
            ]);
        }

        $activity->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'is_active' => $activity->parent_id !== null ? true : ($validated['is_active'] ?? $activity->is_active),
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Activity updated successfully.',
            ]);
        }

        return redirect()->route('activities.index');
    }

    public function updateStatus(Request $request, Activity $activity)
    {
        if ($activity->parent_id !== null) {
            return response()->json([
                'message' => 'Sub activity does not use active or inactive status. Delete it instead if it is no longer needed.',
            ], 422);
        }

        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $activity->update([
            'is_active' => $validated['is_active'],
        ]);

        if ($activity->parent_id === null) {
            $activity->children()->update([
                'is_active' => $validated['is_active'],
            ]);
        }

        return response()->json([
            'message' => 'Activity status updated successfully.',
        ]);
    }

    public function destroy(Activity $activity)
    {
        $usageCount = $activity->reportsAsType()->count() + $activity->reportsAsSubType()->count();

        if ($usageCount > 0) {
            return back()->withErrors([
                'activity' => 'This activity is already used in reports. Set it inactive instead of deleting it.',
            ]);
        }

        if ($activity->children()->exists()) {
            return back()->withErrors([
                'activity' => 'Delete or move all sub activities before deleting this main activity.',
            ]);
        }

        $activity->delete();

        return redirect()->route('activities.index');
    }
}
