<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'role_name' => 'SUPER_ADMIN',
                'role_desc' => 'Super Administrator with full access to all features',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'ADMIN',
                'role_desc' => 'Administrator can manage users, areas, activities, and all reports',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'MANAGER',
                'role_desc' => 'Manager can view and manage reports from their area',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'SUPERVISOR',
                'role_desc' => 'Supervisor can create, view, and solve reports',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'USER',
                'role_desc' => 'Regular user can create and view their own reports',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        Role::insert($roles);
    }
}