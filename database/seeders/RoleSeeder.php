<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat permissions
        $permissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'areas.view',
            'areas.create',
            'areas.edit',
            'areas.delete',
            'activities.view',
            'activities.create',
            'activities.edit',
            'activities.delete',
            'reports.view',
            'reports.create',
            'reports.edit',
            'reports.delete',
            'reports.solve',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Buat roles dan assign permissions
        $superAdmin = Role::create(['name' => 'SUPER_ADMIN']);
        $superAdmin->givePermissionTo(Permission::all());

        $admin = Role::create(['name' => 'ADMIN']);
        $admin->givePermissionTo([
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'areas.view',
            'areas.create',
            'areas.edit',
            'areas.delete',
            'activities.view',
            'activities.create',
            'activities.edit',
            'activities.delete',
            'reports.view',
            'reports.create',
            'reports.edit',
            'reports.delete',
            'reports.solve',
        ]);

        $manager = Role::create(['name' => 'MANAGER']);
        $manager->givePermissionTo([
            'reports.view',
            'reports.create',
            'reports.edit',
            'areas.view',
            'activities.view',
        ]);

        $supervisor = Role::create(['name' => 'SUPERVISOR']);
        $supervisor->givePermissionTo([
            'reports.view',
            'reports.create',
            'reports.solve',
        ]);

        $user = Role::create(['name' => 'USER']);
        $user->givePermissionTo([
            'reports.view',
            'reports.create',
        ]);
    }
}
