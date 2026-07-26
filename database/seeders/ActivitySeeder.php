<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Activity;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $activityMap = [
            [
                'name' => 'Kontrol',
                'description' => 'Kegiatan kontrol kondisi area, utility, dan peralatan produksi.',
                'children' => [
                    ['name' => 'Inspeksi panel listrik', 'description' => 'Pemeriksaan visual panel, indikator, dan sambungan listrik.'],
                    ['name' => 'Monitoring suhu proses', 'description' => 'Pengecekan kestabilan suhu proses dan ruangan.'],
                    ['name' => 'Cek kebersihan line', 'description' => 'Kontrol kebersihan line sebelum dan sesudah proses.'],
                ],
            ],
            [
                'name' => 'Tracking',
                'description' => 'Kegiatan pelacakan temuan produksi dan progres penanganan.',
                'children' => [
                    ['name' => 'Follow up downtime', 'description' => 'Pelacakan penyebab dan progres perbaikan downtime mesin.'],
                    ['name' => 'Tracking sparepart', 'description' => 'Pelacakan kebutuhan dan ketersediaan sparepart kritikal.'],
                    ['name' => 'Monitoring tindakan korektif', 'description' => 'Pemantauan tindak lanjut terhadap temuan lapangan.'],
                ],
            ],
            [
                'name' => 'Verifikasi',
                'description' => 'Kegiatan verifikasi parameter, hasil cleaning, dan mutu proses.',
                'children' => [
                    ['name' => 'Verifikasi hasil cleaning', 'description' => 'Pengecekan hasil cleaning area dan equipment.'],
                    ['name' => 'Verifikasi kualitas sealing', 'description' => 'Pemeriksaan mutu sealing pada kemasan jadi.'],
                    ['name' => 'Verifikasi parameter CCP', 'description' => 'Validasi parameter proses pada titik kendali kritis.'],
                ],
            ],
            [
                'name' => 'Pendampingan',
                'description' => 'Kegiatan pendampingan operasional dan koordinasi penanganan.',
                'children' => [
                    ['name' => 'Pendampingan startup line', 'description' => 'Pendampingan saat line produksi mulai dijalankan.'],
                    ['name' => 'Koordinasi tindak lanjut', 'description' => 'Koordinasi lintas fungsi untuk tindak lanjut temuan.'],
                    ['name' => 'Briefing operator', 'description' => 'Pendampingan briefing singkat kepada operator area.'],
                ],
            ],
        ];

        foreach ($activityMap as $activityData) {
            $parent = Activity::updateOrCreate(
                ['name' => $activityData['name']],
                [
                    'description' => $activityData['description'],
                    'is_active' => true,
                    'parent_id' => null,
                ]
            );

            foreach ($activityData['children'] as $childData) {
                Activity::updateOrCreate(
                    ['name' => $childData['name']],
                    [
                        'description' => $childData['description'],
                        'is_active' => true,
                        'parent_id' => $parent->id,
                    ]
                );
            }
        }
    }
}
