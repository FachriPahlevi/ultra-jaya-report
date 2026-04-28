<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $totalReports = Report::count();
        $pendingReports = Report::whereNull('finished_date')->count();
        $solvedReports = Report::whereNotNull('finished_date')->count();
        $myReports = Report::where('author_id', $user->id)->count();

        $stats = [
            'total' => $totalReports,
            'pending' => $pendingReports,
            'solved' => $solvedReports,
            'myReports' => $myReports,
        ];

        $recentReports = Report::with(['author', 'area', 'activity'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'issue' => $report->issue,
                    'status' => $report->finished_date ? 'solved' : 'pending',
                    'area' => $report->area?->area ?? '-',
                    'submitted_by' => $report->author?->name ?? 'Unknown',
                    'created_at' => $report->created_at,
                ];
            });

        $topArea = Report::select('area_id', DB::raw('count(*) as total'))
            ->with('area')
            ->groupBy('area_id')
            ->orderBy('total', 'desc')
            ->first();

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentReports' => $recentReports,
            'topArea' => $topArea?->area?->area ?? null,
        ]);
    }
}