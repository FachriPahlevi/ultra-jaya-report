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

        $query = Report::with(['author.roles', 'area.pics', 'activityType.parent', 'subActivity']);

        if ($user->can('reports.view.all')) {
        } elseif ($user->can('reports.solve.own.area')) {
            $query->whereHas('area.pics', fn ($q) => $q->where('users.id', $user->id));
        } else {
            $query->where('author_id', $user->id);
        }

        $reports = $query->latest()->get()->map(function ($report) {
            return [
                'id'            => $report->id,
                'author_id'     => $report->author_id,
                'area_id'       => $report->area_id,
                'activity_id'   => $report->activity_id,
                'sub_activity_id' => $report->sub_activity_id,
                'activity'      => $report->activity,
                'issue'         => $report->issue,
                'status'        => $report->status,
                'photo_before'  => $report->photo_before,
                'photo_after'   => $report->photo_after,
                'closed_at'     => $report->closed_at,
                'created_at'    => $report->created_at,
                'updated_at'    => $report->updated_at,
                'author' => $report->author ? [
                    'id'   => $report->author->id,
                    'name' => $report->author->name,
                    'role' => $report->author->roles->first()?->name,
                ] : null,
                'area' => $report->area ? [
                    'id' => $report->area->id,
                    'area' => $report->area->area,
                    'pics' => $report->area->pics->map(fn ($pic) => [
                        'id' => $pic->id,
                        'name' => $pic->name,
                    ])->values(),
                ] : null,
                'activity_type' => $report->activityType ? [
                    'id'          => $report->activityType->id,
                    'name'        => $report->activityType->name,
                    'description' => $report->activityType->description,
                    'parent_id'   => $report->activityType->parent_id,
                    'parent_name' => $report->activityType->parent?->name,
                ] : null,
                'sub_activity' => $report->subActivity ? [
                    'id' => $report->subActivity->id,
                    'name' => $report->subActivity->name,
                    'description' => $report->subActivity->description,
                ] : null,
            ];
        });

        return Inertia::render('reports/Index', [
            'reports'    => $reports,
            'areas'      => Area::with('pics:id,name')->select('id', 'area')->get()->map(function (Area $area) {
                return [
                    'id' => $area->id,
                    'area' => $area->area,
                    'pics' => $area->pics->map(fn ($pic) => ['id' => $pic->id, 'name' => $pic->name])->values(),
                    'pic_user_ids' => $area->pics->pluck('id')->values(),
                ];
            }),
            'activities' => Activity::with('children:id,name,description,parent_id')
                ->whereNull('parent_id')
                ->orderBy('name')
                ->get()
                ->map(function (Activity $activity) {
                    return [
                        'id' => $activity->id,
                        'name' => $activity->name,
                        'description' => $activity->description,
                        'sub_activities' => $activity->children->map(fn ($child) => [
                            'id' => $child->id,
                            'name' => $child->name,
                            'description' => $child->description,
                            'parent_id' => $child->parent_id,
                        ])->values(),
                    ];
                }),
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
            'sub_activity_id' => 'nullable|exists:activities,id',
            'area_activity' => 'required|exists:areas,id',
            'activity'      => 'nullable|string|max:255',
            'issue'         => 'required|string',
            'photo'         => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        Report::create([
            'author_id'   => $validated['author_id'],
            'activity_id' => $validated['type_activity'],
            'sub_activity_id' => $validated['sub_activity_id'] ?? null,
            'area_id'     => $validated['area_activity'],
            'activity'    => $validated['activity'],
            'issue'       => $validated['issue'],
            'status'      => 'open',
            'photo_before' => $request->hasFile('photo')
                ? $request->file('photo')->store('reports/photos', 'public')
                : null,
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
            'sub_activity_id' => 'nullable|exists:activities,id',
            'area_activity' => 'sometimes|exists:areas,id',
            'activity'      => 'nullable|string|max:255',
            'issue'         => 'sometimes|string',
            'photo'         => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = ['is_content_edited' => true];

        if (isset($validated['type_activity'])) $data['activity_id'] = $validated['type_activity'];
        if (array_key_exists('sub_activity_id', $validated)) $data['sub_activity_id'] = $validated['sub_activity_id'];
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
            if (!$report->area || !$report->area->pics()->where('users.id', $user->id)->exists()) {
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
            'status'        => 'closed',
            'closed_at'     => now(),
            'closed_by'     => $user->id,
        ]);

        return back()->with('success', 'Laporan berhasil diselesaikan');
    }

    public function destroy(Report $report)
    {
        $user = Auth::user();

        if ($report->status !== 'open') {
            return back()->with('error', 'Hanya ticket open yang dapat dihapus');
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
        } elseif ($user->can('reports.solve.own.area') && $report->area && $report->area->pics()->where('users.id', $user->id)->exists()) {
        } else {
            abort(403, 'Anda tidak memiliki izin untuk melihat laporan ini');
        }

        return Inertia::render('reports/Show', [
            'report' => $report->load(['author', 'area.pics', 'activityType.parent', 'subActivity']),
        ]);
    }

    public function export(Request $request, string $type)
    {
        $user = Auth::user();
        $query = Report::with(['author', 'area', 'activityType', 'subActivity']);

        if ($user->can('reports.view.all')) {
        } elseif ($user->can('reports.solve.own.area')) {
            $query->whereHas('area.pics', fn ($q) => $q->where('users.id', $user->id));
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
        if ($request->filled('status')) $query->where('status', $request->status);
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
                $report->subActivity?->name ?? $report->activityType?->name ?? '-',
                $report->activity ?? '-',
                $report->issue,
                $report->photo_before ? 'Yes' : 'No',
                $report->photo_after ? 'Yes' : 'No',
                strtoupper($report->status ?? 'OPEN'),
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
        return $pdf->download('Laporan_Ticket_Report_' . date('Y-m-d') . '.pdf');
    }
}
