<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::insert([
            ['role_name' => 'ADM', 'role_desc' => 'Administrator'],
            ['role_name' => 'SPV', 'role_desc' => 'Supervisor'],
            ['role_name' => 'MGR', 'role_desc' => 'Manager'],
        ]);
    }
}