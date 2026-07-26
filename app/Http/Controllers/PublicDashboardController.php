<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Report;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PublicDashboardController extends Controller
{
    public function index()
    {
        $totalReports = Report::count();
        $openReports = Report::where('status', 'open')->count();
        $closedReports = Report::where('status', 'closed')->count();

        $oldestOpenTicket = Report::with(['area:id,area', 'activityType:id,name', 'subActivity:id,name'])
            ->where('status', 'open')
            ->oldest('created_at')
            ->first();

        $recentReports = Report::with(['area:id,area', 'activityType:id,name', 'subActivity:id,name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function (Report $report) {
                return [
                    'id' => $report->id,
                    'issue' => $report->issue,
                    'status' => $report->status,
                    'area' => $report->area?->area ?? '-',
                    'activity' => $report->subActivity?->name ?? $report->activityType?->name ?? '-',
                    'created_at' => $report->created_at,
                ];
            });

        $topAreas = Report::select(
            'area_id',
            DB::raw('COUNT(*) as total_reports'),
            DB::raw("SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_reports"),
            DB::raw("SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_reports")
        )
            ->with('area:id,area')
            ->groupBy('area_id')
            ->orderByDesc('total_reports')
            ->take(4)
            ->get()
            ->map(function ($row) {
                return [
                    'name' => $row->area?->area ?? 'Unknown Area',
                    'total' => (int) $row->total_reports,
                    'open' => (int) $row->open_reports,
                    'closed' => (int) $row->closed_reports,
                ];
            });

        $topActivities = Report::select('activity_id', DB::raw('COUNT(*) as total_reports'))
            ->with('activityType:id,name')
            ->groupBy('activity_id')
            ->orderByDesc('total_reports')
            ->take(4)
            ->get()
            ->map(function ($row) {
                return [
                    'name' => $row->activityType?->name ?? 'Unknown Activity',
                    'total' => (int) $row->total_reports,
                ];
            });

        return Inertia::render('Dashboard/PublicDisplay', [
            'stats' => [
                'total' => $totalReports,
                'open' => $openReports,
                'closed' => $closedReports,
                'activeAreas' => Area::where('is_active', true)->has('reports')->count(),
            ],
            'oldestOpenTicket' => $oldestOpenTicket ? [
                'id' => $oldestOpenTicket->id,
                'issue' => $oldestOpenTicket->issue,
                'area' => $oldestOpenTicket->area?->area ?? '-',
                'activity' => $oldestOpenTicket->subActivity?->name ?? $oldestOpenTicket->activityType?->name ?? '-',
                'created_at' => $oldestOpenTicket->created_at,
            ] : null,
            'recentReports' => $recentReports,
            'topAreas' => $topAreas,
            'topActivities' => $topActivities,
            'generatedAt' => now()->toIso8601String(),
        ]);
    }
}
