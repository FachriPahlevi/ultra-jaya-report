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
        $userId = $user->id;

        // Statistik berdasarkan role
        if ($user->can('reports.view.all')) {
            // SUPER_ADMIN, ADMIN, MANAGER bisa lihat semua report
            $totalReports = Report::count();
            $pendingReports = Report::whereNull('finished_date')->count();
            $solvedReports = Report::whereNotNull('finished_date')->count();
            $myReports = Report::where('author_id', $userId)->count();
            
            $topArea = Report::select('area_id', DB::raw('count(*) as total'))
                ->with('area')
                ->groupBy('area_id')
                ->orderBy('total', 'desc')
                ->first();
                
            $recentReports = Report::with(['author', 'area', 'activityType'])
                ->latest()
                ->take(5)
                ->get();
                
        } elseif ($user->can('reports.solve.own.area')) {
            // SUPERVISOR: lihat report sendiri + report di area yang dia jadi PIC
            $totalReports = Report::where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area', function($q2) use ($userId) {
                          $q2->where('pic_user_id', $userId);
                      });
                })->count();
                
            $pendingReports = Report::whereNull('finished_date')
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area', function($q2) use ($userId) {
                          $q2->where('pic_user_id', $userId);
                      });
                })->count();
                
            $solvedReports = Report::whereNotNull('finished_date')
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area', function($q2) use ($userId) {
                          $q2->where('pic_user_id', $userId);
                      });
                })->count();
                
            $myReports = Report::where('author_id', $userId)->count();
            
            $topArea = Report::select('area_id', DB::raw('count(*) as total'))
                ->with('area')
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area', function($q2) use ($userId) {
                          $q2->where('pic_user_id', $userId);
                      });
                })
                ->groupBy('area_id')
                ->orderBy('total', 'desc')
                ->first();
                
            $recentReports = Report::with(['author', 'area', 'activityType'])
                ->where(function($q) use ($userId) {
                    $q->where('author_id', $userId)
                      ->orWhereHas('area', function($q2) use ($userId) {
                          $q2->where('pic_user_id', $userId);
                      });
                })
                ->latest()
                ->take(5)
                ->get();
                
        } else {
            // USER biasa: hanya lihat report sendiri
            $totalReports = Report::where('author_id', $userId)->count();
            $pendingReports = Report::where('author_id', $userId)->whereNull('finished_date')->count();
            $solvedReports = Report::where('author_id', $userId)->whereNotNull('finished_date')->count();
            $myReports = $totalReports;
            
            $topArea = Report::select('area_id', DB::raw('count(*) as total'))
                ->with('area')
                ->where('author_id', $userId)
                ->groupBy('area_id')
                ->orderBy('total', 'desc')
                ->first();
                
            $recentReports = Report::with(['author', 'area', 'activityType'])
                ->where('author_id', $userId)
                ->latest()
                ->take(5)
                ->get();
        }

        $formattedRecentReports = $recentReports->map(function ($report) {
            return [
                'id' => $report->id,
                'issue' => $report->issue,
                'status' => $report->finished_date ? 'solved' : 'pending',
                'area' => $report->area?->area ?? '-',
                'submitted_by' => $report->author?->name ?? 'Unknown',
                'created_at' => $report->created_at,
            ];
        });

        $stats = [
            'total' => $totalReports,
            'pending' => $pendingReports,
            'solved' => $solvedReports,
            'myReports' => $myReports,
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentReports' => $formattedRecentReports,
            'topArea' => $topArea?->area?->area ?? null,
        ]);
    }
}