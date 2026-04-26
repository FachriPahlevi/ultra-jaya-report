<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use App\Models\User;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::pluck('id', 'email');

        $areas = [
            ['area' => 'Fresh Milk Reception', 'pic_user_id' => $users->get('spv1@example.com')],
            ['area' => 'Processing', 'pic_user_id' => $users->get('spv2@example.com')],
            ['area' => 'CIP Kitchen', 'pic_user_id' => $users->get('spv3@example.com')],
            ['area' => 'Filling', 'pic_user_id' => $users->get('spv4@example.com')],
            ['area' => 'Packing', 'pic_user_id' => $users->get('spv5@example.com')],
        ];

        foreach ($areas as $area) {
            Area::create($area);
        }
    }
}