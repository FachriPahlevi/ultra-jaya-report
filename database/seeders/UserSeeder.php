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
            'name' => 'Admin1',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role_id' => $roles->get('ADM'),
            'is_active' => true,
        ],
        [
            'name' => 'Manager1',
            'email' => 'mgr1@example.com',
            'password' => Hash::make('password'),
            'role_id' => $roles->get('MGR'),
            'is_active' => true,
        ],
        ...collect(range(1, 5))->map(fn ($i) => [
            'name' => "Supervisor{$i}",
            'email' => "spv{$i}@example.com",
            'password' => Hash::make('password'),
            'role_id' => $roles->get('SPV'),
            'is_active' => true,
        ])->toArray(),
    ];

    foreach ($users as $user) {
        User::create($user);
    }
}
}