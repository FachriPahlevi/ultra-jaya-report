<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubActivity;
use App\Models\SubArea;
use App\Models\User;
use App\Services\ReportCapabilities;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AreaAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_multiple_assignees_and_assignment_permissions_are_enforced(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create();
        $admin->givePermissionTo(['areas.view', 'areas.view.all', 'users.assign.area']);
        $viewer = User::factory()->create();
        $viewer->givePermissionTo('areas.view');
        $scopedAssigner = User::factory()->create();
        $scopedAssigner->givePermissionTo(['areas.view', 'users.assign.area']);
        $manager = User::factory()->create();
        $manager->givePermissionTo('reports.review.area');
        $supervisor = User::factory()->create();
        $supervisor->givePermissionTo('reports.solve.own.area');
        $otherSupervisor = User::factory()->create();
        $otherSupervisor->givePermissionTo('reports.solve.own.area');
        $area = Area::create(['area' => 'Test Area', 'is_active' => true]);
        $otherArea = Area::create(['area' => 'Other Area', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Test Sub-area', 'max_personnel' => 1, 'is_active' => true]);

        $this->actingAs($viewer)->putJson(route('areas.assignees.update', $area), ['user_ids' => [$manager->id]])->assertForbidden();
        $this->actingAs($scopedAssigner)->putJson(route('areas.assignees.update', $area), ['user_ids' => [$manager->id]])->assertForbidden();
        $this->actingAs($admin)->putJson(route('areas.assignees.update', $area), ['user_ids' => [$manager->id]])->assertOk();
        $this->assertTrue($area->managers()->whereKey($manager->id)->exists());
        $this->actingAs($admin)->putJson(route('areas.assignees.update', $area), ['user_ids' => [$supervisor->id]])->assertUnprocessable();
        $this->actingAs($admin)->putJson(route('areas.sub-areas.assignees.update', [$otherArea, $subArea]), ['user_ids' => [$supervisor->id]])->assertNotFound();
        $this->actingAs($admin)->putJson(route('areas.sub-areas.assignees.update', [$area, $subArea]), ['user_ids' => [$supervisor->id]])->assertOk();
        $this->actingAs($admin)->putJson(route('areas.sub-areas.assignees.update', [$area, $subArea]), ['user_ids' => [$supervisor->id, $otherSupervisor->id]])->assertOk();
        $this->assertEqualsCanonicalizing([$supervisor->id, $otherSupervisor->id], $subArea->supervisors()->pluck('users.id')->all());
        $admin->givePermissionTo('areas.edit');
        $this->actingAs($admin)->putJson(route('areas.sub-areas.update', [$area, $subArea]), ['name' => 'Updated sub-area', 'max_personnel' => 1])->assertOk();
        $this->actingAs($admin)->putJson(route('areas.sub-areas.assignees.update', [$area, $subArea]), ['user_ids' => []])->assertOk();
        $this->assertSame(0, $subArea->supervisors()->count());
    }

    public function test_assigned_supervisor_can_create_and_close_only_matching_issue(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create();
        $admin->givePermissionTo(['areas.view', 'areas.view.all', 'users.assign.area']);
        $supervisor = User::factory()->create();
        $supervisor->assignRole('SUPERVISOR');
        $otherSupervisor = User::factory()->create()->assignRole('SUPERVISOR');
        $area = Area::create(['area' => 'Test Area', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Test Sub-area', 'max_personnel' => 1, 'is_active' => true]);
        $activity = Activity::create(['name' => 'Test Activity', 'is_active' => true]);
        $subActivity = SubActivity::create(['activity_id' => $activity->id, 'name' => 'Test Sub-activity', 'category' => 'ISSUE']);
        $subActivity->supervisors()->attach([$supervisor->id, $otherSupervisor->id]);
        $this->actingAs($admin)->putJson(route('areas.sub-areas.assignees.update', [$area, $subArea]), ['user_ids' => [$supervisor->id, $otherSupervisor->id]])->assertOk();
        $this->actingAs($supervisor)->post(route('reports.store'), [
            'area_activity' => $area->id, 'sub_area_id' => $subArea->id,
            'type_activity' => $activity->id, 'sub_activity_id' => $subActivity->id, 'issue' => 'A finding',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $report = Report::firstOrFail();
        $this->assertTrue($supervisor->can('close', $report));
        $this->assertTrue((new ReportCapabilities($otherSupervisor->fresh()))->close($report));
        $subActivity->supervisors()->detach($supervisor);
        $this->assertFalse((new ReportCapabilities($supervisor->fresh()))->close($report));
        $this->actingAs($supervisor->fresh())->post(route('reports.close', $report), ['close_comment' => 'Resolved'])->assertForbidden();
        $subActivity->supervisors()->attach($supervisor);
        $this->actingAs($supervisor->fresh())->post(route('reports.close', $report), ['close_comment' => 'Resolved'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(Report::STATUS_CLOSED, $report->fresh()->status);
    }
}
