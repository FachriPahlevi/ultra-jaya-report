<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement("DBCC CHECKIDENT('areas', RESEED, 0)");
        DB::statement("DBCC CHECKIDENT('activities', RESEED, 0)");
        DB::statement("DBCC CHECKIDENT('users', RESEED, 0)");
        DB::statement("DBCC CHECKIDENT('roles', RESEED, 0)");
        DB::statement("DBCC CHECKIDENT('reports', RESEED, 0)");

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            AreaSeeder::class,
            ActivitySeeder::class,
        ]);
    }
}