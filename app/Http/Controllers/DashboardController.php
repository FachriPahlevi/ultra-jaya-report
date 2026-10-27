<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Report;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'period' => ['nullable', 'in:today,last_7_days,this_month,last_month,last_90_days,custom,all'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'status' => ['nullable', 'in:open,closed'],
            'area_id' => ['nullable', 'integer'],
        ]);
        $period = $validated['period'] ?? 'this_month';
        [$dateFrom, $dateTo] = $this->resolvePeriod($period, $validated['date_from'] ?? null, $validated['date_to'] ?? null);
        $user = Auth::user();
        $userId = $user->id;
        $query = Report::query()->visibleTo($user);

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $availableAreaIds = (clone $query)->whereNotNull('area_id')->distinct()->pluck('area_id');
        $availableAreas = Area::query()->whereIn('id', $availableAreaIds)->orderBy('area')->get(['id', 'area']);
        $status = $validated['status'] ?? null;
        $areaId = isset($validated['area_id']) && $availableAreaIds->contains((int) $validated['area_id']) ? (int) $validated['area_id'] : null;

        $query->when($status, fn (Builder $builder) => $builder->where('status', $status));
        $query->when($areaId, fn (Builder $builder) => $builder->where('area_id', $areaId));

        $totalReports = (clone $query)->count();
        $reportCount = (clone $query)->where('category_snapshot', 'REPORT')->count();
        $openReports = (clone $query)->where('category_snapshot', 'ISSUE')->where('status', 'open')->count();
        $closedReports = (clone $query)->where('category_snapshot', 'ISSUE')->where('status', 'closed')->count();
        $myReports = Report::where('author_id', $userId)->count();

        $topArea = (clone $query)
            ->select('area_id', DB::raw('count(*) as total'))
            ->with('area')
            ->groupBy('area_id')
            ->orderByDesc('total')
            ->first();
        $topOpenArea = (clone $query)->where('category_snapshot', 'ISSUE')->where('status', 'open')
            ->select('area_id', DB::raw('count(*) as total'))->with('area')->groupBy('area_id')->orderByDesc('total')->first();

        $areaBreakdown = (clone $query)->whereNotNull('area_id')->select('area_id', DB::raw('count(*) as total'))
            ->with('area:id,area')->groupBy('area_id')->orderByDesc('total')->orderBy('area_id')->get()
            ->map(fn ($row) => ['id' => $row->area_id, 'name' => $row->area?->area ?? 'Area tidak tersedia', 'total' => (int) $row->total]);
        $activityBreakdown = (clone $query)->whereNotNull('activity_id')->select('activity_id', DB::raw('count(*) as total'))
            ->selectRaw("SUM(CASE WHEN category_snapshot = 'ISSUE' THEN 1 ELSE 0 END) as issue_total")
            ->selectRaw("SUM(CASE WHEN category_snapshot = 'ISSUE' AND status = 'closed' THEN 1 ELSE 0 END) as issue_closed")
            ->with('activityType:id,name')->groupBy('activity_id')->orderByDesc('issue_total')->orderBy('activity_id')->get()
            ->map(fn ($row) => ['id' => $row->activity_id, 'name' => $row->activityType?->name ?? 'Aktivitas tidak tersedia', 'total' => (int) $row->total, 'issue_total' => (int) $row->issue_total, 'issue_closed' => (int) $row->issue_closed]);
        $subActivityBreakdown = (clone $query)->whereNotNull('sub_activity_id')->select('sub_activity_id', DB::raw('count(*) as total'))
            ->selectRaw("SUM(CASE WHEN category_snapshot = 'ISSUE' THEN 1 ELSE 0 END) as issue_total")
            ->selectRaw("SUM(CASE WHEN category_snapshot = 'ISSUE' AND status = 'closed' THEN 1 ELSE 0 END) as issue_closed")
            ->with('subActivity:id,name,activity_id', 'subActivity.activity:id,name')->groupBy('sub_activity_id')->orderByDesc('total')->orderBy('sub_activity_id')->get()
            ->map(fn ($row) => ['id' => $row->sub_activity_id, 'activity_id' => $row->subActivity?->activity_id, 'name' => $row->subActivity?->name ?? 'Sub-aktivitas tidak tersedia', 'detail' => $row->subActivity?->activity?->name, 'total' => (int) $row->total, 'issue_total' => (int) $row->issue_total, 'issue_closed' => (int) $row->issue_closed]);
        $closerBreakdown = (clone $query)->where('category_snapshot', 'ISSUE')->where('status', 'closed')->whereNotNull('closed_by')
            ->select('closed_by', DB::raw('count(*) as total'))->with('closer:id,name')->groupBy('closed_by')->orderByDesc('total')->orderBy('closed_by')->get()
            ->map(fn ($row) => ['id' => $row->closed_by, 'name' => $row->closer?->name ?? 'Pengguna tidak tersedia', 'total' => (int) $row->total]);

        $trendEnd = ($dateTo ?? now())->copy()->startOfDay();
        $trendStart = $trendEnd->copy()->subDays(29);
        if ($dateFrom && $dateFrom->greaterThan($trendStart)) {
            $trendStart = $dateFrom->copy()->startOfDay();
        }
        $dateExpression = DB::connection()->getDriverName() === 'sqlsrv' ? 'CONVERT(char(10), created_at, 23)' : 'DATE(created_at)';
        $trendCounts = (clone $query)
            ->whereBetween('created_at', [$trendStart, $trendEnd->copy()->endOfDay()])
            ->selectRaw("{$dateExpression} as report_day, COUNT(*) as total")
            ->groupByRaw($dateExpression)
            ->pluck('total', 'report_day');
        $dailyTrend = collect();
        for ($day = $trendStart->copy(); $day->lessThanOrEqualTo($trendEnd); $day->addDay()) {
            $key = $day->toDateString();
            $dailyTrend->push(['date' => $key, 'total' => (int) ($trendCounts[$key] ?? 0)]);
        }

        $recentReports = (clone $query)
            ->with(['author:id,name', 'area:id,area', 'activityType:id,name', 'subActivity:id,name'])
            ->latest()
            ->take(20)
            ->get();

        $canClose = $user->hasAnyPermission(['reports.solve.all', 'reports.solve.own.area']);
        $attentionQuery = (clone $query)->where('category_snapshot', 'ISSUE')->where('status', 'open');
        if ($canClose && ! $user->can('reports.solve.all')) {
            $attentionQuery->whereHas('subArea.supervisors', fn (Builder $users) => $users->whereKey($userId))
                ->whereHas('subActivity.supervisors', fn (Builder $users) => $users->whereKey($userId));
        }
        $attentionTickets = $attentionQuery
            ->with(['area:id,area', 'activityType:id,name', 'subActivity:id,name'])
            ->oldest('created_at')
            ->limit(5)->get();
        $oldestOpenTicket = (clone $query)->with(['area:id,area', 'activityType:id,name', 'subActivity:id,name'])->where('status', 'open')->oldest('created_at')->first();

        $formattedRecentReports = $recentReports->map(function ($report) {
            return [
                'id' => $report->id,
                'issue' => $report->issue,
                'status' => $report->status,
                'category' => $report->category_snapshot,
                'area' => $report->area?->area ?? '-',
                'submitted_by' => $report->author?->name ?? 'Unknown',
                'activity' => $report->subActivity?->name ?? $report->activityType?->name ?? '-',
                'created_at' => $report->created_at,
            ];
        });

        $stats = [
            'total' => $totalReports,
            'reports' => $reportCount,
            'open' => $openReports,
            'closed' => $closedReports,
            'myReports' => $myReports,
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentReports' => $formattedRecentReports,
            'topArea' => $topArea?->area?->area ?? null,
            'topOpenArea' => $availableAreas->count() > 1 && $topOpenArea?->area ? ['name' => $topOpenArea->area->area, 'count' => $topOpenArea->total, 'id' => $topOpenArea->area_id] : null,
            'oldestOpenTicket' => $oldestOpenTicket ? [
                'id' => $oldestOpenTicket->id, 'issue' => $oldestOpenTicket->issue,
                'area' => $oldestOpenTicket->area?->area ?? '-',
                'activity' => $oldestOpenTicket->subActivity?->name ?? $oldestOpenTicket->activityType?->name ?? '-',
                'created_at' => $oldestOpenTicket->created_at,
                'age_in_days' => (int) $oldestOpenTicket->created_at->diffInDays(now()),
            ] : null,
            'attentionCanClose' => $canClose,
            'analytics' => [
                'areas' => $areaBreakdown,
                'activities' => $activityBreakdown,
                'subActivities' => $subActivityBreakdown,
                'closers' => $closerBreakdown,
                'dailyTrend' => $dailyTrend,
            ],
            'attentionTickets' => $attentionTickets->map(fn ($ticket) => [
                'id' => $ticket->id,
                'issue' => $ticket->issue,
                'area' => $ticket->area?->area ?? '-',
                'activity' => $ticket->subActivity?->name ?? $ticket->activityType?->name ?? '-',
                'created_at' => $ticket->created_at,
                'age_in_days' => (int) $ticket->created_at->diffInDays(now()),
            ]),
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom?->toDateString(),
                'date_to' => $dateTo?->toDateString(),
                'status' => $status,
                'area_id' => $areaId,
            ],
            'filterAreas' => $availableAreas,
        ]);
    }

    private function resolvePeriod(string $period, ?string $customFrom, ?string $customTo): array
    {
        $today = now();

        return match ($period) {
            'today' => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
            'last_7_days' => [$today->copy()->subDays(6)->startOfDay(), $today->copy()->endOfDay()],
            'last_month' => [$today->copy()->subMonthNoOverflow()->startOfMonth(), $today->copy()->subMonthNoOverflow()->endOfMonth()],
            'last_90_days' => [$today->copy()->subDays(89)->startOfDay(), $today->copy()->endOfDay()],
            'custom' => [$customFrom ? Carbon::parse($customFrom)->startOfDay() : null, $customTo ? Carbon::parse($customTo)->endOfDay() : null],
            'all' => [null, null],
            default => [$today->copy()->startOfMonth(), $today->copy()->endOfDay()],
        };
    }
}
