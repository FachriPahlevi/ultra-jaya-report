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
        $query = Report::query();

        if (! $user->can('reports.view.all')) {
            if ($user->can('reports.review.area')) {
                $query->whereHas('area.managers', fn (Builder $managers) => $managers->whereKey($userId));
            } elseif ($user->can('reports.view.own') && $user->can('reports.solve.own.area')) {
                $query->where(fn (Builder $visible) => $visible
                    ->where('author_id', $userId)
                    ->orWhereHas('subArea.supervisors', fn (Builder $supervisors) => $supervisors->whereKey($userId)));
            } elseif ($user->can('reports.solve.own.area')) {
                $query->whereHas('subArea.supervisors', fn (Builder $supervisors) => $supervisors->whereKey($userId));
            } else {
                $query->where('author_id', $userId);
            }
        }

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
        $openReports = (clone $query)->where('status', 'open')->count();
        $closedReports = (clone $query)->where('status', 'closed')->count();
        $myReports = Report::where('author_id', $userId)->count();

        $topArea = (clone $query)
            ->select('area_id', DB::raw('count(*) as total'))
            ->with('area')
            ->groupBy('area_id')
            ->orderByDesc('total')
            ->first();

        $recentReports = (clone $query)
            ->with(['author:id,name', 'area:id,area', 'activityType:id,name', 'subActivity:id,name'])
            ->latest()
            ->take(5)
            ->get();

        $oldestOpenTicket = (clone $query)
            ->with(['area:id,area', 'activityType:id,name', 'subActivity:id,name'])
            ->where('status', 'open')
            ->oldest('created_at')
            ->first();

        $formattedRecentReports = $recentReports->map(function ($report) {
            return [
                'id' => $report->id,
                'issue' => $report->issue,
                'status' => $report->status,
                'area' => $report->area?->area ?? '-',
                'submitted_by' => $report->author?->name ?? 'Unknown',
                'activity' => $report->subActivity?->name ?? $report->activityType?->name ?? '-',
                'created_at' => $report->created_at,
            ];
        });

        $stats = [
            'total' => $totalReports,
            'open' => $openReports,
            'closed' => $closedReports,
            'myReports' => $myReports,
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentReports' => $formattedRecentReports,
            'topArea' => $topArea?->area?->area ?? null,
            'oldestOpenTicket' => $oldestOpenTicket ? [
                'id' => $oldestOpenTicket->id,
                'issue' => $oldestOpenTicket->issue,
                'area' => $oldestOpenTicket->area?->area ?? '-',
                'activity' => $oldestOpenTicket->subActivity?->name ?? $oldestOpenTicket->activityType?->name ?? '-',
                'created_at' => $oldestOpenTicket->created_at,
                'age_in_days' => (int) $oldestOpenTicket->created_at->diffInDays(now()),
            ] : null,
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
