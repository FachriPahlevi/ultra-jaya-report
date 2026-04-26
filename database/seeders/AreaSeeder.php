<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use App\Models\User;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan UserSeeder sudah dijalankan
        $this->call(UserSeeder::class);
        
        $users = User::pluck('id', 'email');

        $areaData = [
            'spv1@example.com' => 'Fresh Milk Reception',
            'spv2@example.com' => 'Processing',
            'spv3@example.com' => 'CIP Kitchen',
            'spv4@example.com' => 'Filling',
            'spv5@example.com' => 'Packing',
        ];

        foreach ($areaData as $email => $areaName) {
            $userId = $users->get($email);
            
            if ($userId) {
                Area::updateOrCreate(
                    ['area' => $areaName],
                    ['area' => $areaName, 'pic_user_id' => $userId]
                );
            }
        }
    }
}