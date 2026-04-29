<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Super Admin', 'email' => 'superadmin@example.com', 'password' => 'password', 'role' => 'SUPER_ADMIN'],
            ['name' => 'Admin User', 'email' => 'admin@example.com', 'password' => 'password', 'role' => 'ADMIN'],
            ['name' => 'Manager User', 'email' => 'manager@example.com', 'password' => 'password', 'role' => 'MANAGER'],
            ['name' => 'Supervisor Fresh Milk', 'email' => 'spv.freshmilk@example.com', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Supervisor Processing', 'email' => 'spv.processing@example.com', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Supervisor CIP Kitchen', 'email' => 'spv.cip@example.com', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Supervisor Filling', 'email' => 'spv.filling@example.com', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Supervisor Packing', 'email' => 'spv.packing@example.com', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Regular User 1', 'email' => 'user1@example.com', 'password' => 'password', 'role' => 'USER'],
            ['name' => 'Regular User 2', 'email' => 'user2@example.com', 'password' => 'password', 'role' => 'USER'],
        ];

        foreach ($users as $userData) {
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'is_active' => true,
            ]);
            $user->assignRole($userData['role']);
        }
    }
}