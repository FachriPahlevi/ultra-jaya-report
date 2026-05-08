<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $query = Report::with(['author.roles', 'area', 'activityType']);

        if ($user->can('reports.view.all')) {
        } elseif ($user->can('reports.solve.own.area')) {
            $query->whereHas('area', fn($q) => $q->where('pic_user_id', $user->id));
        } else {
            $query->where('author_id', $user->id);
        }

        $reports = $query->latest()->get()->map(function ($report) {
            return [
                'id'            => $report->id,
                'author_id'     => $report->author_id,
                'area_id'       => $report->area_id,
                'activity_id'   => $report->activity_id,
                'activity'      => $report->activity,
                'issue'         => $report->issue,
                'photo_before'  => $report->photo_before,
                'photo_after'   => $report->photo_after,
                'finished_date' => $report->finished_date,
                'created_at'    => $report->created_at,
                'updated_at'    => $report->updated_at,
                'author' => $report->author ? [
                    'id'   => $report->author->id,
                    'name' => $report->author->name,
                    'role' => $report->author->roles->first()?->name,
                ] : null,
                'area'          => $report->area ? ['id' => $report->area->id, 'area' => $report->area->area] : null,
                'activity_type' => $report->activityType ? [
                    'id'          => $report->activityType->id,
                    'name'        => $report->activityType->name,
                    'description' => $report->activityType->description,
                ] : null,
            ];
        });

        return Inertia::render('reports/Index', [
            'reports'    => $reports,
            'areas'      => Area::with('pic')->select('id', 'area', 'pic_user_id')->get(),
            'activities' => Activity::select('id', 'name', 'description')->get(),
            'users'      => User::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('reports.create')) {
            return back()->with('error', 'Anda tidak memiliki izin untuk membuat laporan');
        }

        $validated = $request->validate([
            'author_id'     => 'required|exists:users,id',
            'type_activity' => 'required|exists:activities,id',
            'area_activity' => 'required|exists:areas,id',
            'activity'      => 'nullable|string|max:255',
            'issue'         => 'required|string',
            'photo'         => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        Report::create([
            'author_id'   => $validated['author_id'],
            'activity_id' => $validated['type_activity'],
            'area_id'     => $validated['area_activity'],
            'activity'    => $validated['activity'],
            'issue'       => $validated['issue'],
            'photo_before' => $request->file('photo')->store('reports/photos', 'public'),
        ]);

        return back()->with('success', 'Laporan berhasil dibuat');
    }

    public function update(Request $request, Report $report)
    {
        $user = Auth::user();

        if ($user->can('reports.edit.all')) {
        } elseif ($user->can('reports.edit.own') && $report->author_id === $user->id) {
        } else {
            return back()->with('error', 'Anda tidak memiliki izin untuk mengedit laporan ini');
        }

        $validated = $request->validate([
            'type_activity' => 'sometimes|exists:activities,id',
            'area_activity' => 'sometimes|exists:areas,id',
            'activity'      => 'nullable|string|max:255',
            'issue'         => 'sometimes|string',
            'photo'         => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = ['is_content_edited' => true];

        if (isset($validated['type_activity'])) $data['activity_id'] = $validated['type_activity'];
        if (isset($validated['area_activity'])) $data['area_id'] = $validated['area_activity'];
        if (array_key_exists('activity', $validated)) $data['activity'] = $validated['activity'];
        if (isset($validated['issue'])) $data['issue'] = $validated['issue'];

        if ($request->hasFile('photo')) {
            if ($report->photo_before) Storage::disk('public')->delete($report->photo_before);
            $data['photo_before'] = $request->file('photo')->store('reports/photos', 'public');
        }

        $report->update($data);

        return back()->with('success', 'Laporan berhasil diupdate');
    }

    public function solve(Request $request, Report $report)
    {
        $user = Auth::user();

        if ($user->can('reports.solve.all')) {
        } elseif ($user->can('reports.solve.own.area')) {
            if ($report->area->pic_user_id !== $user->id) {
                return back()->with('error', 'Anda tidak memiliki izin untuk menyelesaikan laporan di area ini');
            }
        } else {
            return back()->with('error', 'Anda tidak memiliki izin untuk menyelesaikan laporan');
        }

        $request->validate([
            'photo_after' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $report->update([
            'photo_after'   => $request->file('photo_after')->store('reports/photos-after', 'public'),
            'finished_date' => now(),
            'solved_by'     => $user->id,
        ]);

        return back()->with('success', 'Laporan berhasil diselesaikan');
    }

    public function destroy(Report $report)
    {
        $user = Auth::user();

        if ($report->finished_date !== null) {
            return back()->with('error', 'Hanya laporan pending yang dapat dihapus');
        }

        if ($user->can('reports.delete.all')) {
        } elseif ($user->can('reports.delete.own') && $report->author_id === $user->id) {
        } else {
            return back()->with('error', 'Anda tidak memiliki izin untuk menghapus laporan ini');
        }

        if ($report->photo_before) Storage::disk('public')->delete($report->photo_before);
        if ($report->photo_after) Storage::disk('public')->delete($report->photo_after);

        $report->delete();

        return back()->with('success', 'Laporan berhasil dihapus');
    }

    public function show(Report $report)
    {
        $user = Auth::user();

        if ($user->can('reports.view.all')) {
        } elseif ($user->can('reports.view.own') && $report->author_id === $user->id) {
        } elseif ($user->can('reports.solve.own.area') && $report->area->pic_user_id === $user->id) {
        } else {
            abort(403, 'Anda tidak memiliki izin untuk melihat laporan ini');
        }

        return Inertia::render('reports/Show', [
            'report' => $report->load(['author', 'area', 'activityType']),
        ]);
    }

    public function export(Request $request, string $type)
    {
        $user = Auth::user();
        $query = Report::with(['author', 'area', 'activityType']);

        if ($user->can('reports.view.all')) {
        } elseif ($user->can('reports.solve.own.area')) {
            $query->whereHas('area', fn($q) => $q->where('pic_user_id', $user->id));
        } else {
            $query->where('author_id', $user->id);
        }

        if ($request->boolean('my_reports_only')) {
            $query->where('author_id', $user->id);
        }
        if ($request->filled('start_date')) $query->whereDate('created_at', '>=', $request->start_date);
        if ($request->filled('end_date')) $query->whereDate('created_at', '<=', $request->end_date);
        if ($request->filled('area_ids')) $query->whereIn('area_id', $request->area_ids);
        if ($request->filled('activity_ids')) $query->whereIn('activity_id', $request->activity_ids);
        if ($request->filled('status')) {
            $request->status === 'pending'
                ? $query->whereNull('finished_date')
                : $query->whereNotNull('finished_date');
        }
        if ($request->filled('author_ids')) $query->whereIn('author_id', $request->author_ids);

        $reports = $query->latest()->get();

        return $type === 'excel' ? $this->exportCsv($reports) : $this->exportPdf($reports);
    }

    private function exportCsv($reports)
    {
        $handle = fopen('php://output', 'w');
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="reports_' . date('Y-m-d_H-i-s') . '.csv"');
        header('Cache-Control: max-age=0');

        fputcsv($handle, ['No', 'ID', 'Author', 'Area', 'Type Activity', 'Activity', 'Issue', 'Photo Before', 'Photo After', 'Status', 'Created At'], ',', '"', '\\');

        foreach ($reports as $i => $report) {
            fputcsv($handle, [
                $i + 1,
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
            ], ',', '"', '\\');
        }

        fclose($handle);
        exit;
    }

    private function exportPdf($reports)
    {
        $pdf = Pdf::loadView('exports.reports', ['reports' => $reports]);
        $pdf->setPaper('a4', 'landscape');
        $pdf->setOptions([
            'defaultFont'        => 'Times New Roman',
            'isRemoteEnabled'    => false,
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled'       => false,
        ]);
        return $pdf->download('Laporan_Issue_Report_' . date('Y-m-d') . '.pdf');
    }
}