<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubArea;
use App\Models\User;
use App\Services\ReportCapabilities;
use Database\Seeders\RoleSeeder;
use Database\Seeders\Testing\RbacAcceptanceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RbacAcceptanceSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_test_seeder_configures_manager_role_and_creates_visible_reports_from_other_users(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $this->seed(RoleSeeder::class);
        $reporter = User::factory()->create()->assignRole('USER');
        $manager = User::factory()->create()->assignRole('MANAGER');
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Activity', 'is_active' => true]);
        $activity->children()->create(['name' => 'Issue', 'category' => 'ISSUE']);

        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertTrue($manager->managedAreas()->whereKey($area->id)->exists());
        $this->assertTrue($activity->children()->firstOrFail()->accessRoles()->whereKey($manager->roles->first()->id)->exists());
        $this->assertTrue(Report::visibleTo($manager)->where('author_id', $reporter->id)->where('activity_id', $activity->id)->exists());
        $count = Report::count();
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertSame($count, Report::count());
        $this->assertSame(1, $manager->managedAreas()->count());
        $this->assertSame(1, $activity->children()->firstOrFail()->accessRoles()->whereKey($manager->roles->first()->id)->count());
    }

    public function test_test_seeder_configures_supervisor_role_and_creates_closable_reports_from_other_users(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $this->seed(RoleSeeder::class);
        $reporter = User::factory()->create()->assignRole('USER');
        $supervisor = User::factory()->create()->assignRole('SUPERVISOR');
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $location = SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area', 'max_personnel' => 1, 'is_active' => true]);
        $activity = Activity::create(['name' => 'Activity', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Issue', 'category' => 'ISSUE']);

        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertTrue($supervisor->supervisedSubAreas()->whereKey($location->id)->exists());
        $this->assertTrue($child->accessRoles()->whereKey($supervisor->roles->first()->id)->exists());
        $capabilities = new ReportCapabilities($supervisor->fresh());
        $this->assertTrue(Report::visibleTo($supervisor)->where('author_id', $reporter->id)->get()->contains(fn (Report $report) => $capabilities->close($report)));
        $count = Report::count();
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertSame($count, Report::count());
        $this->assertSame(1, $location->supervisors()->count());
    }

    public function test_command_seeds_thirty_reports_for_every_user_and_is_repeatable(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(12));
        Storage::fake('public');
        Storage::fake('local');
        $this->seed(RoleSeeder::class);
        $original = User::factory()->create()->assignRole('USER');
        User::factory()->create()->assignRole('ADMIN');
        $area = Area::create(['area' => 'Lokasi riil', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area riil', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Aktivitas riil', 'is_active' => true]);
        $issue = $activity->children()->create(['name' => 'Kendala riil', 'category' => 'ISSUE']);
        $activity->children()->create(['name' => 'Observasi riil', 'category' => 'REPORT']);
        $original->managedAreas()->attach($area);
        $original->supervisedSubAreas()->attach($subArea);
        $original->assignedActivities()->attach($activity);
        $original->assignedSubActivities()->attach($issue);
        $normal = Report::create(['author_id' => $original->id, 'area_id' => $area->id, 'sub_area_id' => $subArea->id, 'sub_activity_id' => $issue->id, 'issue' => 'Laporan riil', 'status' => 'open']);
        $tables = ['users', 'roles', 'permissions', 'model_has_roles', 'role_has_permissions', 'areas', 'sub_areas', 'activities', 'sub_activities', 'area_user', 'sub_area_user', 'activity_managers', 'sub_activity_supervisors'];
        $snapshot = collect($tables)->mapWithKeys(fn ($table) => [$table => DB::table($table)->get()->toJson()])->all();
        $password = $original->password;
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $users = User::withCount('reports')->get();
        $this->assertTrue($users->every(fn ($user) => $user->reports_count >= 30));
        $this->assertSame($password, $original->fresh()->password);
        $this->assertSame($snapshot, collect($tables)->mapWithKeys(fn ($table) => [$table => DB::table($table)->get()->toJson()])->all());
        $this->assertSame('Laporan riil', $normal->fresh()->issue);
        $this->assertSame(0, Report::where('issue', 'like', '%RBAC-DEMO:%')->count());
        $this->assertSame(0, Report::where('category_snapshot', 'REPORT')->where('status', 'closed')->count());
        $this->assertGreaterThan(0, Report::whereNotNull('photo_before')->whereNotNull('photo_after')->count());
        $this->assertGreaterThan(0, Report::whereNull('photo_before')->count());
        $this->assertGreaterThan(0, Report::where('status', 'closed')->count());
        $this->assertGreaterThan(0, Report::whereDate('created_at', today())->whereNotNull('photo_before')->count());
        $count = Report::count();
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertSame($count, Report::count());
        $this->assertSame($users->count(), User::count());
        foreach (Report::whereNotNull('photo_before')->pluck('photo_before')->unique() as $path) {
            Storage::disk('public')->assertExists($path);
            $this->assertStringStartsWith('reports/testing/commons/', $path);
            $this->assertSame(IMAGETYPE_JPEG, getimagesize(Storage::disk('public')->path($path))[2]);
        }
        $dimensions = collect(Report::whereNotNull('photo_before')->pluck('photo_before')->unique())
            ->map(fn ($path) => getimagesize(Storage::disk('public')->path($path)))
            ->map(fn ($size) => [$size[0], $size[1]]);
        $this->assertTrue($dimensions->contains(fn ($size) => $size[0] === $size[1]));
        $this->assertTrue($dimensions->contains(fn ($size) => $size[0] > $size[1] && $size[0] <= 320));
        $this->assertTrue($dimensions->contains(fn ($size) => $size[0] < $size[1]));
    }

    public function test_all_locations_and_activities_receive_reports_even_when_more_than_thirty_exist(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $user = User::factory()->create();
        for ($index = 0; $index < 35; $index++) {
            $area = Area::create(['area' => "Area {$index}", 'is_active' => true]);
            SubArea::create(['area_id' => $area->id, 'name' => "Sub-area {$index}", 'is_active' => true]);
            $activity = Activity::create(['name' => "Aktivitas {$index}", 'is_active' => true]);
            $activity->children()->create(['name' => "Pemeriksaan {$index}", 'category' => 'ISSUE']);
        }
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertSame(35, $user->reports()->count());
        foreach (['area_id', 'sub_area_id', 'activity_id', 'sub_activity_id'] as $column) {
            $this->assertSame(35, Report::distinct()->count($column));
        }
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertDatabaseCount('reports', 35);
    }

    public function test_legacy_fixture_is_rewritten_without_duplicating_or_touching_real_reports(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $user = User::factory()->create();
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $location = SubArea::create(['area_id' => $area->id, 'name' => 'Lokasi', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Aktivitas', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Pemeriksaan', 'category' => 'ISSUE']);
        $legacy = Report::create(['author_id' => $user->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => "[RBAC-DEMO:{$user->id}:001] Lama", 'status' => 'open']);
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertDatabaseCount('reports', 30);
        $this->assertStringNotContainsString('RBAC-DEMO', $legacy->fresh()->issue);
        $this->artisan('app:seed-rbac-test')->assertSuccessful();
        $this->assertDatabaseCount('reports', 30);
    }

    public function test_command_refuses_production_and_invalid_counts_before_any_data_is_written(): void
    {
        $this->artisan('app:seed-rbac-test', ['--reports-per-user' => 29])->assertFailed();
        $this->assertDatabaseCount('users', 0);
        $this->app->instance('env', 'production');
        $this->artisan('app:seed-rbac-test')->assertFailed();
        $this->assertDatabaseCount('roles', 0);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_seeder_itself_refuses_production_even_if_invoked_directly(): void
    {
        $this->app->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        app(RbacAcceptanceSeeder::class)->run();
    }

    public function test_missing_master_data_does_not_bootstrap_users_roles_or_locations(): void
    {
        try {
            app(RbacAcceptanceSeeder::class)->run();
            $this->fail('Missing master data should stop report seeding.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('tidak membuat atau mengubah data master', $exception->getMessage());
        }
        foreach (['users', 'roles', 'areas', 'sub_areas', 'activities', 'sub_activities', 'reports'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }
}
