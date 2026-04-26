<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $reports = Report::with(['user', 'area'])
            ->latest()
            ->paginate(10);

        $activities = Activity::select('id', 'name')->get();

        return Inertia::render('reports/Index', [
            'reports' => $reports,
            'activities' => $activities,
        ]);
    }
    public function create()
    {
        return Inertia::render('reports/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'area_id' => 'required|exists:areas,id',
        ]);

        $validated['user_id'] = auth()->id();

        Report::create($validated);

        return redirect()->route('report.index');
    }

    public function show(Report $report)
    {
        return Inertia::render('reports/Show', [
            'report' => $report->load('user', 'area'),
        ]);
    }

    public function edit(Report $report)
    {
        return Inertia::render('contents/edit-report', [
            'report' => $report->load('user', 'area'),
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'area_id' => 'required|exists:areas,id',
            'status' => 'nullable|string|max:100',
        ]);

        $report->update($validated);

        return redirect()->route('report.index');
    }

    public function destroy(Report $report)
    {
        $report->delete();

        return redirect()->route('report.index');
    }
}
