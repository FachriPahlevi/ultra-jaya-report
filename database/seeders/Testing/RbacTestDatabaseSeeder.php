<?php

declare(strict_types=1);

namespace Database\Seeders\Testing;

use Database\Seeders\ActivitySeeder;
use Database\Seeders\AreaSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Database\Seeder;
use RuntimeException;

class RbacTestDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Seeder database pengujian hanya boleh dijalankan pada environment local/testing.');
        }

        $this->call([
            RoleSeeder::class, // Includes the permission catalog.
            UserSeeder::class,
            AreaSeeder::class,
            ActivitySeeder::class,
            RbacAcceptanceSeeder::class,
        ]);
    }
}
