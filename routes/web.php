<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PublicDashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', [PublicDashboardController::class, 'index'])->name('dashboard.public');

Route::middleware(['auth', 'verified'])->group(function (): void {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('reports')->as('reports.')->group(function (): void {
        Route::get('/', [ReportController::class, 'index'])
            ->name('index')
            ->middleware('role_or_permission:reports.view.own|reports.view.all|reports.solve.own.area');

        Route::post('/', [ReportController::class, 'store'])
            ->name('store')
            ->middleware('can:reports.create');

        Route::get('/export/{type}', [ReportController::class, 'export'])
            ->name('export')
            ->whereIn('type', ['pdf', 'excel'])
            ->middleware('role_or_permission:reports.view.own|reports.view.all|reports.solve.own.area');

        Route::post('/{report}/close', [ReportController::class, 'close'])
            ->name('close')
            ->middleware('can:close,report');

        Route::get('/{report}', [ReportController::class, 'show'])
            ->name('show')
            ->middleware('can:view,report');

        Route::put('/{report}', [ReportController::class, 'update'])
            ->name('update')
            ->middleware('can:update,report');

        Route::delete('/{report}', [ReportController::class, 'destroy'])
            ->name('destroy')
            ->middleware('can:delete,report');
    });

    Route::prefix('areas')->as('areas.')->group(function (): void {
        Route::get('/', [AreaController::class, 'index'])
            ->name('index')
            ->middleware('can:areas.view');

        Route::post('/', [AreaController::class, 'store'])
            ->name('store')
            ->middleware('can:areas.create');

        Route::put('/{area}', [AreaController::class, 'update'])
            ->name('update')
            ->middleware('can:areas.edit');

        Route::patch('/{area}/status', [AreaController::class, 'updateStatus'])
            ->name('status')
            ->middleware('can:areas.edit');

        Route::patch('/{areaId}/restore', [AreaController::class, 'restore'])
            ->name('restore')
            ->middleware('can:areas.delete');

        Route::delete('/{area}', [AreaController::class, 'destroy'])
            ->name('destroy')
            ->middleware('can:areas.delete');

        Route::delete('/{areaId}/force', [AreaController::class, 'forceDestroy'])
            ->name('force-destroy')
            ->middleware('can:areas.delete');
    });

    Route::prefix('activities')->as('activities.')->group(function (): void {
        Route::get('/', [ActivityController::class, 'index'])
            ->name('index')
            ->middleware('can:activities.view');

        Route::post('/', [ActivityController::class, 'store'])
            ->name('store')
            ->middleware('can:activities.create');

        Route::put('/{activity}', [ActivityController::class, 'update'])
            ->name('update')
            ->middleware('can:activities.edit');

        Route::patch('/{activity}/status', [ActivityController::class, 'updateStatus'])
            ->name('status')
            ->middleware('can:activities.edit');

        Route::delete('/{activity}', [ActivityController::class, 'destroy'])
            ->name('destroy')
            ->middleware('can:activities.delete');
    });

    Route::prefix('settings')->as('settings.')->middleware('can:settings.view')->group(function (): void {
        Route::get('/', [SettingController::class, 'index'])->name('index');

        Route::post('/users', [SettingController::class, 'storeUser'])
            ->name('users.store')
            ->middleware('can:users.create');

        Route::put('/users/{user}', [SettingController::class, 'updateUser'])
            ->name('users.update')
            ->middleware('can:users.edit');

        Route::delete('/users/{user}', [SettingController::class, 'destroyUser'])
            ->name('users.destroy')
            ->middleware('can:users.delete');

        Route::post('/users/assign-role', [SettingController::class, 'assignRoleToUser'])
            ->name('users.assign-role')
            ->middleware('can:users.promote');

        Route::post('/roles', [SettingController::class, 'storeRole'])
            ->name('roles.store')
            ->middleware('can:roles.create');

        Route::put('/roles/{role}', [SettingController::class, 'updateRole'])
            ->name('roles.update')
            ->middleware('can:roles.edit');

        Route::delete('/roles/{role}', [SettingController::class, 'deleteRole'])
            ->name('roles.destroy')
            ->middleware('can:roles.delete');

        Route::post('/roles/{role}/permissions', [SettingController::class, 'syncRolePermissions'])
            ->name('roles.permissions')
            ->middleware('can:permissions.manage');
    });
});

require __DIR__.'/auth.php';
