<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;

Route::inertia('/', 'Dashboard/Index')->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::middleware(['auth', 'verified', 'role:SUPER_ADMIN'])->group(function () {
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings/roles', [SettingController::class, 'storeRole'])->name('settings.roles.store');
        Route::put('/settings/roles/{role}', [SettingController::class, 'updateRole'])->name('settings.roles.update');
        Route::delete('/settings/roles/{role}', [SettingController::class, 'deleteRole'])->name('settings.roles.destroy');
        Route::post('/settings/roles/{role}/permissions', [SettingController::class, 'syncRolePermissions'])->name('settings.roles.permissions');
        Route::post('/settings/users/assign-role', [SettingController::class, 'assignRoleToUser'])->name('settings.users.assign-role');
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('reports.index')
            ->middleware('permission:reports.view');
        Route::post('/', [ReportController::class, 'store'])->name('reports.store')
            ->middleware('permission:reports.create');
        Route::post('/{report}/solve', [ReportController::class, 'solve'])->name('reports.solve')
            ->middleware('permission:reports.solve');
        Route::get('/{report}', [ReportController::class, 'show'])->name('reports.show')
            ->whereNumber('report')
            ->middleware('permission:reports.view');
        Route::put('/{report}', [ReportController::class, 'update'])->name('reports.update')
            ->whereNumber('report')
            ->middleware('permission:reports.edit');
        Route::delete('/{report}', [ReportController::class, 'destroy'])->name('reports.destroy')
            ->whereNumber('report')
            ->middleware('permission:reports.delete');
    });

    // Areas - hanya SUPER_ADMIN dan ADMIN
    Route::prefix('areas')->middleware('role:SUPER_ADMIN|ADMIN')->group(function () {
        Route::get('/', [AreaController::class, 'index'])->name('areas.index');
        Route::post('/', [AreaController::class, 'store'])->name('areas.store');
        Route::get('/{area}', [AreaController::class, 'show'])->name('areas.show')->whereNumber('area');
        Route::put('/{area}', [AreaController::class, 'update'])->name('areas.update')->whereNumber('area');
        Route::delete('/{area}', [AreaController::class, 'destroy'])->name('areas.destroy')->whereNumber('area');
    });

    // Activities - hanya SUPER_ADMIN dan ADMIN
    Route::prefix('activities')->middleware('role:SUPER_ADMIN|ADMIN')->group(function () {
        Route::get('/', [ActivityController::class, 'index'])->name('activities.index');
        Route::post('/', [ActivityController::class, 'store'])->name('activities.store');
        Route::put('/{activity}', [ActivityController::class, 'update'])->name('activities.update');
        Route::delete('/{activity}', [ActivityController::class, 'destroy'])->name('activities.destroy');
    });

    // Roles - hanya SUPER_ADMIN
    Route::prefix('roles')->middleware('role:SUPER_ADMIN')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/{role}', [RoleController::class, 'show'])->name('roles.show')->whereNumber('role');
        Route::put('/{role}', [RoleController::class, 'update'])->name('roles.update')->whereNumber('role');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->whereNumber('role');
    });
});

require __DIR__ . '/auth.php';
