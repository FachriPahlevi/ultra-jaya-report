<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubActivity;
use App\Models\SubArea;
use App\Models\User;
use Database\Seeders\Testing\RbacTestDatabaseSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RbacTestDatabaseSeederTest extends TestCase
{
    public function test_reset_uses_current_master_seeders_and_adds_test_reports(): void
    {
        Storage::fake('public');
        Storage::fake('local');

        $this->artisan('app:reset-rbac-test')->assertSuccessful();

        $this->assertSame(1, User::where('email', 'superadmin@gmail.com')->count());
        $this->assertGreaterThan(0, Area::count());
        $this->assertGreaterThan(0, SubArea::count());
        $this->assertGreaterThan(0, Activity::count());
        $this->assertGreaterThan(0, SubActivity::count());
        $this->assertGreaterThan(0, DB::table('permissions')->count());
        $this->assertGreaterThan(0, DB::table('roles')->count());
        $this->assertTrue(User::withCount('reports')->get()->every(fn (User $user) => $user->reports_count >= 30));
        $this->assertSame(SubArea::count(), Report::distinct()->count('sub_area_id'));
        $this->assertSame(SubActivity::count(), Report::distinct()->count('sub_activity_id'));
    }

    public function test_reset_refuses_production_before_running_migrations(): void
    {
        $this->app->instance('env', 'production');

        $this->artisan('app:reset-rbac-test')->assertFailed();
        $this->expectException(\RuntimeException::class);
        app(RbacTestDatabaseSeeder::class)->run();
    }
}
