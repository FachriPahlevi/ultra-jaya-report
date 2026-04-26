<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::pluck('id', 'role_name');

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('password'),
                'role_id' => $roles->get('SUPER_ADMIN'),
                'is_active' => true,
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role_id' => $roles->get('ADMIN'),
                'is_active' => true,
            ],
            [
                'name' => 'Manager User',
                'email' => 'manager@example.com',
                'password' => Hash::make('password'),
                'role_id' => $roles->get('MANAGER'),
                'is_active' => true,
            ],
            [
                'name' => 'Supervisor 1',
                'email' => 'supervisor1@example.com',
                'password' => Hash::make('password'),
                'role_id' => $roles->get('SUPERVISOR'),
                'is_active' => true,
            ],
            [
                'name' => 'Supervisor 2',
                'email' => 'supervisor2@example.com',
                'password' => Hash::make('password'),
                'role_id' => $roles->get('SUPERVISOR'),
                'is_active' => true,
            ],
            [
                'name' => 'Regular User',
                'email' => 'user@example.com',
                'password' => Hash::make('password'),
                'role_id' => $roles->get('USER'),
                'is_active' => true,
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}