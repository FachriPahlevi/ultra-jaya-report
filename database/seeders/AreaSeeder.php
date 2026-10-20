<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use App\Models\User;
use Spatie\Permission\Models\Role;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'SUPERVISOR']);

        $areaAssignments = [
            [
                'area' => 'ENG',
                'pics' => [
                    ['name' => 'Adityadika Miftakhul Khakim', 'email' => 'adityadikamiftah@gmail.com'],
                    ['name' => 'Meicky Ari Wibowo', 'email' => 'meickyariwibowo@gmail.com'],
                    ['name' => 'Muhammad Hafiz Aziz', 'email' => 'muhammad.h.aziz@gmail.com'],
                    ['name' => 'Vikterio Yuwanda', 'email' => 'vikterioyuwanda@gmail.com'],
                    ['name' => 'Yani Musdalifah', 'email' => 'yanimusdalifah2@gmail.com'],
                ],
            ],
            [
                'area' => 'Factory Management',
                'pics' => [
                    ['name' => 'Iwan Awalludin', 'email' => 'iwanawaludin1970@gmail.com'],
                    ['name' => 'Septy Lestari', 'email' => 'septilestari008@gmail.com'],
                ],
            ],
            [
                'area' => 'Finance & Supply Chain',
                'pics' => [
                    ['name' => 'Muhamad Iqbal Maulana', 'email' => 'iqbalmaulana.im270@gmail.com'],
                    ['name' => 'Tania Fakhira', 'email' => 'tnfkhr@gmail.com'],
                ],
            ],
            [
                'area' => 'HRGA',
                'pics' => [
                    ['name' => 'Ahmad Aqib Nurrachman', 'email' => 'aqibnurrachman@gmail.com'],
                    ['name' => 'Faizal Suryaman', 'email' => 'faizal.suryaman@gmail.com'],
                    ['name' => 'Tito Irmandi Wicaksono', 'email' => 'titoirmandiwicaksono@gmail.com'],
                ],
            ],
            [
                'area' => 'HSE',
                'pics' => [
                    ['name' => 'Aura Amca Diputra', 'email' => 'aura.amca@ultrajaya.co.id'],
                ],
            ],
            [
                'area' => 'Manufacturing Management',
                'pics' => [
                    ['name' => 'Ina Iriani Roseri', 'email' => 'ina.iriani@ultrajaya.co.id'],
                ],
            ],
            [
                'area' => 'PPIC & Production Storage',
                'pics' => [
                    ['name' => 'Widiya Tri Astuti', 'email' => 'widiya.triastt@gmail.com'],
                ],
            ],
            [
                'area' => 'PRD',
                'pics' => [
                    ['name' => 'Ina Nur Hidayati', 'email' => 'inahidayatinr@gmail.com'],
                    ['name' => 'Mahendra Sadewa', 'email' => 'mahendrasadewa13@gmail.com'],
                    ['name' => 'Martelius Samuel', 'email' => 'martelius2016@gmail.com'],
                    ['name' => 'Muhammad Yoga Brillianto', 'email' => 'myogabrillianto@gmail.com'],
                    ['name' => 'Putri Repsol Aprilia', 'email' => 'putrirepsolaprilia12@gmail.com'],
                    ['name' => 'Marfiando Ardy Saputra', 'email' => 'marfiando02@gmail.com'],
                    ['name' => 'Mahardhika Narastyawan', 'email' => 'mahardhikanarastyawan@gmail.com'],
                    ['name' => 'Jordy Lambang Aditya', 'email' => 'jordylambangaditya@gmail.com'],
                    ['name' => 'Jan Pernando Saragih', 'email' => 'janpernandosaragih@gmail.com'],
                ],
            ],
            [
                'area' => 'QA',
                'pics' => [
                    ['name' => 'Kamiluddin', 'email' => 'kamil.malik43@gmail.com'],
                    ['name' => 'Muhammad Ismail', 'email' => 'ismail50049217@gmail.com'],
                    ['name' => 'Rahma Fadilla', 'email' => 'rahmafadilladj1@gmail.com'],
                    ['name' => 'Roozadila Puttria', 'email' => 'roozadila@gmail.com'],
                    ['name' => 'Bima Ariyanto', 'email' => 'ariyantobima0902@gmail.com'],
                ],
            ],
        ];

        $realAreaNames = collect($areaAssignments)->pluck('area')->all();
        Area::whereNotIn('area', $realAreaNames)->forceDelete();

        $supervisorsByEmail = User::role('SUPERVISOR')
            ->whereIn(
                'email',
                collect($areaAssignments)->flatMap(fn($assignment) => collect($assignment['pics'])->pluck('email'))->all()
            )
            ->get()
            ->keyBy('email');

        $supervisorsByEmail->each(fn(User $supervisor) => $supervisor->assignedAreas()->detach());

        foreach ($areaAssignments as $areaData) {
            $area = Area::withTrashed()->updateOrCreate(
                ['area' => $areaData['area']],
                [
                    'area' => $areaData['area'],
                    'is_active' => true,
                    'deleted_at' => null,
                ]
            );

            $assignedSupervisorIds = collect($areaData['pics'])
                ->map(fn($pic) => $supervisorsByEmail[$pic['email']]?->id)
                ->filter()
                ->values()
                ->all();

            $area->pics()->sync($assignedSupervisorIds);
        }

        $this->command->info(count($areaAssignments) . ' areas seeded successfully.');
    }
}
