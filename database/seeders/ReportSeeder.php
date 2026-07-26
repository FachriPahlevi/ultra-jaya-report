<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Area;
use App\Models\Activity;
use App\Models\Report;
class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $areas = Area::where('is_active', true)->get();
        $activities = Activity::all();

        if ($users->isEmpty() || $areas->isEmpty() || $activities->isEmpty()) {
            $this->command->info('Please run UserSeeder, AreaSeeder, and ActivitySeeder first.');
            return;
        }

        $reportsData = [];

        foreach ($users as $user) {
            for ($i = 1; $i <= 5; $i++) {
                $area = $areas->random();
                $activity = $activities->random();
                
                $isClosed = (bool) rand(0, 1);
                $closedAt = $isClosed ? now()->subDays(rand(1, 30)) : null;
                
                $reportsData[] = [
                    'author_id' => $user->id,
                    'area_id' => $area->id,
                    'activity_id' => $activity->id,
                    'activity' => $this->getRandomActivity(),
                    'issue' => $this->getRandomIssue(),
                    'status' => $isClosed ? 'closed' : 'open',
                    'photo_before' => null,
                    'photo_after' => null,
                    'is_content_edited' => $isClosed ? rand(0, 1) : 0,
                    'closed_at' => $closedAt,
                    'created_at' => now()->subDays(rand(1, 60)),
                    'updated_at' => now()->subDays(rand(0, 30)),
                ];
            }
        }

        foreach ($reportsData as $report) {
            Report::create($report);
        }

        $this->command->info(count($reportsData) . ' reports seeded successfully.');
        $this->command->info('Each user has 5 reports.');
    }

    private function getRandomActivity(): string
    {
        $activities = [
            'Pembersihan mesin produksi',
            'Perawatan rutin conveyor',
            'Pengecekan suhu ruangan',
            'Kalibrasi timbangan digital',
            'Pengecekan kebocoran pipa',
            'Penggantian filter udara',
            'Pelumasan bearing',
            'Pengecekan tekanan udara',
            'Pembersihan area kerja',
            'Inspeksi keselamatan kerja',
        ];
        
        return $activities[array_rand($activities)];
    }

    private function getRandomIssue(): string
    {
        $issues = [
            'Mesin produksi mengeluarkan suara tidak normal saat dioperasikan.',
            'Terdapat kebocoran kecil pada pipa saluran air di area produksi.',
            'Kualitas produk akhir tidak sesuai standar, terdapat cacat pada kemasan.',
            'Suhu ruangan penyimpanan melebihi batas normal yang ditentukan.',
            'Conveyor berhenti mendadak saat proses pengemasan berlangsung.',
            'Timbangan digital menunjukkan angka tidak stabil saat ditimbang.',
            'Terdapat tumpahan minyak di lantai area produksi.',
            'Lampu penerangan di area gudang mati menyala tidak stabil.',
            'Kebisingan berlebih dari mesin kompresor mengganggu pekerja.',
            'Debu menumpuk berlebihan pada saringan udara mesin.',
            'Koneksi listrik pada panel kontrol terlihat longgar.',
            'Aroma tidak sedap tercium dari saluran pembuangan limbah.',
            'Getaran berlebihan pada mesin saat beroperasi di kecepatan tinggi.',
            'Terdapat genangan air di sekitar area pendingin ruangan.',
            'Pintu darurat sulit dibuka karena karat pada engsel.',
        ];
        
        return $issues[array_rand($issues)];
    }
}
