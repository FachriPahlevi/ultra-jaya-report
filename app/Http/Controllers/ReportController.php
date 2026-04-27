<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $areaReports = Report::with(['author', 'area', 'activity'])
            ->whereHas('area', function ($query) use ($user) {
                $query->where('pic_user_id', $user->id);
            })
            ->latest()
            ->paginate(10);

        $areas = Area::select('id', 'area')->get();
        $activities = Activity::select('id', 'description')->get();

        return Inertia::render('reports/Index', [
            'areaReports' => $areaReports,
            'areas' => $areas,
            'activities' => $activities,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_activity' => 'required|exists:activities,id',
            'area_activity' => 'required|exists:areas,id',
            'activity' => 'nullable|string|max:255',
            'issue' => 'required|string',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $photoPath = $request->file('photo')->store('reports/photos', 'public');

        Report::create([
            'activity_id' => $validated['type_activity'],
            'area_id' => $validated['area_activity'],
            'activity' => $validated['activity'],
            'issue' => $validated['issue'],
            'photo_before' => $photoPath,
            'author_id' => Auth::id(),
            'finished_date' => null,
            'is_content_edited' => false,
        ]);

        return redirect()->back();
    }

    public function solve(Request $request, Report $report)
    {
        $validated = $request->validate([
            'photo_after' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $photoPath = $request->file('photo_after')->store('reports/photos-after', 'public');

        $report->update([
            'photo_after' => $photoPath,
            'finished_date' => now(),
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Report $report)
    {
        $validated = $request->validate([
            'type_activity' => 'sometimes|exists:activities,id',
            'area_activity' => 'sometimes|exists:areas,id',
            'activity' => 'nullable|string|max:255',
            'issue' => 'sometimes|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $updateData = ['is_content_edited' => true];

        if ($request->hasFile('photo')) {
            if ($report->photo_before) {
                Storage::disk('public')->delete($report->photo_before);
            }
            $photoPath = $request->file('photo')->store('reports/photos', 'public');
            $updateData['photo_before'] = $photoPath;
        }

        if (isset($validated['type_activity'])) {
            $updateData['activity_id'] = $validated['type_activity'];
        }

        if (isset($validated['area_activity'])) {
            $updateData['area_id'] = $validated['area_activity'];
        }

        if (isset($validated['activity'])) {
            $updateData['activity'] = $validated['activity'];
        }

        if (isset($validated['issue'])) {
            $updateData['issue'] = $validated['issue'];
        }

        $report->update($updateData);

        return redirect()->back();
    }

    public function destroy(Report $report)
    {
        if ($report->photo_before) {
            Storage::disk('public')->delete($report->photo_before);
        }
        if ($report->photo_after) {
            Storage::disk('public')->delete($report->photo_after);
        }

        $report->delete();

        return redirect()->back();
    }

    public function show(Report $report)
    {
        return Inertia::render('reports/Show', [
            'report' => $report->load(['author', 'area', 'activity']),
        ]);
    }
}