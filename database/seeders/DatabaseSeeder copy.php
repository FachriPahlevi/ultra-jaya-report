<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement("DBCC CHECKIDENT('areas', RESEED, 1)");
        DB::statement("DBCC CHECKIDENT('activities', RESEED, 1)");
        DB::statement("DBCC CHECKIDENT('users', RESEED, 1)");
        DB::statement("DBCC CHECKIDENT('roles', RESEED, 1)");
        DB::statement("DBCC CHECKIDENT('reports', RESEED, 1)");

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            AreaSeeder::class,
            ActivitySeeder::class,
        ]);
    }
}