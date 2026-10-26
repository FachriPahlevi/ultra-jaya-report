<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class ReportController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $managedAreaIds = $user->managedAreas()->pluck('areas.id')->all();
        $supervisedSubAreaIds = $user->supervisedSubAreas()->pluck('sub_areas.id')->all();

        $query = $this->visibleReportsFor($user)
            ->with(['author.roles', 'area', 'subArea', 'activityType.parent', 'subActivity', 'closer.roles']);

        $reports = $query->latest()->get()->map(function ($report) {
            return [
                'id' => $report->id,
                'author_id' => $report->author_id,
                'area_id' => $report->area_id,
                'sub_area_id' => $report->sub_area_id,
                'activity_id' => $report->activity_id,
                'sub_activity_id' => $report->sub_activity_id,
                'activity' => $report->activity,
                'issue' => $report->issue,
                'status' => $report->status,
                'photo_before' => $report->photo_before,
                'photo_after' => $report->photo_after,
                'close_comment' => $report->close_comment,
                'closed_at' => $report->closed_at,
                'created_at' => $report->created_at,
                'updated_at' => $report->updated_at,
                'can' => [
                    'update' => Gate::allows('update', $report),
                    'delete' => Gate::allows('delete', $report),
                    'close' => Gate::allows('close', $report),
                ],
                'author' => $report->author ? [
                    'id' => $report->author->id,
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
                'sub_area' => $report->subArea ? [
                    'id' => $report->subArea->id,
                    'name' => $report->subArea->name,
                ] : null,
                'activity_type' => $report->activityType ? [
                    'id' => $report->activityType->id,
                    'name' => $report->activityType->name,
                    'description' => $report->activityType->description,
                    'parent_id' => $report->activityType->parent_id,
                    'parent_name' => $report->activityType->parent?->name,
                ] : null,
                'sub_activity' => $report->subActivity ? [
                    'id' => $report->subActivity->id,
                    'name' => $report->subActivity->name,
                    'description' => $report->subActivity->description,
                ] : null,
                'closer' => $report->closer ? [
                    'id' => $report->closer->id,
                    'name' => $report->closer->name,
                    'role' => $report->closer->roles->first()?->name,
                ] : null,
            ];
        });

        return Inertia::render('reports/Index', [
            'reports' => $reports,
            'areas' => Area::with(['managers:id,name', 'subAreas' => fn ($query) => $query->where('is_active', true)])->where('is_active', true)->select('id', 'area')->get()->map(function (Area $area) use ($managedAreaIds, $supervisedSubAreaIds) {
                return [
                    'id' => $area->id,
                    'area' => $area->area,
                    'managers' => $area->managers->map(fn (User $manager) => ['id' => $manager->id, 'name' => $manager->name])->values(),
                    'is_in_current_user_scope' => in_array($area->id, $managedAreaIds, true)
                        || $area->subAreas->contains(fn ($subArea) => in_array($subArea->id, $supervisedSubAreaIds, true)),
                    'sub_areas' => $area->subAreas->map(fn ($subArea) => ['id' => $subArea->id, 'name' => $subArea->name])->values(),
                ];
            }),
            'activities' => Activity::with([
                'children' => fn ($query) => $query
                    ->where('is_active', true)
                    ->select('id', 'name', 'description', 'parent_id'),
            ])
                ->where('is_active', true)
                ->whereNull('parent_id')
                ->orderBy('name')
                ->get()
                ->map(function (Activity $activity) {
                    return [
                        'id' => $activity->id,
                        'name' => $activity->name,
                        'description' => $activity->description,
                        'is_active' => $activity->is_active,
                        'sub_activities' => $activity->children->map(fn ($child) => [
                            'id' => $child->id,
                            'name' => $child->name,
                            'description' => $child->description,
                            'parent_id' => $child->parent_id,
                            'is_active' => $child->is_active,
                        ])->values(),
                    ];
                }),
            'users' => $user->can('reports.view.all') ? User::select('id', 'name')->orderBy('name')->get() : collect(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (! $user->can('reports.create')) {
            throw new BusinessException('Anda tidak memiliki izin untuk membuat laporan', 403);
        }

        $validated = $request->validate($this->storeRules());

        $this->validateSubArea((int) $validated['sub_area_id'], (int) $validated['area_activity']);

        if (! empty($validated['sub_activity_id'])) {
            $subActivityBelongsToParent = Activity::whereKey($validated['sub_activity_id'])
                ->where('parent_id', $validated['type_activity'])
                ->exists();

            if (! $subActivityBelongsToParent) {
                throw ValidationException::withMessages([
                    'sub_activity_id' => 'Subaktivitas tidak sesuai dengan aktivitas utama yang dipilih.',
                ]);
            }
        }

        Report::create([
            'author_id' => $user->id,
            'activity_id' => $validated['type_activity'],
            'sub_activity_id' => $validated['sub_activity_id'] ?? null,
            'area_id' => $validated['area_activity'],
            'sub_area_id' => $validated['sub_area_id'],
            'activity' => $validated['activity'] ?? null,
            'issue' => $validated['issue'],
            'status' => 'open',
            'photo_before' => $request->hasFile('photo')
                ? $request->file('photo')->store('reports/photos', 'public')
                : null,
        ]);

        return back()->with('success', 'Laporan berhasil dibuat');
    }

    public function update(Request $request, Report $report): RedirectResponse
    {
        Gate::authorize('update', $report);
        $this->ensureReportIsOpen($report, 'diubah');

        $validated = $request->validate($this->updateRules());

        if (isset($validated['sub_area_id']) || isset($validated['area_activity'])) {
            $this->validateSubArea((int) ($validated['sub_area_id'] ?? $report->sub_area_id), (int) ($validated['area_activity'] ?? $report->area_id));
        }

        $selectedParentId = $validated['type_activity'] ?? $report->activity_id;
        if (! empty($validated['sub_activity_id'])) {
            $subActivityBelongsToParent = Activity::whereKey($validated['sub_activity_id'])
                ->where('parent_id', $selectedParentId)
                ->exists();

            if (! $subActivityBelongsToParent) {
                throw ValidationException::withMessages([
                    'sub_activity_id' => 'Subaktivitas tidak sesuai dengan aktivitas utama yang dipilih.',
                ]);
            }
        }

        $data = ['is_content_edited' => true];

        if (isset($validated['type_activity'])) {
            $data['activity_id'] = $validated['type_activity'];
        }
        if (array_key_exists('sub_activity_id', $validated)) {
            $data['sub_activity_id'] = $validated['sub_activity_id'];
        }
        if (isset($validated['area_activity'])) {
            $data['area_id'] = $validated['area_activity'];
        }
        if (isset($validated['sub_area_id'])) {
            $data['sub_area_id'] = $validated['sub_area_id'];
        }
        if (array_key_exists('activity', $validated)) {
            $data['activity'] = $validated['activity'];
        }
        if (isset($validated['issue'])) {
            $data['issue'] = $validated['issue'];
        }

        if ($request->hasFile('photo')) {
            if ($report->photo_before) {
                Storage::disk('public')->delete($report->photo_before);
            }
            $data['photo_before'] = $request->file('photo')->store('reports/photos', 'public');
        }

        $report->update($data);

        return back()->with('success', 'Laporan berhasil diupdate');
    }

    public function close(Request $request, Report $report): RedirectResponse
    {
        $user = Auth::user();

        Gate::authorize('close', $report);
        $this->ensureReportIsOpen($report, 'ditutup');

        $validated = $request->validate([
            'close_comment' => ['required', 'string'],
            'photo_after' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:3072'],
        ]);

        $data = [
            'close_comment' => $validated['close_comment'],
            'status' => Report::STATUS_CLOSED,
            'closed_at' => now(),
            'closed_by' => $user->id,
        ];

        if ($request->hasFile('photo_after')) {
            $data['photo_after'] = $request->file('photo_after')->store('reports/photos-after', 'public');
        }

        $report->update($data);

        return back()->with('success', 'Tiket berhasil ditutup');
    }

    public function destroy(Report $report): RedirectResponse
    {
        Gate::authorize('delete', $report);

        if ($report->photo_before) {
            Storage::disk('public')->delete($report->photo_before);
        }
        if ($report->photo_after) {
            Storage::disk('public')->delete($report->photo_after);
        }

        $report->delete();

        return back()->with('success', 'Laporan berhasil dihapus');
    }

    public function show(Report $report): Response
    {
        Gate::authorize('view', $report);

        return Inertia::render('reports/Show', [
            'report' => $report->load(['author', 'area.managers', 'subArea', 'activityType.parent', 'subActivity', 'closer']),
        ]);
    }

    public function export(Request $request, string $type): \Symfony\Component\HttpFoundation\Response
    {
        $user = Auth::user();
        $query = $this->visibleReportsFor($user)
            ->with(['author', 'area', 'activityType', 'subActivity']);

        if ($request->boolean('my_reports_only')) {
            $query->where('author_id', $user->id);
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
            $query->where('status', $request->status);
        }
        if ($request->filled('author_ids')) {
            $query->whereIn('author_id', $request->author_ids);
        }

        $reports = $query->latest()->get();

        return $type === 'excel' ? $this->exportExcel($reports) : $this->exportPdf($reports);
    }

    private function exportExcel($reports): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $sheet = (new Spreadsheet())->getActiveSheet();
        $sheet->fromArray(['No', 'Pelapor', 'Area', 'Aktivitas', 'Temuan', 'Foto Sebelum', 'Foto Sesudah', 'Status', 'Dibuat'], null, 'A1');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true);
        $sheet->getColumnDimension('E')->setWidth(36);
        $sheet->getColumnDimension('F')->setWidth(18);
        $sheet->getColumnDimension('G')->setWidth(18);
        foreach ($reports as $index => $report) {
            $row = $index + 2;
            $sheet->fromArray([$index + 1, $report->author?->name, $report->area?->area, $report->subActivity?->name ?? $report->activityType?->name, $report->issue, '', '', strtoupper($report->status), $report->created_at?->format('d-m-Y H:i')], null, "A{$row}");
            $sheet->getRowDimension($row)->setRowHeight(70);
            foreach (['photo_before' => 'F', 'photo_after' => 'G'] as $field => $column) {
                $path = $report->{$field} ? storage_path('app/public/'.$report->{$field}) : null;
                if ($path && file_exists($path)) {
                    $drawing = new Drawing(); $drawing->setPath($path); $drawing->setHeight(65); $drawing->setCoordinates("{$column}{$row}"); $drawing->setWorksheet($sheet);
                }
            }
        }
        $file = storage_path('app/reports-'.uniqid().'.xlsx');
        (new Xlsx($sheet->getParent()))->save($file);
        return response()->download($file, 'laporan-'.now()->format('Y-m-d_H-i-s').'.xlsx')->deleteFileAfterSend();
    }

    private function exportCsv($reports): StreamedResponse
    {
        return response()->streamDownload(function () use ($reports): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['No', 'ID', 'Author', 'Area', 'Jenis Aktivitas', 'Aktivitas', 'Temuan', 'Foto Sebelum', 'Foto Sesudah', 'Status', 'Dibuat Pada']);

            foreach ($reports as $index => $report) {
                fputcsv($handle, [
                    $index + 1,
                    $report->id,
                    $report->author?->name ?? '-',
                    $report->area?->area ?? '-',
                    $report->subActivity?->name ?? $report->activityType?->name ?? '-',
                    $report->activity ?? '-',
                    $report->issue,
                    $report->photo_before ? 'Ada' : 'Tidak ada',
                    $report->photo_after ? 'Ada' : 'Tidak ada',
                    strtoupper($report->status ?? Report::STATUS_OPEN),
                    $report->created_at?->format('d-m-Y H:i:s'),
                ]);
            }

            fclose($handle);
        }, 'laporan-'.now()->format('Y-m-d_H-i-s').'.csv');
    }

    private function exportPdf($reports): \Illuminate\Http\Response
    {
        $pdf = Pdf::loadView('exports.reports', ['reports' => $reports]);
        $pdf->setPaper('a4', 'landscape');
        $pdf->setOptions([
            'defaultFont' => 'Times New Roman',
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => false,
        ]);

        return $pdf->download('Laporan_Ticket_Report_'.date('Y-m-d').'.pdf');
    }

    private function storeRules(): array
    {
        return [
            'type_activity' => [$this->activeParentActivityRule()],
            'sub_activity_id' => ['nullable', $this->activeSubActivityRule()],
            'area_activity' => ['required', $this->activeAreaRule()],
            'sub_area_id' => ['required', $this->activeSubAreaRule()],
            'activity' => ['nullable', 'string', 'max:255'],
            'issue' => ['required', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:3072'],
        ];
    }

    private function updateRules(): array
    {
        return [
            'type_activity' => ['sometimes', $this->activeParentActivityRule()],
            'sub_activity_id' => ['nullable', $this->activeSubActivityRule()],
            'area_activity' => ['sometimes', $this->activeAreaRule()],
            'sub_area_id' => ['sometimes', $this->activeSubAreaRule()],
            'activity' => ['nullable', 'string', 'max:255'],
            'issue' => ['sometimes', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:3072'],
        ];
    }

    private function activeParentActivityRule()
    {
        return Rule::exists('activities', 'id')
            ->whereNull('deleted_at')
            ->whereNull('parent_id')
            ->where('is_active', true);
    }

    private function activeSubActivityRule()
    {
        return Rule::exists('activities', 'id')
            ->whereNull('deleted_at')
            ->whereNotNull('parent_id')
            ->where('is_active', true);
    }

    private function activeAreaRule()
    {
        return Rule::exists('areas', 'id')
            ->where(fn ($query) => $query->where('is_active', true)->whereNull('deleted_at'));
    }

    private function activeSubAreaRule()
    {
        return Rule::exists('sub_areas', 'id')->where(fn ($query) => $query->where('is_active', true)->whereNull('deleted_at'));
    }

    private function validateSubArea(int $subAreaId, int $areaId): void
    {
        if (! \App\Models\SubArea::query()->whereKey($subAreaId)->where('area_id', $areaId)->exists()) {
            throw ValidationException::withMessages(['sub_area_id' => 'Sub-area harus berada pada area yang dipilih.']);
        }
    }

    private function visibleReportsFor(User $user): Builder
    {
        $query = Report::query();

        if ($user->can('reports.view.all')) {
            return $query;
        }

        if ($user->can('reports.review.area')) {
            return $query->whereHas('area.managers', fn (Builder $areas) => $areas->whereKey($user->id));
        }

        if ($user->can('reports.view.own') && $user->can('reports.solve.own.area')) {
            return $query->where(fn (Builder $visible) => $visible
                ->where('author_id', $user->id)
                ->orWhereHas('subArea.supervisors', fn (Builder $supervisors) => $supervisors->whereKey($user->id)));
        }

        if ($user->can('reports.solve.own.area')) {
            return $query->whereHas('subArea.supervisors', fn (Builder $supervisors) => $supervisors->whereKey($user->id));
        }

        return $query->where('author_id', $user->id);
    }

    private function ensureReportIsOpen(Report $report, string $action): void
    {
        if (! $report->isOpen()) {
            throw new BusinessException("Hanya laporan dengan status terbuka yang dapat {$action}.");
        }
    }
}
