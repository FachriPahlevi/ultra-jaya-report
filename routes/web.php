<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PublicDashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;

Route::get('/dashboard', [PublicDashboardController::class, 'index'])->name('dashboard.public');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Reports routes
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])
            ->name('reports.index')
            ->middleware('role_or_permission:reports.view.own|reports.view.all|reports.solve.own.area');

        Route::post('/', [ReportController::class, 'store'])
            ->name('reports.store')
            ->middleware('can:reports.create');

        Route::post('/{report}/close', [ReportController::class, 'close'])
            ->name('reports.close')
            ->middleware('role_or_permission:reports.solve.own.area|reports.solve.all');

        Route::get('/{report}', [ReportController::class, 'show'])
            ->name('reports.show')
            ->middleware('role_or_permission:reports.view.own|reports.view.all|reports.solve.own.area');

        Route::put('/{report}', [ReportController::class, 'update'])
            ->name('reports.update')
            ->middleware('role_or_permission:reports.edit.own|reports.edit.all');

        Route::delete('/{report}', [ReportController::class, 'destroy'])
            ->name('reports.destroy')
            ->middleware('role_or_permission:reports.delete.own|reports.delete.all');

        Route::get('/export/{type}', [ReportController::class, 'export'])
            ->name('reports.export')
            ->middleware('role_or_permission:reports.view.own|reports.view.all|reports.solve.own.area');
    });

    // Areas routes
    Route::prefix('areas')->group(function () {
        Route::get('/', [AreaController::class, 'index'])
            ->name('areas.index')
            ->middleware('can:areas.view');

        Route::post('/', [AreaController::class, 'store'])
            ->name('areas.store')
            ->middleware('can:areas.create');

        Route::put('/{area}', [AreaController::class, 'update'])
            ->name('areas.update')
            ->middleware('can:areas.edit');

        Route::patch('/{area}/status', [AreaController::class, 'updateStatus'])
            ->name('areas.status')
            ->middleware('can:areas.edit');

        Route::patch('/{areaId}/restore', [AreaController::class, 'restore'])
            ->name('areas.restore')
            ->middleware('can:areas.delete');

        Route::delete('/{area}', [AreaController::class, 'destroy'])
            ->name('areas.destroy')
            ->middleware('can:areas.delete');

        Route::delete('/{areaId}/force', [AreaController::class, 'forceDestroy'])
            ->name('areas.force-destroy')
            ->middleware('can:areas.delete');
    });

    // Activities routes
    Route::prefix('activities')->group(function () {
        Route::get('/', [ActivityController::class, 'index'])
            ->name('activities.index')
            ->middleware('can:activities.view');

        Route::post('/', [ActivityController::class, 'store'])
            ->name('activities.store')
            ->middleware('can:activities.create');

        Route::put('/{activity}', [ActivityController::class, 'update'])
            ->name('activities.update')
            ->middleware('can:activities.edit');

        Route::patch('/{activity}/status', [ActivityController::class, 'updateStatus'])
            ->name('activities.status')
            ->middleware('can:activities.edit');

        Route::delete('/{activity}', [ActivityController::class, 'destroy'])
            ->name('activities.destroy')
            ->middleware('can:activities.delete');
    });

    // Settings routes - hanya SUPER_ADMIN dan ADMIN
    Route::middleware(['can:settings.view'])->group(function () {
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');

        Route::post('/settings/users', [SettingController::class, 'storeUser'])
            ->name('settings.users.store')
            ->middleware('can:users.create');

        Route::put('/settings/users/{user}', [SettingController::class, 'updateUser'])
            ->name('settings.users.update')
            ->middleware('can:users.edit');

        Route::delete('/settings/users/{user}', [SettingController::class, 'destroyUser'])
            ->name('settings.users.destroy')
            ->middleware('can:users.delete');

        Route::post('/settings/users/assign-role', [SettingController::class, 'assignRoleToUser'])
            ->name('settings.users.assign-role')
            ->middleware('can:users.promote');

        Route::post('/settings/roles', [SettingController::class, 'storeRole'])
            ->name('settings.roles.store')
            ->middleware('can:permissions.manage');

        Route::put('/settings/roles/{role}', [SettingController::class, 'updateRole'])
            ->name('settings.roles.update')
            ->middleware('can:permissions.manage');

        Route::delete('/settings/roles/{role}', [SettingController::class, 'deleteRole'])
            ->name('settings.roles.destroy')
            ->middleware('can:permissions.manage');

        Route::post('/settings/roles/{role}/permissions', [SettingController::class, 'syncRolePermissions'])
            ->name('settings.roles.permissions')
            ->middleware('can:permissions.manage');
    });
});

require __DIR__ . '/auth.php';
