<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Area;
use App\Models\Activity;
use App\Models\Report;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $usersByEmail = User::query()->get()->keyBy('email');
        $areasByName = Area::where('is_active', true)->get()->keyBy('area');
        $activitiesByName = Activity::whereNull('parent_id')->get()->keyBy('name');
        $subActivitiesByName = Activity::whereNotNull('parent_id')->get()->keyBy('name');

        if ($usersByEmail->isEmpty() || $areasByName->isEmpty() || $activitiesByName->isEmpty() || $subActivitiesByName->isEmpty()) {
            $this->command->info('Please run UserSeeder, AreaSeeder, and ActivitySeeder first.');
            return;
        }

        $reports = [
            [
                'author_email' => 'andri.saputra@ultrajaya.local',
                'area' => 'Processing',
                'activity' => 'Kontrol',
                'sub_activity' => 'Monitoring suhu proses',
                'issue' => 'Temperatur balance tank di line processing sempat turun di bawah batas standar selama 12 menit.',
                'status' => 'open',
                'created_at' => '2026-07-24 07:20:00',
            ],
            [
                'author_email' => 'nadia.putri@ultrajaya.local',
                'area' => 'Filling',
                'activity' => 'Verifikasi',
                'sub_activity' => 'Verifikasi kualitas sealing',
                'issue' => 'Hasil pengecekan sampling menunjukkan beberapa cup memiliki sealing kurang rapat pada sisi kanan.',
                'status' => 'closed',
                'close_comment' => 'Setting temperatur sealing head sudah disesuaikan dan hasil verifikasi ulang dinyatakan normal.',
                'closed_by_email' => 'rina.kartikasari@ultrajaya.local',
                'closed_at' => '2026-07-23 15:40:00',
                'created_at' => '2026-07-23 10:15:00',
                'is_content_edited' => true,
            ],
            [
                'author_email' => 'siska.lestari@ultrajaya.local',
                'area' => 'Packing',
                'activity' => 'Tracking',
                'sub_activity' => 'Follow up downtime',
                'issue' => 'Mesin case packer berhenti dua kali karena sensor carton infeed tidak membaca posisi box dengan stabil.',
                'status' => 'open',
                'created_at' => '2026-07-22 14:05:00',
            ],
            [
                'author_email' => 'fajar.nugraha@ultrajaya.local',
                'area' => 'Processing',
                'activity' => 'Pendampingan',
                'sub_activity' => 'Koordinasi tindak lanjut',
                'issue' => 'Perlu koordinasi dengan maintenance untuk getaran pompa homogenizer yang meningkat pada shift pagi.',
                'status' => 'closed',
                'close_comment' => 'Baut baseframe dikencangkan ulang dan vibration reading kembali stabil pada pengukuran berikutnya.',
                'closed_by_email' => 'rizky.adinata@ultrajaya.local',
                'closed_at' => '2026-07-21 16:30:00',
                'created_at' => '2026-07-21 09:10:00',
            ],
            [
                'author_email' => 'yudi.setiawan@ultrajaya.local',
                'area' => 'Fresh Milk Reception',
                'activity' => 'Kontrol',
                'sub_activity' => 'Inspeksi panel listrik',
                'issue' => 'Lampu indikator overload pada panel pompa transfer sempat menyala saat unloading susu segar batch pagi.',
                'status' => 'closed',
                'close_comment' => 'Terminal dikencangkan dan arus beban dipastikan kembali dalam batas aman.',
                'closed_by_email' => 'aulia.pratama@ultrajaya.local',
                'closed_at' => '2026-07-20 11:20:00',
                'created_at' => '2026-07-20 06:45:00',
            ],
            [
                'author_email' => 'hendra.saputra@ultrajaya.local',
                'area' => 'CIP Kitchen',
                'activity' => 'Verifikasi',
                'sub_activity' => 'Verifikasi hasil cleaning',
                'issue' => 'Masih ditemukan residu tipis pada jalur return line setelah siklus CIP untuk filler line 2 selesai dijalankan.',
                'status' => 'open',
                'created_at' => '2026-07-19 19:30:00',
            ],
            [
                'author_email' => 'bima.arya@ultrajaya.local',
                'area' => 'Packing',
                'activity' => 'Pendampingan',
                'sub_activity' => 'Briefing operator',
                'issue' => 'Operator baru di area packing memerlukan briefing ulang terkait standar penumpukan karton jadi pada pallet.',
                'status' => 'closed',
                'close_comment' => 'Briefing ulang dilakukan di awal shift dan supervisor memastikan metode stacking sudah diikuti.',
                'closed_by_email' => 'bima.arya@ultrajaya.local',
                'closed_at' => '2026-07-18 09:00:00',
                'created_at' => '2026-07-18 07:10:00',
            ],
            [
                'author_email' => 'nadia.putri@ultrajaya.local',
                'area' => 'Filling',
                'activity' => 'Kontrol',
                'sub_activity' => 'Cek kebersihan line',
                'issue' => 'Ditemukan percikan produk di sekitar nozel filler line 1 setelah pergantian format kemasan.',
                'status' => 'closed',
                'close_comment' => 'Nozel dibersihkan ulang dan penguncian clamp diperiksa, area dinyatakan bersih.',
                'closed_by_email' => 'rina.kartikasari@ultrajaya.local',
                'closed_at' => '2026-07-17 13:35:00',
                'created_at' => '2026-07-17 12:05:00',
            ],
            [
                'author_email' => 'andri.saputra@ultrajaya.local',
                'area' => 'Processing',
                'activity' => 'Tracking',
                'sub_activity' => 'Tracking sparepart',
                'issue' => 'Mechanical seal cadangan untuk pompa sirkulasi CIP tercatat tinggal satu unit dan perlu follow up pembelian.',
                'status' => 'open',
                'created_at' => '2026-07-16 10:25:00',
            ],
            [
                'author_email' => 'deni.kurniawan@ultrajaya.local',
                'area' => 'Fresh Milk Reception',
                'activity' => 'Verifikasi',
                'sub_activity' => 'Verifikasi parameter CCP',
                'issue' => 'Catatan suhu susu segar dari vendor batch kedua tidak sinkron dengan pembacaan thermometer receiving.',
                'status' => 'closed',
                'close_comment' => 'Vendor diminta revisi form penerimaan dan pembacaan suhu diverifikasi ulang bersama tim QA.',
                'closed_by_email' => 'yudi.setiawan@ultrajaya.local',
                'closed_at' => '2026-07-15 17:10:00',
                'created_at' => '2026-07-15 14:20:00',
            ],
            [
                'author_email' => 'siska.lestari@ultrajaya.local',
                'area' => 'Packing',
                'activity' => 'Kontrol',
                'sub_activity' => 'Monitoring suhu proses',
                'issue' => 'Suhu ruang penyimpanan sementara produk jadi mendekati batas atas saat beban forklift cukup tinggi.',
                'status' => 'open',
                'created_at' => '2026-07-13 16:40:00',
            ],
            [
                'author_email' => 'fajar.nugraha@ultrajaya.local',
                'area' => 'Processing',
                'activity' => 'Tracking',
                'sub_activity' => 'Monitoring tindakan korektif',
                'issue' => 'Tindakan korektif untuk noise berlebih pada motor agitator belum ditutup karena menunggu hasil alignment ulang.',
                'status' => 'closed',
                'close_comment' => 'Alignment selesai dilakukan dan noise turun sesuai batas operasi normal.',
                'closed_by_email' => 'rizky.adinata@ultrajaya.local',
                'closed_at' => '2026-07-12 18:20:00',
                'created_at' => '2026-07-11 08:30:00',
            ],
            [
                'author_email' => 'hendra.saputra@ultrajaya.local',
                'area' => 'CIP Kitchen',
                'activity' => 'Pendampingan',
                'sub_activity' => 'Pendampingan startup line',
                'issue' => 'Perlu pendampingan saat startup line setelah cleaning malam karena pompa dosing chemical sempat delay start.',
                'status' => 'closed',
                'close_comment' => 'Timer interlock disesuaikan dan startup berikutnya berjalan normal.',
                'closed_by_email' => 'aulia.pratama@ultrajaya.local',
                'closed_at' => '2026-07-10 07:35:00',
                'created_at' => '2026-07-10 05:55:00',
            ],
            [
                'author_email' => 'nadia.putri@ultrajaya.local',
                'area' => 'Filling',
                'activity' => 'Tracking',
                'sub_activity' => 'Monitoring tindakan korektif',
                'issue' => 'Perbaikan minor pada starwheel filler line 2 masih perlu dipantau karena ada gesekan ringan saat speed dinaikkan.',
                'status' => 'open',
                'created_at' => '2026-07-08 11:10:00',
            ],
            [
                'author_email' => 'bima.arya@ultrajaya.local',
                'area' => 'Packing',
                'activity' => 'Verifikasi',
                'sub_activity' => 'Verifikasi kualitas sealing',
                'issue' => 'Kemasan karton multipack dari satu batch supplier memiliki lem sambungan yang mudah terbuka saat diuji tekan.',
                'status' => 'closed',
                'close_comment' => 'Batch karton ditahan sementara dan supplier diminta melakukan penggantian material.',
                'closed_by_email' => 'rizky.adinata@ultrajaya.local',
                'closed_at' => '2026-07-07 15:15:00',
                'created_at' => '2026-07-07 09:45:00',
                'is_content_edited' => true,
            ],
        ];

        foreach ($reports as $reportData) {
            $author = $usersByEmail->get($reportData['author_email']);
            $area = $areasByName->get($reportData['area']);
            $activity = $activitiesByName->get($reportData['activity']);
            $subActivity = $subActivitiesByName->get($reportData['sub_activity']);

            if (!$author || !$area || !$activity || !$subActivity) {
                continue;
            }

            $createdAt = Carbon::parse($reportData['created_at']);
            $closedAt = isset($reportData['closed_at']) ? Carbon::parse($reportData['closed_at']) : null;
            $closer = isset($reportData['closed_by_email']) ? $usersByEmail->get($reportData['closed_by_email']) : null;

            Report::updateOrCreate(
                ['issue' => $reportData['issue']],
                [
                    'author_id' => $author->id,
                    'area_id' => $area->id,
                    'activity_id' => $activity->id,
                    'sub_activity_id' => $subActivity->id,
                    'activity' => $subActivity->name,
                    'status' => $reportData['status'],
                    'photo_before' => null,
                    'photo_after' => null,
                    'close_comment' => $reportData['close_comment'] ?? null,
                    'is_content_edited' => $reportData['is_content_edited'] ?? false,
                    'closed_at' => $closedAt,
                    'closed_by' => $closer?->id,
                    'created_at' => $createdAt,
                    'updated_at' => $closedAt ?? $createdAt->copy()->addHours(2),
                ]
            );
        }

        $this->command->info(count($reports) . ' realistic reports seeded successfully.');
    }
}
