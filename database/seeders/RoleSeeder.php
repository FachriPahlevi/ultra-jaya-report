<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'menu.dashboard',
            'menu.reports',
            'menu.areas',
            'menu.activities',
            'menu.settings',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign.area',
            'users.promote',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.manage',
            'settings.view',
            'settings.manage',
            'areas.view',
            'areas.create',
            'areas.edit',
            'areas.delete',
            'areas.assign.supervisor',
            'activities.view',
            'activities.create',
            'activities.edit',
            'activities.delete',
            'areas.view.all',
            'reports.view.own',
            'reports.view.all',
            'reports.create',
            'reports.edit.own',
            'reports.edit.all',
            'reports.delete',
            'reports.solve.own.area',
            'reports.solve.all',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'SUPER_ADMIN']);
        $superAdmin->syncPermissions(Permission::all());

        $admin = Role::firstOrCreate(['name' => 'ADMIN']);
        $admin->syncPermissions([
            'menu.dashboard',
            'menu.reports',
            'menu.areas',
            'menu.activities',
            'menu.settings',
            'areas.view',
            'areas.create',
            'areas.edit',
            'areas.delete',
            'areas.assign.supervisor',
            'activities.view',
            'activities.create',
            'activities.edit',
            'activities.delete',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign.area',
            'users.promote',
            'reports.view.all',
            'reports.create',
            'reports.solve.all',
            'reports.delete',
            'settings.view',
        ]);

        $manager = Role::firstOrCreate(['name' => 'MANAGER']);
        $manager->syncPermissions([
            'menu.dashboard',
            'menu.reports',
            'menu.areas',
            'menu.activities',
            'areas.view.all',
            'reports.view.all',
            'reports.create',
            'reports.edit.all',
            'reports.solve.all',
            'reports.delete',
            'areas.view',
            'activities.view',
        ]);

        $supervisor = Role::firstOrCreate(['name' => 'SUPERVISOR']);
        $supervisor->syncPermissions([
            'menu.dashboard',
            'menu.reports',
            'reports.view.own',
            'reports.create',
            'reports.edit.own',
            'reports.solve.own.area',
            'areas.view',
            'activities.view',
        ]);

        $user = Role::firstOrCreate(['name' => 'USER']);
        $user->syncPermissions([
            'menu.dashboard',
            'menu.reports',
            'reports.view.own',
            'reports.create',
            'reports.edit.own',
        ]);
    }
}