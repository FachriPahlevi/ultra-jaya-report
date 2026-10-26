<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubArea;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RbacAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_reseeding_preserves_permissions_changed_in_settings(): void
    {
        $this->seed(RoleSeeder::class);

        $role = Role::findByName('MANAGER');
        $role->syncPermissions(['reports.view.own']);

        $this->seed(RoleSeeder::class);

        $this->assertSame(['reports.view.own'], $role->fresh()->permissions->pluck('name')->all());
    }

    public function test_legacy_permission_is_split_without_removing_existing_access(): void
    {
        $this->seed(RoleSeeder::class);

        $role = Role::create(['name' => 'LEGACY_ADMIN']);
        $role->givePermissionTo('permissions.manage');

        $migration = require database_path('migrations/2026_10_21_000000_split_role_management_permissions.php');
        $migration->up();

        $this->assertTrue($role->fresh()->hasAllPermissions([
            'permissions.manage',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
        ]));
    }

    public function test_role_permissions_control_routes_independently(): void
    {
        $this->seed(RoleSeeder::class);

        $role = Role::create(['name' => 'ROLE_EDITOR']);
        $role->syncPermissions(['settings.view', 'roles.view', 'roles.create']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->postJson(route('settings.roles.store'), ['name' => 'NEW_ROLE'])
            ->assertCreated();

        $this->actingAs($user)
            ->deleteJson(route('settings.roles.destroy', Role::findByName('NEW_ROLE')))
            ->assertForbidden();
    }

    public function test_report_policy_limits_actions_to_the_author_and_open_reports(): void
    {
        $this->seed(RoleSeeder::class);

        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $author->givePermissionTo(['reports.view.own', 'reports.edit.own']);
        $otherUser->givePermissionTo(['reports.view.own', 'reports.edit.own']);

        $area = Area::create(['area' => 'Area Uji', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Aktivitas Uji', 'is_active' => true]);
        $report = Report::create([
            'author_id' => $author->id,
            'area_id' => $area->id,
            'activity_id' => $activity->id,
            'issue' => 'Temuan uji',
            'status' => Report::STATUS_OPEN,
        ]);

        $this->assertTrue($author->can('update', $report));
        $this->assertFalse($otherUser->can('update', $report));

        $report->update(['status' => Report::STATUS_CLOSED]);

        $this->assertFalse($author->can('update', $report->fresh()));
    }

    public function test_supervisor_can_close_only_reports_in_their_sub_area(): void
    {
        $this->seed(RoleSeeder::class);

        $author = User::factory()->create();
        $pic = User::factory()->create();
        $pic->assignRole('SUPERVISOR');
        $pic->givePermissionTo('reports.solve.own.area');
        $assignedArea = Area::create(['area' => 'Area PIC', 'is_active' => true]);
        $otherArea = Area::create(['area' => 'Area Lain', 'is_active' => true]);
        $assignedSubArea = SubArea::create(['area_id' => $assignedArea->id, 'name' => 'Sub Area PIC', 'max_personnel' => 1]);
        $otherSubArea = SubArea::create(['area_id' => $otherArea->id, 'name' => 'Sub Area Lain', 'max_personnel' => 1]);
        $assignedSubArea->supervisors()->attach($pic);
        $activity = Activity::create(['name' => 'Aktivitas Uji', 'is_active' => true]);
        $activity->assignees()->attach($pic);
        $unassignedActivity = Activity::create(['name' => 'Aktivitas Tidak Ditugaskan', 'is_active' => true]);

        $assignedReport = Report::create([
            'author_id' => $author->id,
            'area_id' => $assignedArea->id,
            'sub_area_id' => $assignedSubArea->id,
            'activity_id' => $activity->id,
            'issue' => 'Temuan PIC',
            'status' => Report::STATUS_OPEN,
        ]);
        $otherReport = Report::create([
            'author_id' => $author->id,
            'area_id' => $otherArea->id,
            'sub_area_id' => $otherSubArea->id,
            'activity_id' => $activity->id,
            'issue' => 'Temuan lain',
            'status' => Report::STATUS_OPEN,
        ]);
        $unassignedActivityReport = Report::create([
            'author_id' => $author->id,
            'area_id' => $assignedArea->id,
            'sub_area_id' => $assignedSubArea->id,
            'activity_id' => $unassignedActivity->id,
            'issue' => 'Temuan aktivitas lain',
            'status' => Report::STATUS_OPEN,
        ]);

        $this->assertTrue($pic->can('close', $assignedReport));
        $this->assertFalse($pic->can('close', $otherReport));
        $this->assertFalse($pic->can('close', $unassignedActivityReport));
        $this->actingAs($pic)->post(route('reports.close', $otherReport))->assertForbidden();
    }

    public function test_report_category_cannot_be_closed_even_by_an_assigned_supervisor(): void
    {
        $this->seed(RoleSeeder::class);

        $author = User::factory()->create();
        $supervisor = User::factory()->create();
        $supervisor->assignRole('SUPERVISOR');
        $supervisor->givePermissionTo('reports.solve.own.area');
        $area = Area::create(['area' => 'Area Uji', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Sub Area Uji', 'max_personnel' => 1]);
        $subArea->supervisors()->attach($supervisor);
        $activity = Activity::create(['name' => 'Aktivitas Observasi', 'is_active' => true]);
        $activity->assignees()->attach($supervisor);
        $reportOnlySubActivity = Activity::create([
            'name' => 'Kondisi Baik',
            'parent_id' => $activity->id,
            'category' => 'REPORT',
            'is_active' => true,
        ]);
        $reportOnlySubActivity->assignees()->attach($supervisor);
        $report = Report::create([
            'author_id' => $author->id,
            'area_id' => $area->id,
            'sub_area_id' => $subArea->id,
            'activity_id' => $activity->id,
            'sub_activity_id' => $reportOnlySubActivity->id,
            'issue' => 'Area sudah bersih dan rapi',
            'status' => Report::STATUS_OPEN,
        ]);

        $this->assertFalse($supervisor->can('close', $report));
        $this->actingAs($supervisor)->post(route('reports.close', $report))->assertForbidden();
    }

    public function test_navigation_follows_page_permissions(): void
    {
        $this->seed(RoleSeeder::class);

        $user = User::factory()->create();
        $user->givePermissionTo(['settings.view', 'roles.view']);

        $this->actingAs($user)->get(route('settings.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/Index')
                ->has('navItems', 2)
                ->where('navItems.1.href', route('settings.index'))
                ->etc());
    }

    public function test_report_list_exposes_policy_decisions_for_its_buttons(): void
    {
        $this->seed(RoleSeeder::class);

        $user = User::factory()->create();
        $user->givePermissionTo(['reports.view.own', 'reports.edit.own']);
        $area = Area::create(['area' => 'Area Uji', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Aktivitas Uji', 'is_active' => true]);
        Report::create([
            'author_id' => $user->id,
            'area_id' => $area->id,
            'activity_id' => $activity->id,
            'issue' => 'Temuan uji',
            'status' => Report::STATUS_OPEN,
        ]);

        $this->actingAs($user)->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Index')
                ->where('reports.0.can.update', true)
                ->where('reports.0.can.delete', false)
                ->where('reports.0.can.close', false)
                ->etc());
    }
}
