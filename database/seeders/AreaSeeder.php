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
                'area' => 'Fresh Milk Reception',
                'pics' => [
                    ['name' => 'Yudi Setiawan', 'email' => 'yudi.setiawan@ultrajaya.local'],
                    ['name' => 'Deni Kurniawan', 'email' => 'deni.kurniawan@ultrajaya.local'],
                ],
            ],
            [
                'area' => 'Processing',
                'pics' => [
                    ['name' => 'Fajar Nugraha', 'email' => 'fajar.nugraha@ultrajaya.local'],
                    ['name' => 'Lukman Hakim', 'email' => 'lukman.hakim@ultrajaya.local'],
                ],
            ],
            [
                'area' => 'CIP Kitchen',
                'pics' => [
                    ['name' => 'Hendra Saputra', 'email' => 'hendra.saputra@ultrajaya.local'],
                    ['name' => 'Agus Salim', 'email' => 'agus.salim@ultrajaya.local'],
                ],
            ],
            [
                'area' => 'Filling',
                'pics' => [
                    ['name' => 'Rina Kartikasari', 'email' => 'rina.kartikasari@ultrajaya.local'],
                    ['name' => 'Mira Puspita', 'email' => 'mira.puspita@ultrajaya.local'],
                ],
            ],
            [
                'area' => 'Packing',
                'pics' => [
                    ['name' => 'Bima Arya', 'email' => 'bima.arya@ultrajaya.local'],
                    ['name' => 'Tomi Wijaya', 'email' => 'tomi.wijaya@ultrajaya.local'],
                ],
            ],
        ];

        $this->ensureSupervisorsExist($areaAssignments);

        $supervisorsByEmail = User::role('SUPERVISOR')
            ->whereIn(
                'email',
                collect($areaAssignments)->flatMap(fn($assignment) => collect($assignment['pics'])->pluck('email'))->all()
            )
            ->get()
            ->keyBy('email');

        $supervisorsByEmail->each(fn(User $supervisor) => $supervisor->assignedAreas()->detach());

        foreach ($areaAssignments as $areaData) {
            $area = Area::updateOrCreate(
                ['area' => $areaData['area']],
                [
                    'area' => $areaData['area'],
                    'is_active' => true,
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
        $this->command->info('Realistic multi-PIC area assignments prepared.');
    }

    private function ensureSupervisorsExist(array $areaAssignments): void
    {
        $supervisorRole = Role::firstOrCreate(['name' => 'SUPERVISOR']);

        $supervisors = collect($areaAssignments)
            ->flatMap(fn($assignment) => $assignment['pics'])
            ->unique('email')
            ->values();

        foreach ($supervisors as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('password'),
                    'is_active' => true,
                ]
            );
            if (!$user->hasRole('SUPERVISOR')) {
                $user->assignRole($supervisorRole);
            }
        }

        $this->command->info($supervisors->count() . ' supervisors prepared for area assignments.');
    }
}
