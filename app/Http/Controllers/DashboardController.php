<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;
        $query = Report::query();

        if (! $user->can('reports.view.all')) {
            if ($user->can('reports.solve.own.area')) {
                $query->where(function (Builder $builder) use ($userId) {
                    $builder->where('author_id', $userId)
                        ->orWhereHas('area.pics', fn(Builder $areaQuery) => $areaQuery->where('users.id', $userId));
                });
            } else {
                $query->where('author_id', $userId);
            }
        }

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
        ]);
    }
}
