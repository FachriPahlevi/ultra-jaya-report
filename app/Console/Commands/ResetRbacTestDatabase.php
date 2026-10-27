<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Database\Seeders\Testing\RbacTestDatabaseSeeder;
use Illuminate\Console\Command;

class ResetRbacTestDatabase extends Command
{
    protected $signature = 'app:reset-rbac-test';

    protected $description = 'Drop and rebuild the local/testing database with current master seeders and test reports.';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Database pengujian hanya boleh di-reset pada environment local/testing.');

            return self::FAILURE;
        }

        $this->warn('Semua tabel dan data pada koneksi database aktif akan dihapus.');

        return $this->call('migrate:fresh', [
            '--seed' => true,
            '--seeder' => RbacTestDatabaseSeeder::class,
        ]);
    }
}
