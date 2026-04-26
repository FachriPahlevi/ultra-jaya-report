<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Activity;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        Activity::insert([
            ['name' => 'Pendampingan', 'description' => 'Kegiatan pendampingan lapangan'],
            ['name' => 'Kontrol', 'description' => 'Kegiatan kontrol dan monitoring'],
            ['name' => 'Tracking', 'description' => 'Kegiatan tracking dan pelacakan'],
            ['name' => 'Verifikasi', 'description' => 'Kegiatan verifikasi data'],
        ]);
    }
}