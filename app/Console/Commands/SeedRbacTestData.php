<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Database\Seeders\Testing\RbacAcceptanceSeeder;
use Illuminate\Console\Command;

class SeedRbacTestData extends Command
{
    protected $signature = 'app:seed-rbac-test {--reports-per-user=30 : Minimum 30 reports per user}';

    protected $description = 'Add test reports using existing users and master data without changing accounts or assignments (local/testing only).';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Data uji RBAC hanya boleh dibuat pada environment local/testing.');

            return self::FAILURE;
        }
        $count = filter_var($this->option('reports-per-user'), FILTER_VALIDATE_INT);
        if ($count === false || $count < 30 || $count > 365) {
            $this->error('Jumlah laporan harus berupa bilangan bulat antara 30 dan 365 per pengguna.');

            return self::FAILURE;
        }
        $seeder = app(RbacAcceptanceSeeder::class);
        $seeder->reportsPerUser = $count;
        $seeder->setCommand($this)->run();

        return self::SUCCESS;
    }
}
