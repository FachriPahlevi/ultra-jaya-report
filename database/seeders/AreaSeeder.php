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
        // Pastikan role SUPERVISOR ada
        $supervisorRole = Role::firstOrCreate(['name' => 'SUPERVISOR']);
        
        // Ambil user dengan role SUPERVISOR
        $supervisors = User::role('SUPERVISOR')->get();

        if ($supervisors->isEmpty()) {
            $this->command->info('No supervisors found. Creating dummy supervisors...');
            $this->createDummySupervisors();
            $supervisors = User::role('SUPERVISOR')->get();
        }

        if ($supervisors->isEmpty()) {
            $this->command->error('Failed to create supervisors. Please check UserSeeder.');
            return;
        }

        $areas = [
            ['area' => 'Fresh Milk Reception'],
            ['area' => 'Processing'],
            ['area' => 'CIP Kitchen'],
            ['area' => 'Filling'],
            ['area' => 'Packing'],
        ];

        foreach ($areas as $index => $areaData) {
            $area = Area::updateOrCreate(
                ['area' => $areaData['area']],
                ['area' => $areaData['area']]
            );

            $assignedSupervisorIds = [];

            if (isset($supervisors[$index])) {
                $assignedSupervisorIds[] = $supervisors[$index]->id;
            }

            $area->pics()->sync($assignedSupervisorIds);
        }

        $this->command->info(count($areas) . ' areas seeded successfully.');
        $this->command->info('Supervisors assigned through area_user pivot.');
    }

    private function createDummySupervisors()
    {
        $supervisorRole = Role::firstOrCreate(['name' => 'SUPERVISOR']);

        $supervisors = [
            ['name' => 'Supervisor Fresh Milk', 'email' => 'spv.freshmilk@example.com'],
            ['name' => 'Supervisor Processing', 'email' => 'spv.processing@example.com'],
            ['name' => 'Supervisor CIP Kitchen', 'email' => 'spv.cip@example.com'],
            ['name' => 'Supervisor Filling', 'email' => 'spv.filling@example.com'],
            ['name' => 'Supervisor Packing', 'email' => 'spv.packing@example.com'],
        ];

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
        
        $this->command->info('5 dummy supervisors created with specific areas.');
    }
}
