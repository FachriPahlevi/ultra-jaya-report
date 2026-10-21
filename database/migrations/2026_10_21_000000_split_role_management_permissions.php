<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        foreach (Permission::query()->where('name', 'permissions.manage')->get() as $legacyPermission) {
            $rolePermissions = collect(['roles.view', 'roles.create', 'roles.edit', 'roles.delete'])
                ->map(fn (string $name) => Permission::firstOrCreate([
                    'name' => $name,
                    'guard_name' => $legacyPermission->guard_name,
                ]));

            foreach ($legacyPermission->roles as $role) {
                $role->givePermissionTo($rolePermissions->all());
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Permission assignments may have changed in the UI; keep them on rollback.
    }
};
