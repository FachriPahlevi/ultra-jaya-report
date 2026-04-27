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
        // Ambil user dengan role SUPERVISOR menggunakan Spatie
        $supervisors = User::role('SUPERVISOR')->get();

        if ($supervisors->isEmpty()) {
            $this->createDummySupervisors();
            $supervisors = User::role('SUPERVISOR')->get();
        }

        $areas = [
            ['area' => 'Fresh Milk Reception'],
            ['area' => 'Processing'],
            ['area' => 'CIP Kitchen'],
            ['area' => 'Filling'],
            ['area' => 'Packing'],
        ];

        foreach ($areas as $index => $area) {
            $picUserId = $supervisors[$index % $supervisors->count()]->id;

            Area::updateOrCreate(
                ['area' => $area['area']],
                ['area' => $area['area'], 'pic_user_id' => $picUserId]
            );
        }
    }

    private function createDummySupervisors()
    {
        $supervisorRole = Role::where('name', 'SUPERVISOR')->first();

        for ($i = 1; $i <= 5; $i++) {
            $user = User::updateOrCreate(
                ['email' => "spv{$i}@example.com"],
                [
                    'name' => "Supervisor {$i}",
                    'email' => "spv{$i}@example.com",
                    'password' => bcrypt('password'),
                    'is_active' => true,
                ]
            );
            $user->assignRole($supervisorRole);
        }
    }
}
