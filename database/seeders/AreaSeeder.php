<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Area;
use App\Models\SubArea;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $mapping = json_decode((string) file_get_contents(database_path('seeders/data/area_mapping.json')), true, 512, JSON_THROW_ON_ERROR);

        foreach ($mapping as $areaData) {
            $area = Area::withTrashed()->updateOrCreate(['area' => $areaData['name']], ['is_active' => true, 'deleted_at' => null]);

            foreach ($areaData['sub_areas'] as $subAreaData) {
                SubArea::withTrashed()->updateOrCreate(
                    ['area_id' => $area->id, 'name' => $subAreaData['name']],
                    ['max_personnel' => 1, 'is_active' => true, 'deleted_at' => null],
                );
            }
        }

        $this->command->info(count($mapping).' area dan seluruh sub-area dari Sheet1 berhasil disinkronkan tanpa mengubah assignment user.');
    }
}
