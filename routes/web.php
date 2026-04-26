<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ReportController;

Route::inertia('/', 'Dashboard/Index')->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::inertia('/reports/issues', 'reports/Create')->name('reports.issue');
    Route::inertia('/reports/solve', 'reports/Solve')->name('reports.solve');

    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('reports.index');
        Route::post('/', [ReportController::class, 'store'])->name('reports.store');
        Route::get('/{report}', [ReportController::class, 'show'])->name('reports.show')->whereNumber('report');
        Route::put('/{report}', [ReportController::class, 'update'])->name('reports.update')->whereNumber('report');
        Route::delete('/{report}', [ReportController::class, 'destroy'])->name('reports.destroy')->whereNumber('report');
    });

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        Route::get('/{user}', [UserController::class, 'show'])->name('users.show')->whereNumber('user');
        Route::put('/{user}', [UserController::class, 'update'])->name('users.update')->whereNumber('user');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('users.destroy')->whereNumber('user');
    });

    Route::prefix('areas')->group(function () {
        Route::get('/', [AreaController::class, 'index'])->name('areas.index');
        Route::post('/', [AreaController::class, 'store'])->name('areas.store');
        Route::get('/{area}', [AreaController::class, 'show'])->name('areas.show')->whereNumber('area');
        Route::put('/{area}', [AreaController::class, 'update'])->name('areas.update')->whereNumber('area');
        Route::delete('/{area}', [AreaController::class, 'destroy'])->name('areas.destroy')->whereNumber('area');
    });

    Route::prefix('activities')->group(function () {
        Route::get('/', [ActivityController::class, 'index'])->name('activities.index');
        Route::post('/', [ActivityController::class, 'store'])->name('activities.store');
        Route::put('/{activity}', [ActivityController::class, 'update'])->name('activities.update');
        Route::delete('/{activity}', [ActivityController::class, 'destroy'])->name('activities.destroy');
    });

    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/{role}', [RoleController::class, 'show'])->name('roles.show')->whereNumber('role');
        Route::put('/{role}', [RoleController::class, 'update'])->name('roles.update')->whereNumber('role');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->whereNumber('role');
    });
});

require __DIR__ . '/auth.php';
