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

        // Filter my reports only (priority)
        if ($request->boolean('my_reports_only')) {
            $query->where('author_id', $user->id);

            if ($user->can('reports.solve.own.area') && ! $user->can('reports.view.all')) {
                $query->whereHas('area', function ($q2) use ($user) {
                    $q2->where('pic_user_id', $user->id);
                });
            }
        } else {
            if ($user->can('reports.view.all')) {
                // SUPER_ADMIN, ADMIN, MANAGER bisa lihat semua report
            } elseif ($user->can('reports.solve.own.area')) {
                $query->whereHas('area', function ($q2) use ($user) {
                    $q2->where('pic_user_id', $user->id);
                });
            } else {
                $query->where('author_id', $user->id);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('issue', 'like', "%{$search}%")
                    ->orWhere('activity', 'like', "%{$search}%")
                    ->orWhereHas('author', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('activityType', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'pending') {
                $query->where('status', 'pending');
            } elseif ($request->status === 'rejected') {
                $query->where('status', 'rejected');
            } elseif ($request->status === 'solved') {
                $query->where('status', 'solved');
            }
        }

        if ($request->filled('type')) {
            $query->where('activity_id', $request->type);
        }

        if ($request->filled('area')) {
            $query->where('area_id', $request->area);
        }

        if ($request->filled('role')) {
            $query->whereHas('author', function ($q) use ($request) {
                $q->whereHas('roles', function ($q2) use ($request) {
                    $q2->where('name', $request->role);
                });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $areaReports = $query->latest()->paginate(10)->withQueryString();

        $areas = Area::with('pic')->select('id', 'area', 'pic_user_id')->get();
        $activities = Activity::select('id', 'description')->get();
        $users = \App\Models\User::select('id', 'name')->get();

        return Inertia::render('reports/Index', [
            'areaReports' => $areaReports,
            'areas' => $areas,
            'activities' => $activities,
            'users' => $users,
            'filters' => $request->only(['search', 'status', 'type', 'area', 'role', 'date_from', 'date_to', 'my_reports_only']),
        ]);
    }
    public function store(Request $request)
    {
        if (!Auth::user()->can('reports.create')) {
            return back()->with('error', 'Anda tidak memiliki izin untuk membuat laporan');
        }

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
            'status' => 'pending',
            'finished_date' => null,
            'is_content_edited' => false,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil dibuat');
    }

    public function solve(Request $request, Report $report)
    {
        $user = Auth::user();

        // Cek permission solve
        if ($user->can('reports.solve.all')) {
            // SUPER_ADMIN, ADMIN, MANAGER bisa solve semua
        } elseif ($user->can('reports.solve.own.area')) {
            // SUPERVISOR: cek apakah report berada di area yang dia menjadi PIC
            // Gunakan pic_user_id, bukan supervisor_id
            if ($report->area->pic_user_id !== $user->id) {
                return back()->with('error', 'Anda tidak memiliki izin untuk menyelesaikan laporan di area ini');
            }
        } else {
            return back()->with('error', 'Anda tidak memiliki izin untuk menyelesaikan laporan');
        }

        if ($report->status === 'solved') {
            return back()->with('error', 'Laporan ini sudah selesai');
        }

        if ($report->status === 'rejected') {
            return back()->with('error', 'Laporan ini harus dikembalikan ke penulis terlebih dahulu sebelum diselesaikan');
        }

        $validated = $request->validate([
            'photo_after' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $photoPath = $request->file('photo_after')->store('reports/photos-after', 'public');

        $report->update([
            'photo_after' => $photoPath,
            'finished_date' => now(),
            'status' => 'solved',
            'solved_by' => $user->id,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil diselesaikan');
    }

    public function update(Request $request, Report $report)
    {
        $user = Auth::user();

        // Cek permission edit
        if ($user->can('reports.edit.all')) {
            // Bisa edit semua
        } elseif ($user->can('reports.edit.own') && $report->author_id === $user->id) {
            // Bisa edit punya sendiri
        } else {
            return back()->with('error', 'Anda tidak memiliki izin untuk mengedit laporan ini');
        }

        $validated = $request->validate([
            'type_activity' => 'sometimes|exists:activities,id',
            'area_activity' => 'sometimes|exists:areas,id',
            'activity' => 'nullable|string|max:255',
            'issue' => 'sometimes|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'correction_comment' => 'nullable|string',
        ]);

        $updateData = ['is_content_edited' => true];

        if ($report->status === 'rejected') {
            $updateData['status'] = 'pending';
            $updateData['rejected_comment'] = null;
            $updateData['rejected_by'] = null;
            $updateData['rejected_at'] = null;
            $updateData['correction_comment'] = $validated['correction_comment'] ?? null;
        }

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

        if (isset($validated['correction_comment'])) {
            $updateData['correction_comment'] = $validated['correction_comment'];
        }

        $report->update($updateData);

        return redirect()->back()->with('success', 'Laporan berhasil diupdate');
    }

    public function reject(Request $request, Report $report)
    {
        $user = Auth::user();

        if ($user->can('reports.solve.all')) {
            // SUPER_ADMIN, ADMIN, MANAGER bisa reject semua
        } elseif ($user->can('reports.solve.own.area')) {
            if ($report->area->pic_user_id !== $user->id) {
                return back()->with('error', 'Anda tidak memiliki izin untuk menolak laporan di area ini');
            }
        } else {
            return back()->with('error', 'Anda tidak memiliki izin untuk menolak laporan ini');
        }

        if ($report->status === 'solved') {
            return back()->with('error', 'Laporan yang sudah selesai tidak dapat ditolak');
        }

        $validated = $request->validate([
            'rejected_comment' => 'required|string',
        ]);

        $report->update([
            'status' => 'rejected',
            'rejected_comment' => $validated['rejected_comment'],
            'rejected_by' => $user->id,
            'rejected_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil ditolak dan dikembalikan ke penulis');
    }

    public function destroy(Report $report)
    {
        if (!Auth::user()->can('reports.delete')) {
            return back()->with('error', 'Anda tidak memiliki izin untuk menghapus laporan');
        }

        if ($report->status !== 'pending') {
            return back()->with('error', 'Laporan hanya dapat dihapus ketika status masih pending');
        }

        $report->delete();

        return redirect()->back()->with('success', 'Laporan berhasil dihapus');
    }

    public function show(Report $report)
    {
        $user = Auth::user();

        if ($user->can('reports.view.all')) {
            // allowed
        } elseif ($user->can('reports.view.own') && $report->author_id === $user->id) {
            // allowed
        } elseif ($user->can('reports.solve.own.area') && $report->area->pic_user_id === $user->id) {
            // allowed
        } else {
            abort(403, 'Anda tidak memiliki izin untuk melihat laporan ini');
        }

        return Inertia::render('reports/Show', [
            'report' => $report->load(['author', 'area', 'activityType']),
        ]);
    }

    public function export(Request $request, $type)
    {
        $user = Auth::user();
        $query = Report::with(['author', 'area', 'activityType']);

        if ($request->boolean('my_reports_only')) {
            $query->where('author_id', $user->id);

            if ($user->can('reports.solve.own.area') && ! $user->can('reports.view.all')) {
                $query->whereHas('area', function ($q2) use ($user) {
                    $q2->where('pic_user_id', $user->id);
                });
            }
        } else {
            if ($user->can('reports.view.all')) {
                // Bisa export semua
            } elseif ($user->can('reports.solve.own.area')) {
                $query->whereHas('area', function ($q2) use ($user) {
                    $q2->where('pic_user_id', $user->id);
                });
            } else {
                $query->where('author_id', $user->id);
            }
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->filled('area_ids')) {
            $query->whereIn('area_id', $request->area_ids);
        }
        if ($request->filled('activity_ids')) {
            $query->whereIn('activity_id', $request->activity_ids);
        }
        if ($request->filled('status')) {
            if ($request->status === 'pending') {
                $query->where('status', 'pending');
            } elseif ($request->status === 'rejected') {
                $query->where('status', 'rejected');
            } elseif ($request->status === 'solved') {
                $query->where('status', 'solved');
            }
        }
        if ($request->filled('author_ids')) {
            $query->whereIn('author_id', $request->author_ids);
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

        fputcsv($handle, ['No', 'ID', 'Author', 'Area', 'Type Activity', 'User Activity', 'Issue', 'Photo Before', 'Photo After', 'Status', 'Created At', 'Updated At'], ',', '"', '\\');

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
                $report->status ? ucfirst($report->status) : ($report->finished_date ? 'Solved' : 'Pending'),
                $report->created_at,
                $report->updated_at,
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
            'defaultFont' => 'Times New Roman',
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => false
        ]);
        return $pdf->download('Laporan_Issue_Report_' . date('Y-m-d') . '.pdf');
    }
}
