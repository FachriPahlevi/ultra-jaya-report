<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
   public function index(Request $request)
    {
        $user = Auth::user();

        $query = Report::with(['author', 'area', 'activityType']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('issue', 'like', "%{$search}%")
                    ->orWhereHas('author', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'pending') {
                $query->whereNull('finished_date');
            } elseif ($request->status === 'solved') {
                $query->whereNotNull('finished_date');
            }
        }

        if ($request->filled('type')) {
            $query->where('activity_id', $request->type);
        }

        $areaReports = $query->latest()->paginate(10);

        $areas = Area::select('id', 'area')->get();
        $activities = Activity::select('id', 'description')->get();
        $users = \App\Models\User::select('id', 'name')->get();

        return Inertia::render('reports/Index', [
            'areaReports' => $areaReports,
            'areas' => $areas,
            'activities' => $activities,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'author_id' => 'required|exists:users,id',
            'type_activity' => 'required|exists:activities,id',
            'area_activity' => 'required|exists:areas,id',
            'activity' => 'nullable|string|max:255',
            'issue' => 'required|string',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $photoPath = $request->file('photo')->store('reports/photos', 'public');

        Report::create([
            'author_id' => $validated['author_id'],
            'activity_id' => $validated['type_activity'],
            'area_id' => $validated['area_activity'],
            'activity' => $validated['activity'],
            'issue' => $validated['issue'],
            'photo_before' => $photoPath,
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
            'report' => $report->load(['author', 'area', 'activityType']),
        ]);
    }

public function export(Request $request, $type)
{
    $query = Report::with(['author', 'area', 'activityType']);

    if ($request->filled('start_date')) {
        $query->whereDate('created_at', '>=', $request->start_date);
    }
    if ($request->filled('end_date')) {
        $query->whereDate('created_at', '<=', $request->end_date);
    }
    if ($request->filled('area_id')) {
        $query->where('area_id', $request->area_id);
    }
    if ($request->filled('activity_id')) {
        $query->where('activity_id', $request->activity_id);
    }
    if ($request->filled('status')) {
        if ($request->status === 'pending') {
            $query->whereNull('finished_date');
        } elseif ($request->status === 'solved') {
            $query->whereNotNull('finished_date');
        }
    }
    if ($request->filled('author_id')) {
        $query->where('author_id', $request->author_id);
    }

    $reports = $query->latest()->get();

    if ($type === 'excel') {
        return $this->exportCsv($reports);
    } else {
        return $this->exportPdf($reports);
    }
}

    private function exportCsv($reports)
    {
        $filename = 'reports_' . date('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://output', 'w');
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        fputcsv($handle, ['No', 'ID', 'Author', 'Area', 'Type Activity', 'User Activity', 'Issue', 'Photo Before', 'Photo After', 'Status', 'Created At', 'Updated At']);
        
        $row = 1;
        foreach ($reports as $report) {
            fputcsv($handle, [
                $row++,
                $report->id,
                $report->author?->name ?? '-',
                $report->area?->area ?? '-',
                $report->activityType?->description ?? '-',
                $report->activity ?? '-',
                $report->issue,
                $report->photo_before ? 'Yes' : 'No',
                $report->photo_after ? 'Yes' : 'No',
                $report->finished_date ? 'Solved' : 'Pending',
                $report->created_at,
                $report->updated_at,
            ]);
        }
        
        fclose($handle);
        exit;
    }
private function exportPdf($reports)
{
    $pdf = Pdf::loadView('exports.reports', ['reports' => $reports]);
    $pdf->setPaper('a4', 'landscape');
    $pdf->setOptions([
        'defaultFont' => 'Times New Roman',
        'isRemoteEnabled' => false,
        'isHtml5ParserEnabled' => true,
        'isPhpEnabled' => false
    ]);
    return $pdf->download('Laporan_Issue_Report_' . date('Y-m-d') . '.pdf');
}
}   