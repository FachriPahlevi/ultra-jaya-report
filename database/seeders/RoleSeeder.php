<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissionCatalog = config('rbac.permissions');

        foreach (array_keys($permissionCatalog) as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        foreach (config('rbac.roles') as $roleName => $roleDefinition) {
            $role = Role::firstOrCreate(['name' => $roleName]);

            if (! $role->wasRecentlyCreated) {
                continue;
            }

            $permissions = $roleDefinition['permissions'] === ['*']
                ? Permission::all()
                : $roleDefinition['permissions'];

            $role->syncPermissions($permissions);
        }
    }
}
