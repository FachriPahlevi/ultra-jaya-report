<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubActivity;
use App\Models\SubArea;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\TestScenarioSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ManagementWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_update_and_delete_own_report(): void
    {
        $user = $this->userWithPermissions(['reports.create', 'reports.view.own', 'reports.edit.own', 'reports.delete.own']);
        [$area, $subArea, $activity] = $this->reportContext();

        $this->actingAs($user)->post(route('reports.store'), [
            'type_activity' => $activity->id,
            'sub_activity_id' => $activity->children()->firstOrFail()->id,
            'area_activity' => $area->id,
            'sub_area_id' => $subArea->id,
            'issue' => 'Temuan awal',
        ])->assertRedirect();

        $report = Report::firstOrFail();
        $this->assertSame($user->id, $report->author_id);

        $this->actingAs($user)->put(route('reports.update', $report), ['issue' => 'Temuan diperbarui'])
            ->assertRedirect();
        $this->assertSame('Temuan diperbarui', $report->fresh()->issue);

        $this->actingAs($user)->delete(route('reports.destroy', $report))->assertRedirect();
        $this->assertSoftDeleted('reports', ['id' => $report->id]);
    }

    public function test_user_cannot_edit_or_delete_another_users_report(): void
    {
        $author = $this->userWithPermissions(['reports.create', 'reports.view.own', 'reports.edit.own', 'reports.delete.own']);
        $otherUser = $this->userWithPermissions(['reports.view.own', 'reports.edit.own', 'reports.delete.own']);
        [$area, $subArea, $activity] = $this->reportContext();
        $report = Report::create([
            'author_id' => $author->id,
            'area_id' => $area->id,
            'sub_area_id' => $subArea->id,
            'activity_id' => $activity->id,
            'issue' => 'Milik user lain',
            'sub_activity_id' => $activity->children()->firstOrFail()->id,
            'status' => Report::STATUS_OPEN,
        ]);

        $this->actingAs($otherUser)->put(route('reports.update', $report), ['issue' => 'Tidak boleh'])->assertForbidden();
        $this->actingAs($otherUser)->delete(route('reports.destroy', $report))->assertForbidden();
    }

    public function test_authorized_user_can_manage_activity_area_and_sub_area(): void
    {
        $user = $this->userWithPermissions(['activities.create', 'activities.edit', 'activities.delete', 'areas.create', 'areas.edit', 'areas.delete']);

        $this->actingAs($user)->postJson(route('activities.store'), ['name' => 'Aktivitas Baru', 'description' => 'Deskripsi'])
            ->assertOk();
        $activity = Activity::firstOrFail();

        $this->actingAs($user)->putJson(route('activities.update', $activity), ['name' => 'Aktivitas Revisi', 'description' => 'Revisi'])
            ->assertOk();
        $this->assertDatabaseHas('activities', ['id' => $activity->id, 'name' => 'Aktivitas Revisi']);

        $this->actingAs($user)->delete(route('activities.destroy', $activity))->assertRedirect();
        $this->assertSoftDeleted('activities', ['id' => $activity->id]);

        $this->actingAs($user)->postJson(route('areas.store'), ['name' => 'Area Baru'])
            ->assertCreated();
        $area = Area::where('area', 'Area Baru')->firstOrFail();

        $this->actingAs($user)->putJson(route('areas.update', $area), ['name' => 'Area Revisi'])
            ->assertOk();

        $this->actingAs($user)->postJson(route('areas.sub-areas.store', $area), ['name' => 'Sub Area Baru', 'max_personnel' => 2])
            ->assertCreated();
        $subArea = SubArea::where('name', 'Sub Area Baru')->firstOrFail();

        $this->actingAs($user)->putJson(route('areas.sub-areas.update', [$area, $subArea]), ['name' => 'Sub Area Revisi', 'max_personnel' => 3])
            ->assertOk();
        $this->assertDatabaseHas('sub_areas', ['id' => $subArea->id, 'name' => 'Sub Area Revisi', 'max_personnel' => 3]);

        $this->actingAs($user)->deleteJson(route('areas.sub-areas.destroy', [$area, $subArea]))
            ->assertOk();
        $this->assertSoftDeleted('sub_areas', ['id' => $subArea->id]);

        $this->actingAs($user)->deleteJson(route('areas.destroy', $area))->assertOk();
        $this->assertSoftDeleted('areas', ['id' => $area->id]);
    }

    public function test_default_roles_only_see_reports_in_their_assigned_scope(): void
    {
        $this->seed(TestScenarioSeeder::class);
        $user = User::where('email', 'test.user@example.test')->firstOrFail();
        $supervisor = User::where('email', 'test.supervisor@example.test')->firstOrFail();
        $manager = User::where('email', 'test.manager@example.test')->firstOrFail();
        $admin = User::where('email', 'test.admin@example.test')->firstOrFail();
        $ownReport = Report::where('issue', 'Laporan milik user uji')->firstOrFail();
        $supervisorAreaReport = Report::where('issue', 'Laporan area supervisor uji')->firstOrFail();
        $otherReport = Report::where('issue', 'Laporan di luar scope uji')->firstOrFail();

        $this->actingAs($user)->get(route('reports.index'))
            ->assertInertia(fn (Assert $page) => $page->has('reports', 1)->where('reports.0.id', $ownReport->id));
        $this->actingAs($supervisor)->get(route('reports.index'))
            ->assertInertia(fn (Assert $page) => $page->has('reports', 2));
        $this->actingAs($manager)->get(route('reports.index'))
            ->assertInertia(fn (Assert $page) => $page->has('reports', 3));
        $this->actingAs($admin)->get(route('reports.index'))
            ->assertInertia(fn (Assert $page) => $page->has('reports', 3));

        $this->assertFalse($manager->can('update', $supervisorAreaReport));
        $this->assertFalse($manager->can('close', $supervisorAreaReport));
        $this->assertTrue($supervisor->can('close', $supervisorAreaReport));
        $this->assertFalse($supervisor->can('close', $otherReport));
    }

    public function test_test_scenario_seeder_creates_valid_role_scopes(): void
    {
        $this->seed(TestScenarioSeeder::class);

        $manager = User::where('email', 'test.manager@example.test')->firstOrFail();
        $supervisor = User::where('email', 'test.supervisor@example.test')->firstOrFail();

        $this->assertTrue($manager->managedAreas()->where('area', 'Area Uji RBAC')->exists());
        $this->assertTrue($supervisor->supervisedSubAreas()->where('name', 'Sub-area Uji RBAC')->exists());
        $this->assertDatabaseCount('reports', 3);
    }

    public function test_admin_creates_manager_and_supervisor_with_required_scope(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = $this->roleUser('ADMIN');
        [$area, $subArea] = $this->reportContext();

        $this->actingAs($admin)->postJson(route('settings.users.store'), [
            'name' => 'Manager Tanpa Scope',
            'email' => 'manager-tanpa-scope@example.test',
            'password' => 'password',
            'role' => 'MANAGER',
        ])->assertUnprocessable()->assertJsonValidationErrors('area_ids');

        $this->actingAs($admin)->postJson(route('settings.users.store'), [
            'name' => 'Manager Area',
            'email' => 'manager-area@example.test',
            'password' => 'password',
            'role' => 'MANAGER',
            'area_ids' => [$area->id],
        ])->assertCreated();

        $manager = User::where('email', 'manager-area@example.test')->firstOrFail();
        $this->assertTrue($manager->hasRole('MANAGER'));
        $this->assertTrue($manager->managedAreas()->whereKey($area->id)->exists());

        $this->actingAs($admin)->postJson(route('settings.users.store'), [
            'name' => 'Supervisor Pertama',
            'email' => 'supervisor-pertama@example.test',
            'password' => 'password',
            'role' => 'SUPERVISOR',
            'sub_area_ids' => [$subArea->id],
        ])->assertCreated();

        $this->actingAs($admin)->postJson(route('settings.users.store'), [
            'name' => 'Supervisor Kedua',
            'email' => 'supervisor-kedua@example.test',
            'password' => 'password',
            'role' => 'SUPERVISOR',
            'sub_area_ids' => [$subArea->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('sub_area_ids');
    }

    public function test_default_roles_can_only_open_their_allowed_pages(): void
    {
        $this->seed(RoleSeeder::class);
        $user = $this->roleUser('USER');
        $supervisor = $this->roleUser('SUPERVISOR');
        $manager = $this->roleUser('MANAGER');
        $admin = $this->roleUser('ADMIN');

        $this->actingAs($user)->get(route('reports.index'))->assertOk();
        $this->actingAs($user)->get(route('areas.index'))->assertForbidden();
        $this->actingAs($user)->get(route('activities.index'))->assertForbidden();
        $this->actingAs($user)->get(route('settings.index'))->assertForbidden();

        $this->actingAs($supervisor)->get(route('reports.index'))->assertOk();
        $this->actingAs($supervisor)->get(route('areas.index'))->assertOk();
        $this->actingAs($supervisor)->get(route('activities.index'))->assertOk();
        $this->actingAs($supervisor)->get(route('settings.index'))->assertForbidden();

        $this->actingAs($manager)->get(route('reports.index'))->assertOk();
        $this->actingAs($manager)->get(route('areas.index'))->assertOk();
        $this->actingAs($manager)->get(route('activities.index'))->assertOk();
        $this->actingAs($manager)->get(route('settings.index'))->assertForbidden();

        $this->actingAs($admin)->get(route('reports.index'))->assertOk();
        $this->actingAs($admin)->get(route('areas.index'))->assertOk();
        $this->actingAs($admin)->get(route('activities.index'))->assertOk();
        $this->actingAs($admin)->get(route('settings.index'))->assertOk();
    }

    public function test_report_photo_accepts_three_megabytes_and_rejects_larger_files(): void
    {
        Storage::fake('public');
        $user = $this->userWithPermissions(['reports.create', 'reports.view.own']);
        [$area, $subArea, $activity] = $this->reportContext();

        $this->actingAs($user)->post(route('reports.store'), [
            'type_activity' => $activity->id,
            'area_activity' => $area->id,
            'sub_area_id' => $subArea->id,
            'issue' => 'Foto tiga megabyte',
            'sub_activity_id' => $activity->children()->firstOrFail()->id,
            'photo' => UploadedFile::fake()->image('evidence.jpg')->size(3072),
        ])->assertRedirect();

        $report = Report::firstOrFail();
        $this->assertNotNull($report->photo_before);
        $this->assertMatchesRegularExpression(
            '#^reports/\d{4}/\d{2}/'.$report->id.'/before-\d{8}-\d{6}-[a-z0-9]{8}\.jpg$#',
            $report->photo_before,
        );
        Storage::disk('public')->assertExists($report->photo_before);
        $storedPhoto = Storage::disk('public')->get($report->photo_before);
        $photoInfo = getimagesizefromstring($storedPhoto);
        $this->assertNotFalse($photoInfo);
        $this->assertSame('image/jpeg', $photoInfo['mime']);
        $this->assertLessThanOrEqual(1600, max($photoInfo[0], $photoInfo[1]));

        $this->actingAs($user)->post(route('reports.store'), [
            'type_activity' => $activity->id,
            'area_activity' => $area->id,
            'sub_area_id' => $subArea->id,
            'issue' => 'Foto terlalu besar',
            'sub_activity_id' => $activity->children()->firstOrFail()->id,
            'photo' => UploadedFile::fake()->image('too-large.jpg')->size(3073),
        ])->assertSessionHasErrors('photo');
    }

    public function test_excel_export_is_an_xlsx_download(): void
    {
        $user = $this->userWithPermissions(['reports.view.all', 'reports.export']);
        [$area, $subArea, $activity] = $this->reportContext();
        $this->createReport($user, $area, $subArea, $activity, 'Laporan ekspor');

        $this->actingAs($user)->get(route('reports.export', 'excel'))
            ->assertOk()
            ->assertDownload();
    }

    private function userWithPermissions(array $permissions): User
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function reportContext(): array
    {
        $area = Area::create(['area' => fake()->unique()->word(), 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => fake()->unique()->word(), 'max_personnel' => 1, 'is_active' => true]);
        $activity = Activity::create(['name' => fake()->unique()->word(), 'is_active' => true]);
        SubActivity::create(['activity_id' => $activity->id, 'name' => fake()->unique()->word()]);

        return [$area, $subArea, $activity];
    }

    private function roleUser(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findByName($role));

        return $user;
    }

    private function createReport(User $author, Area $area, SubArea $subArea, Activity $activity, string $issue): Report
    {
        return Report::create([
            'author_id' => $author->id,
            'area_id' => $area->id,
            'sub_area_id' => $subArea->id,
            'activity_id' => $activity->id,
            'issue' => $issue,
            'sub_activity_id' => $activity->children()->firstOrFail()->id,
            'status' => Report::STATUS_OPEN,
        ]);
    }
}
