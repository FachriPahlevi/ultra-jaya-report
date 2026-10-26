<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\SubActivity;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $activityMap = [
            [
                'name' => 'Behavior Based Safety',
                'description' => 'Area: All | User Role: User, SPV, Manager',
                'children' => [
                    ['name' => 'Good Behaviour', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Bad Behaviour', 'description' => 'User Role: User, SPV, Manager'],
                ],
            ],
            [
                'name' => 'Environment Issue',
                'description' => 'Area: All | User Role: User, SPV, Manager',
                'children' => [
                    ['name' => 'Emission Issue', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'B3 Issue', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Effluent WWTP Issue', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Waste Mangement', 'description' => 'User Role: User, SPV, Manager'],
                ],
            ],
            [
                'name' => 'GMP Issue',
                'description' => 'Area: All | User Role: User, SPV, Manager',
                'children' => [
                    ['name' => 'Personal Hygiene', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Cleanliness', 'description' => 'User Role: User, SPV, Manager'],
                ],
            ],
            [
                'name' => 'DAKONTRAVER',
                'description' => 'Area: All | User Role: SPV, Manager',
                'children' => [
                    ['name' => 'Dampingi', 'description' => 'User Role: SPV, Manager'],
                    ['name' => 'Kontrol', 'description' => 'User Role: SPV, Manager'],
                    ['name' => 'Tracking', 'description' => 'User Role: SPV, Manager'],
                    ['name' => 'Verification', 'description' => 'User Role: SPV, Manager'],
                ],
            ],
            [
                'name' => 'Machine Abnormality',
                'description' => 'Area: QA, Production, Engineering, HRGA | User Role: User, SPV, Manager',
                'children' => [
                    ['name' => 'Small Failures', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Unfulfilled Basic Conditions', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Hard to Reach Area', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Source of Dirt', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Quality Defect Sources', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Unnecesary Parts', 'description' => 'User Role: User, SPV, Manager'],
                ],
            ],
            [
                'name' => 'General Facility Issue',
                'description' => 'Area: HRGA | User Role: User, SPV, Manager',
                'children' => [
                    ['name' => 'Loker Issue', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Kantin Issue', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Toilet Issue', 'description' => 'User Role: User, SPV, Manager'],
                    ['name' => 'Others Issue', 'description' => 'User Role: User, SPV, Manager'],
                ],
            ],
        ];

        $allValidNames = collect($activityMap)
            ->flatMap(fn ($act) => array_merge([$act['name']], array_column($act['children'], 'name')))
            ->all();

        foreach ($activityMap as $activityData) {
            $parent = Activity::withTrashed()->updateOrCreate(
                ['name' => $activityData['name']],
                [
                    'description' => $activityData['description'],
                    'is_active' => true,
                    'deleted_at' => null,
                ]
            );

            foreach ($activityData['children'] as $childData) {
                SubActivity::withTrashed()->updateOrCreate(
                    ['activity_id' => $parent->id, 'name' => $childData['name']],
                    [
                        'description' => $childData['description'],
                        'activity_id' => $parent->id,
                        'category' => $childData['category'] ?? 'ISSUE',
                        'deleted_at' => null,
                    ]
                );
            }
        }

        $totalSub = count($allValidNames) - count($activityMap);
        $this->command->info(count($activityMap)." main activities and {$totalSub} sub-activities seeded successfully.");
    }
}
