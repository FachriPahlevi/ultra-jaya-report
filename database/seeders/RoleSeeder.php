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
        $newPermissions = [];

        foreach (array_keys($permissionCatalog) as $permission) {
            $record = Permission::firstOrCreate(['name' => $permission]);
            if ($record->wasRecentlyCreated) {
                $newPermissions[] = $permission;
            }
        }

        foreach (config('rbac.roles') as $roleName => $roleDefinition) {
            $role = Role::firstOrCreate(['name' => $roleName]);

            if (! $role->wasRecentlyCreated) {
                if (in_array('reports.export', $newPermissions, true) && $role->permissions->contains(fn ($permission) => str_starts_with($permission->name, 'reports.') && $permission->name !== 'reports.export')) {
                    $role->givePermissionTo('reports.export');
                }
                if ($roleDefinition['permissions'] === ['*'] && $newPermissions !== []) {
                    $role->givePermissionTo($newPermissions);
                }

                continue;
            }

            $permissions = $roleDefinition['permissions'] === ['*']
                ? Permission::all()
                : $roleDefinition['permissions'];

            $role->syncPermissions($permissions);
        }
    }
}
