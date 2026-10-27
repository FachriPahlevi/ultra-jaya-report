<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubActivity;
use App\Models\SubArea;
use App\Models\User;
use App\Services\ReportCapabilities;
use App\Services\ReportPhotoService;
use App\Services\ReportSelectionScope;
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
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportPhotoService $reportPhotos, private readonly ReportSelectionScope $selectionScope) {}

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $managedAreaIds = $user->managedAreas()->pluck('areas.id')->all();
        $supervisedSubAreaIds = $user->supervisedSubAreas()->pluck('sub_areas.id')->all();
        $managedActivityIds = $user->assignedActivities()->pluck('activities.id')->all();
        $supervisedActivityIds = $user->assignedSubActivities()->pluck('sub_activities.id')->all();

        $query = $this->visibleReportsFor($user)
            ->with(['author.roles', 'area.pics', 'subArea', 'activityType', 'subActivity', 'closer.roles']);

        $canUseForm = $user->hasAnyPermission(['reports.create', 'reports.edit.own', 'reports.edit.all']);
        $visibleAreaIds = (clone $query)->pluck('area_id')->unique();
        $visibleActivityIds = (clone $query)->pluck('activity_id')->unique();
        $visibleAuthorIds = (clone $query)->pluck('author_id')->unique();
        $visibleSubAreaIds = (clone $query)->pluck('sub_area_id')->unique();
        $visibleSubActivityIds = (clone $query)->pluck('sub_activity_id')->unique();

        $access = new ReportCapabilities($user);
        $reports = $query->latest()->get()->map(function ($report) use ($access) {
            return [
                'id' => $report->id,
                'author_id' => $report->author_id,
                'area_id' => $report->area_id,
                'sub_area_id' => $report->sub_area_id,
                'activity_id' => $report->activity_id,
                'sub_activity_id' => $report->sub_activity_id,
                'category_snapshot' => $report->category_snapshot,
                'activity' => $report->activity,
                'issue' => $report->issue,
                'status' => $report->status,
                'photo_before' => $report->photo_before,
                'photo_after' => $report->photo_after,
                'close_comment' => $report->close_comment,
                'closed_at' => $report->closed_at,
                'created_at' => $report->created_at,
                'updated_at' => $report->updated_at,
                'can' => $access->actions($report),
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
                ] : null,
                'sub_activity' => $report->subActivity ? [
                    'id' => $report->subActivity->id,
                    'name' => $report->subActivity->name,
                    'description' => $report->subActivity->description,
                    'category' => $report->category_snapshot,
                ] : null,
                'closer' => $report->closer ? [
                    'id' => $report->closer->id,
                    'name' => $report->closer->name,
                    'role' => $report->closer->roles->first()?->name,
                ] : null,
            ];
        });

        return Inertia::render('reports/Index', [
            'initialReportId' => $request->integer('selected_report') ?: null,
            'reports' => $reports,
            'areas' => Area::with(['managers:id,name', 'subAreas' => fn ($query) => $query->where('is_active', true)->when(! $canUseForm, fn ($subAreas) => $subAreas->whereIn('id', $visibleSubAreaIds))])
                ->when(! $canUseForm, fn ($query) => $query->whereIn('id', $visibleAreaIds))
                ->where('is_active', true)->select('id', 'area')->get()->map(function (Area $area) use ($managedAreaIds, $supervisedSubAreaIds) {
                    return [
                        'id' => $area->id,
                        'area' => $area->area,
                        'is_in_review_scope' => in_array($area->id, $managedAreaIds, true),
                        'managers' => $area->managers->map(fn (User $manager) => ['id' => $manager->id, 'name' => $manager->name])->values(),
                        'is_in_current_user_scope' => in_array($area->id, $managedAreaIds, true)
                            || $area->subAreas->contains(fn ($subArea) => in_array($subArea->id, $supervisedSubAreaIds, true)),
                        'sub_areas' => $area->subAreas->map(fn ($subArea) => [
                            'id' => $subArea->id,
                            'name' => $subArea->name,
                            'is_in_current_user_scope' => in_array($subArea->id, $supervisedSubAreaIds, true),
                        ])->values(),
                    ];
                }),
            'activities' => Activity::with([
                'children' => fn ($query) => $query->select('id', 'name', 'description', 'activity_id', 'category')->when(! $canUseForm, fn ($children) => $children->whereIn('id', $visibleSubActivityIds)),
            ])
                ->where('is_active', true)
                ->when(! $canUseForm, fn ($query) => $query->whereIn('id', $visibleActivityIds))
                ->orderBy('name')
                ->get()
                ->map(function (Activity $activity) use ($managedActivityIds, $supervisedActivityIds) {
                    return [
                        'id' => $activity->id,
                        'name' => $activity->name,
                        'description' => $activity->description,
                        'is_active' => $activity->is_active,
                        'is_in_current_user_scope' => in_array($activity->id, $managedActivityIds, true),
                        'sub_activities' => $activity->children->map(fn ($child) => [
                            'id' => $child->id,
                            'name' => $child->name,
                            'description' => $child->description,
                            'category' => $child->category,
                            'activity_id' => $child->activity_id,
                            'is_active' => $activity->is_active,
                            'is_in_current_user_scope' => in_array($child->id, $supervisedActivityIds, true),
                        ])->values(),
                    ];
                }),
            'users' => $user->hasAnyPermission(['reports.view.all', 'reports.solve.all', 'reports.edit.all', 'reports.delete.all']) ? User::whereIn('id', $visibleAuthorIds)->select('id', 'name')->orderBy('name')->get() : collect(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (! $user->can('reports.create')) {
            throw new BusinessException('You do not have permission to create reports.', 403);
        }

        $validated = $request->validate($this->storeRules());

        $this->validateSubArea((int) $validated['sub_area_id'], (int) $validated['area_activity']);

        if (! empty($validated['sub_activity_id'])) {
            $subActivityBelongsToParent = SubActivity::whereKey($validated['sub_activity_id'])
                ->where('activity_id', $validated['type_activity'])
                ->exists();

            if (! $subActivityBelongsToParent) {
                throw ValidationException::withMessages([
                    'sub_activity_id' => 'The sub-activity does not belong to the selected activity.',
                ]);
            }
        }

        $this->selectionScope->validate($user, (int) $validated['area_activity'], (int) $validated['sub_area_id'], (int) $validated['type_activity'], (int) $validated['sub_activity_id']);

        $report = Report::create([
            'author_id' => $user->id,
            'activity_id' => $validated['type_activity'],
            'sub_activity_id' => $validated['sub_activity_id'] ?? null,
            'area_id' => $validated['area_activity'],
            'sub_area_id' => $validated['sub_area_id'],
            'activity' => $validated['activity'] ?? null,
            'issue' => $validated['issue'],
            'status' => 'open',
            'photo_before' => null,
        ]);

        if ($request->hasFile('photo')) {
            $report->update(['photo_before' => $this->reportPhotos->store($request->file('photo'), $report, 'before')]);
        }

        return back()->with('success', 'Report created successfully.');
    }

    public function update(Request $request, Report $report): RedirectResponse
    {
        Gate::authorize('update', $report);
        $this->ensureReportIsOpen($report, 'edited');

        $validated = $request->validate($this->updateRules());

        if (isset($validated['sub_area_id']) || isset($validated['area_activity'])) {
            $this->validateSubArea((int) ($validated['sub_area_id'] ?? $report->sub_area_id), (int) ($validated['area_activity'] ?? $report->area_id));
        }

        $selectedParentId = $validated['type_activity'] ?? $report->activity_id;
        $selectedSubActivityId = $validated['sub_activity_id'] ?? $report->sub_activity_id;
        if ($selectedSubActivityId) {
            $subActivityBelongsToParent = SubActivity::whereKey($selectedSubActivityId)
                ->where('activity_id', $selectedParentId)
                ->exists();

            if (! $subActivityBelongsToParent) {
                throw ValidationException::withMessages([
                    'sub_activity_id' => 'The sub-activity does not belong to the selected activity.',
                ]);
            }
        }

        $selectionChanged = (int) ($validated['area_activity'] ?? $report->area_id) !== $report->area_id
            || (int) ($validated['sub_area_id'] ?? $report->sub_area_id) !== $report->sub_area_id
            || (int) $selectedParentId !== $report->activity_id || (int) $selectedSubActivityId !== $report->sub_activity_id;
        if ($selectionChanged) {
            $this->selectionScope->validate(Auth::user(), (int) ($validated['area_activity'] ?? $report->area_id), (int) ($validated['sub_area_id'] ?? $report->sub_area_id), (int) $selectedParentId, (int) $selectedSubActivityId);
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
            $data['photo_before'] = $this->reportPhotos->replace($request->file('photo'), $report, 'before', $report->photo_before);
        }

        $report->update($data);

        return back()->with('success', 'Report updated successfully.');
    }

    public function close(Request $request, Report $report): RedirectResponse
    {
        $user = Auth::user();

        Gate::authorize('close', $report);
        $this->ensureReportIsOpen($report, 'closed');

        $validated = $request->validate([
            'close_comment' => ['required', 'string'],
            'photo_after' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:'.config('reports.photos.max_upload_kb', 3072)],
        ]);

        $data = [
            'close_comment' => $validated['close_comment'],
            'status' => Report::STATUS_CLOSED,
            'closed_at' => now(),
            'closed_by' => $user->id,
        ];

        if ($request->hasFile('photo_after')) {
            $data['photo_after'] = $this->reportPhotos->replace($request->file('photo_after'), $report, 'after', $report->photo_after);
        }

        $report->update($data);

        return back()->with('success', 'Ticket closed successfully.');
    }

    public function destroy(Report $report): RedirectResponse
    {
        Gate::authorize('delete', $report);

        $this->reportPhotos->delete($report->photo_before);
        $this->reportPhotos->delete($report->photo_after);

        $report->delete();

        return back()->with('success', 'Report deleted successfully.');
    }

    public function show(Report $report): RedirectResponse
    {
        Gate::authorize('view', $report);

        return redirect()->route('reports.index', ['selected_report' => $report->id]);
    }

    public function export(Request $request, string $type): \Symfony\Component\HttpFoundation\Response
    {
        $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'area_ids' => ['sometimes', 'array'], 'area_ids.*' => ['integer'],
            'activity_ids' => ['sometimes', 'array'], 'activity_ids.*' => ['integer'],
            'author_ids' => ['sometimes', 'array'], 'author_ids.*' => ['integer'],
            'status' => ['nullable', Rule::in(['open', 'closed', 'report'])],
            'my_reports_only' => ['nullable', Rule::in(['true', 'false', '1', '0'])],
        ]);
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
        if ($request->status === 'report') {
            $query->where('category_snapshot', 'REPORT');
        } elseif ($request->filled('status')) {
            $query->where('status', $request->status)->where('category_snapshot', 'ISSUE');
        }
        if ($request->filled('author_ids')) {
            $query->whereIn('author_id', $request->author_ids);
        }

        $reports = $query->latest()->get();

        return $type === 'excel' ? $this->exportExcel($reports) : $this->exportPdf($reports);
    }

    private function exportExcel($reports): BinaryFileResponse
    {
        $sheet = (new Spreadsheet)->getActiveSheet();
        $sheet->fromArray(['No', 'Reporter', 'Area', 'Activity', 'Finding', 'Before Photo', 'After Photo', 'Status', 'Created At'], null, 'A1');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true);
        $sheet->getColumnDimension('E')->setWidth(42);
        $sheet->getColumnDimension('F')->setWidth(29);
        $sheet->getColumnDimension('G')->setWidth(29);
        $sheet->getStyle('E:I')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('E:E')->getAlignment()->setWrapText(true);
        foreach ($reports as $index => $report) {
            $row = $index + 2;
            $displayStatus = $report->category_snapshot === 'REPORT' ? 'REPORT' : strtoupper($report->status);
            $sheet->fromArray([$index + 1, $report->author?->name, $report->area?->area, $report->subActivity?->name ?? $report->activityType?->name, $report->issue, '', '', $displayStatus, $report->created_at?->format('d-m-Y H:i')], null, "A{$row}");
            $sheet->getRowDimension($row)->setRowHeight(120);
            foreach (['photo_before' => 'F', 'photo_after' => 'G'] as $field => $column) {
                $path = $report->{$field} && Storage::disk('public')->exists($report->{$field})
                    ? Storage::disk('public')->path($report->{$field})
                    : null;
                if ($path) {
                    $drawing = new Drawing;
                    $drawing->setPath($path);
                    $drawing->setWidthAndHeight(184, 144);
                    $drawing->setCoordinates("{$column}{$row}");
                    $drawing->setOffsetX(8);
                    $drawing->setOffsetY(8);
                    $drawing->setWorksheet($sheet);
                }
            }
        }
        $file = storage_path('app/reports-'.uniqid().'.xlsx');
        (new Xlsx($sheet->getParent()))->save($file);

        return response()->download($file, 'reports-'.now()->format('Y-m-d_H-i-s').'.xlsx')->deleteFileAfterSend();
    }

    private function exportCsv($reports): StreamedResponse
    {
        return response()->streamDownload(function () use ($reports): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['No', 'ID', 'Reporter', 'Area', 'Activity Type', 'Activity Notes', 'Finding', 'Before Photo', 'After Photo', 'Status', 'Created At']);

            foreach ($reports as $index => $report) {
                fputcsv($handle, [
                    $index + 1,
                    $report->id,
                    $report->author?->name ?? '-',
                    $report->area?->area ?? '-',
                    $report->subActivity?->name ?? $report->activityType?->name ?? '-',
                    $report->activity ?? '-',
                    $report->issue,
                    $report->photo_before ? 'Yes' : 'No',
                    $report->photo_after ? 'Yes' : 'No',
                    $report->category_snapshot === 'REPORT' ? 'REPORT' : strtoupper($report->status ?? Report::STATUS_OPEN),
                    $report->created_at?->format('d-m-Y H:i:s'),
                ]);
            }

            fclose($handle);
        }, 'reports-'.now()->format('Y-m-d_H-i-s').'.csv');
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

        return $pdf->download('Reports_'.date('Y-m-d').'.pdf');
    }

    private function storeRules(): array
    {
        return [
            'type_activity' => ['required', $this->activeParentActivityRule()],
            'sub_activity_id' => ['required', $this->activeSubActivityRule()],
            'area_activity' => ['required', $this->activeAreaRule()],
            'sub_area_id' => ['required', $this->activeSubAreaRule()],
            'activity' => ['nullable', 'string', 'max:255'],
            'issue' => ['required', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:'.config('reports.photos.max_upload_kb', 3072)],
        ];
    }

    private function updateRules(): array
    {
        return [
            'type_activity' => ['sometimes', $this->activeParentActivityRule()],
            'sub_activity_id' => ['sometimes', 'required', $this->activeSubActivityRule()],
            'area_activity' => ['sometimes', $this->activeAreaRule()],
            'sub_area_id' => ['sometimes', $this->activeSubAreaRule()],
            'activity' => ['nullable', 'string', 'max:255'],
            'issue' => ['sometimes', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:'.config('reports.photos.max_upload_kb', 3072)],
        ];
    }

    private function activeParentActivityRule()
    {
        return Rule::exists('activities', 'id')
            ->whereNull('deleted_at')
            ->where('is_active', true);
    }

    private function activeSubActivityRule()
    {
        return Rule::exists('sub_activities', 'id')
            ->whereNull('deleted_at')
            ->where(fn ($query) => $query->whereIn('activity_id', Activity::where('is_active', true)->select('id')));
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
        if (! SubArea::query()->whereKey($subAreaId)->where('area_id', $areaId)->exists()) {
            throw ValidationException::withMessages(['sub_area_id' => 'The sub-area must belong to the selected area.']);
        }
    }

    private function visibleReportsFor(User $user): Builder
    {
        return Report::query()->visibleTo($user);
    }

    private function ensureReportIsOpen(Report $report, string $action): void
    {
        if (! $report->isOpen()) {
            throw new BusinessException("Only open reports can be {$action}.");
        }
    }
}
