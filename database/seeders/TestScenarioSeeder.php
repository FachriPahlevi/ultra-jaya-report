<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Data khusus untuk feature test. Seeder ini tidak dipanggil DatabaseSeeder
 * agar akun dan laporan uji tidak pernah masuk ke database aplikasi.
 */
class TestScenarioSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $superAdmin = $this->createUser('Super Admin Uji', 'test.superadmin@example.test', 'SUPER_ADMIN');
        $admin = $this->createUser('Admin Uji', 'test.admin@example.test', 'ADMIN');
        $manager = $this->createUser('Manager Uji', 'test.manager@example.test', 'MANAGER');
        $supervisor = $this->createUser('Supervisor Uji', 'test.supervisor@example.test', 'SUPERVISOR');
        $user = $this->createUser('User Uji', 'test.user@example.test', 'USER');

        $area = Area::withTrashed()->updateOrCreate(
            ['area' => 'Area Uji RBAC'],
            ['is_active' => true, 'deleted_at' => null],
        );
        $subArea = SubArea::withTrashed()->updateOrCreate(
            ['area_id' => $area->id, 'name' => 'Sub-area Uji RBAC'],
            ['max_personnel' => 1, 'is_active' => true, 'deleted_at' => null],
        );
        $outsideArea = Area::withTrashed()->updateOrCreate(
            ['area' => 'Area Di Luar Scope Uji'],
            ['is_active' => true, 'deleted_at' => null],
        );
        $outsideSubArea = SubArea::withTrashed()->updateOrCreate(
            ['area_id' => $outsideArea->id, 'name' => 'Sub-area Di Luar Scope Uji'],
            ['max_personnel' => 1, 'is_active' => true, 'deleted_at' => null],
        );
        $activity = Activity::withTrashed()->updateOrCreate(
            ['name' => 'Aktivitas Uji RBAC'],
            ['description' => 'Aktivitas khusus feature test.', 'is_active' => true, 'parent_id' => null, 'deleted_at' => null],
        );

        $manager->managedAreas()->sync([$area->id]);
        $supervisor->supervisedSubAreas()->sync([$subArea->id]);

        $this->createReport($user, $area, $subArea, $activity, 'Laporan milik user uji');
        $this->createReport($admin, $area, $subArea, $activity, 'Laporan area supervisor uji');
        $this->createReport($admin, $outsideArea, $outsideSubArea, $activity, 'Laporan di luar scope uji');
    }

    private function createUser(string $name, string $email, string $role): User
    {
        $user = User::withTrashed()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'is_active' => true,
                'deleted_at' => null,
            ],
        );

        $user->syncRoles([$role]);

        return $user;
    }

    private function createReport(User $author, Area $area, SubArea $subArea, Activity $activity, string $issue): void
    {
        Report::updateOrCreate(
            ['issue' => $issue],
            [
                'author_id' => $author->id,
                'area_id' => $area->id,
                'sub_area_id' => $subArea->id,
                'activity_id' => $activity->id,
                'status' => Report::STATUS_OPEN,
            ],
        );
    }
}
