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
            // Menu permissions
            'menu.dashboard',
            'menu.reports',
            'menu.areas',
            'menu.activities',
            'menu.settings',
            
            // User management
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign.area',
            'users.promote',
            
            // Role & Permission
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.manage',
            
            // Settings
            'settings.view',
            'settings.manage',
            
            // Area management
            'areas.view',
            'areas.create',
            'areas.edit',
            'areas.delete',
            'areas.assign.supervisor',
            
            // Activity management
            'activities.view',
            'activities.create',
            'activities.edit',
            'activities.delete',
            
            // Report management
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

        // SUPER_ADMIN - Developer, bisa akses semua menu
        $superAdmin = Role::firstOrCreate(['name' => 'SUPER_ADMIN']);
        $superAdmin->syncPermissions(Permission::all());

        // ADMIN - Admin pabrik
        $admin = Role::firstOrCreate(['name' => 'ADMIN']);
        $admin->syncPermissions([
            // Menu
            'menu.dashboard',
            'menu.reports',
            'menu.areas',
            'menu.activities',
            'menu.settings',
            // Areas
            'areas.view',
            'areas.create',
            'areas.edit',
            'areas.delete',
            'areas.assign.supervisor',
            // Activities
            'activities.view',
            'activities.create',
            'activities.edit',
            'activities.delete',
            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign.area',
            'users.promote',
            // Reports
            'reports.view.all',
            'reports.solve.all',
            'settings.view',
        ]);

        // MANAGER - Bisa lihat dan Solve semua Area
        $manager = Role::firstOrCreate(['name' => 'MANAGER']);
        $manager->syncPermissions([
            // Menu
            'menu.dashboard',
            'menu.reports',
            // Reports
            'reports.view.all',
            'reports.create',
            'reports.edit.all',
            'reports.solve.all',
            'areas.view',
            'activities.view',
        ]);

        // SUPERVISOR - Bisa nambah Report, lihat Report yang dia buat, lihat dan solve Report di Area yang diassign
        $supervisor = Role::firstOrCreate(['name' => 'SUPERVISOR']);
        $supervisor->syncPermissions([
            // Menu
            'menu.dashboard',
            'menu.reports',
            // Reports
            'reports.view.own',
            'reports.create',
            'reports.edit.own',
            'reports.solve.own.area',
            'areas.view',
            'activities.view',
        ]);

        // USER - Cuma bisa nambah Report dan lihat Report yang dia buat
        $user = Role::firstOrCreate(['name' => 'USER']);
        $user->syncPermissions([
            // Menu
            'menu.dashboard',
            'menu.reports',
            // Reports
            'reports.view.own',
            'reports.create',
            'reports.edit.own',
        ]);
    }
}