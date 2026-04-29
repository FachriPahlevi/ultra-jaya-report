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
            ['area' => 'Fresh Milk Reception', 'pic_user_id' => null],
            ['area' => 'Processing', 'pic_user_id' => null],
            ['area' => 'CIP Kitchen', 'pic_user_id' => null],
            ['area' => 'Filling', 'pic_user_id' => null],
            ['area' => 'Packing', 'pic_user_id' => null],
        ];

        // Assign 1 SPV untuk 1 area (berurutan)
        foreach ($areas as $index => $area) {
            if (isset($supervisors[$index])) {
                $areas[$index]['pic_user_id'] = $supervisors[$index]->id;
            }
        }

        foreach ($areas as $area) {
            Area::updateOrCreate(
                ['area' => $area['area']],
                ['pic_user_id' => $area['pic_user_id']]
            );
        }

        $this->command->info(count($areas) . ' areas seeded successfully.');
        $this->command->info('Each supervisor assigned to 1 area.');
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