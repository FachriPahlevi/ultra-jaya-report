<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Activity;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        Activity::insert([
            ['description' => 'Pendampingan'],
            ['description' => 'Kontrol'],
            ['description' => 'Tracking'],
            ['description' => 'Verifikasi'],
        ]);
    }
}