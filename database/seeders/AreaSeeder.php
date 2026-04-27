<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use App\Models\User;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil user dengan role SUPERVISOR
        $supervisors = User::whereHas('role', function($query) {
            $query->where('role_name', 'SUPERVISOR');
        })->get();

        if ($supervisors->isEmpty()) {
            // Jika tidak ada supervisor, buat dummy
            $this->createDummySupervisors();
            $supervisors = User::whereHas('role', function($query) {
                $query->where('role_name', 'SUPERVISOR');
            })->get();
        }

        $areas = [
            ['area' => 'Fresh Milk Reception'],
            ['area' => 'Processing'],
            ['area' => 'CIP Kitchen'],
            ['area' => 'Filling'],
            ['area' => 'Packing'],
        ];

        foreach ($areas as $index => $area) {
            // Assign pic_user_id secara bergantian ke supervisor yang ada
            $picUserId = $supervisors[$index % $supervisors->count()]->id;
            
            Area::updateOrCreate(
                ['area' => $area['area']],
                ['area' => $area['area'], 'pic_user_id' => $picUserId]
            );
        }
    }

    private function createDummySupervisors()
    {
        $roleId = \App\Models\Role::where('role_name', 'SUPERVISOR')->first()->id;
        
        for ($i = 1; $i <= 5; $i++) {
            User::updateOrCreate(
                ['email' => "spv{$i}@example.com"],
                [
                    'name' => "Supervisor {$i}",
                    'email' => "spv{$i}@example.com",
                    'password' => bcrypt('password'),
                    'role_id' => $roleId,
                    'is_active' => true,
                ]
            );
        }
    }
}