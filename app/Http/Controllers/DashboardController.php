<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        // Statistik berdasarkan role
        if ($user->can('reports.view.all')) {
            // SUPER_ADMIN, ADMIN, MANAGER bisa lihat semua report
            $totalReports = Report::count();
            $openReports = Report::where('status', 'open')->count();
            $closedReports = Report::where('status', 'closed')->count();
            $myReports = Report::where('author_id', $userId)->count();
            
            $topArea = Report::select('area_id', DB::raw('count(*) as total'))
                ->with('area')
                ->groupBy('area_id')
                ->orderBy('total', 'desc')
                ->first();
                
            $recentReports = Report::with(['author', 'area', 'activityType', 'subActivity'])
                ->latest()
                ->take(5)
                ->get();
                
        } elseif ($user->can('reports.solve.own.area')) {
            // SUPERVISOR: lihat report sendiri + report di area yang dia jadi PIC
            $totalReports = Report::where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area.pics', function($q2) use ($userId) {
                          $q2->where('users.id', $userId);
                      });
                })->count();
                
            $openReports = Report::where('status', 'open')
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area.pics', function($q2) use ($userId) {
                          $q2->where('users.id', $userId);
                      });
                })->count();
                
            $closedReports = Report::where('status', 'closed')
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area.pics', function($q2) use ($userId) {
                          $q2->where('users.id', $userId);
                      });
                })->count();
                
            $myReports = Report::where('author_id', $userId)->count();
            
            $topArea = Report::select('area_id', DB::raw('count(*) as total'))
                ->with('area')
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area.pics', function($q2) use ($userId) {
                          $q2->where('users.id', $userId);
                      });
                })
                ->groupBy('area_id')
                ->orderBy('total', 'desc')
                ->first();
                
            $recentReports = Report::with(['author', 'area', 'activityType', 'subActivity'])
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area.pics', function($q2) use ($userId) {
                          $q2->where('users.id', $userId);
                      });
                })
                ->latest()
                ->take(5)
                ->get();
                
        } else {
            // USER biasa: hanya lihat report sendiri
            $totalReports = Report::where('author_id', $userId)->count();
            $openReports = Report::where('author_id', $userId)->where('status', 'open')->count();
            $closedReports = Report::where('author_id', $userId)->where('status', 'closed')->count();
            $myReports = $totalReports;
            
            $topArea = Report::select('area_id', DB::raw('count(*) as total'))
                ->with('area')
                ->where('author_id', $userId)
                ->groupBy('area_id')
                ->orderBy('total', 'desc')
                ->first();
                
            $recentReports = Report::with(['author', 'area', 'activityType', 'subActivity'])
                ->where('author_id', $userId)
                ->latest()
                ->take(5)
                ->get();
        }

        $formattedRecentReports = $recentReports->map(function ($report) {
            return [
                'id' => $report->id,
                'issue' => $report->issue,
                'status' => $report->status,
                'area' => $report->area?->area ?? '-',
                'submitted_by' => $report->author?->name ?? 'Unknown',
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
        ]);
    }
}
