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
                    ['name' => 'Supervisor Fresh Milk', 'email' => 'spv.freshmilk@example.com'],
                    ['name' => 'Supervisor Assistant Fresh Milk', 'email' => 'spv.freshmilk.assistant@example.com'],
                ],
            ],
            [
                'area' => 'Processing',
                'pics' => [
                    ['name' => 'Supervisor Processing', 'email' => 'spv.processing@example.com'],
                ],
            ],
            [
                'area' => 'CIP Kitchen',
                'pics' => [
                    ['name' => 'Supervisor CIP Kitchen', 'email' => 'spv.cip@example.com'],
                ],
            ],
            [
                'area' => 'Filling',
                'pics' => [
                    ['name' => 'Supervisor Filling', 'email' => 'spv.filling@example.com'],
                ],
            ],
            [
                'area' => 'Packing',
                'pics' => [
                    ['name' => 'Supervisor Packing', 'email' => 'spv.packing@example.com'],
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
                ['area' => $areaData['area']]
            );

            $assignedSupervisorIds = collect($areaData['pics'])
                ->map(fn($pic) => $supervisorsByEmail[$pic['email']]?->id)
                ->filter()
                ->values()
                ->all();

            $area->pics()->sync($assignedSupervisorIds);
        }

        $this->command->info(count($areaAssignments) . ' areas seeded successfully.');
        $this->command->info('Supervisors assigned with 1 PIC = 1 area rule.');
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
