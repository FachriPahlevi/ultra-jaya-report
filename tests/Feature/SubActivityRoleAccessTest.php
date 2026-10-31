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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubActivityRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_matrix_requires_permission_and_does_not_activate_automatically(): void
    {
        $this->seed(RoleSeeder::class);
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);
        $sub = $activity->children()->create(['name' => 'Unsafe action']);
        $admin = User::factory()->create()->assignRole('ADMIN');
        $user = User::factory()->create()->assignRole('USER');
        $role = Role::findByName('USER');
        $url = route('activities.sub-activities.access-roles.update', [$activity, $sub]);
        $this->actingAs($user)->putJson($url, ['role_ids' => [$role->id]])->assertForbidden();
        $this->actingAs($admin)->putJson($url, ['role_ids' => [$role->id]])->assertOk();
        $this->assertDatabaseHas('sub_activity_role', ['sub_activity_id' => $sub->id, 'role_id' => $role->id]);
        $this->assertFalse((bool) config('activity_access.role_based'));
        $this->actingAs($admin)->putJson($url, ['role_ids' => [999999]])->assertUnprocessable();
    }

    public function test_role_access_controls_creation_manager_review_and_closing_while_own_reports_remain_visible(): void
    {
        $this->seed(RoleSeeder::class);
        config(['activity_access.role_based' => true]);
        $author = User::factory()->create()->assignRole('USER');
        $manager = User::factory()->create()->assignRole('MANAGER');
        $supervisor = User::factory()->create()->assignRole('SUPERVISOR');
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Gym', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);
        $sub = $activity->children()->create(['name' => 'Unsafe action', 'category' => 'ISSUE']);
        $sub->accessRoles()->sync(Role::whereIn('name', ['USER', 'MANAGER', 'SUPERVISOR'])->pluck('id'));
        $subArea->supervisors()->attach($supervisor);
        $payload = ['area_activity' => $area->id, 'sub_area_id' => $subArea->id, 'type_activity' => $activity->id, 'sub_activity_id' => $sub->id, 'issue' => 'Test finding'];
        $this->actingAs($author)->post(route('reports.store'), $payload)->assertRedirect()->assertSessionHasNoErrors();
        $report = Report::firstOrFail();
        $this->assertTrue(Report::visibleTo($manager)->whereKey($report)->exists());
        $this->assertTrue((new ReportCapabilities($manager))->view($report));
        $this->assertTrue((new ReportCapabilities($supervisor))->close($report));
        $this->actingAs($supervisor)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page->has('attentionTickets', 1));
        $subArea->supervisors()->detach($supervisor);
        $this->assertFalse((new ReportCapabilities($supervisor->fresh()))->close($report));
        $subArea->supervisors()->attach($supervisor);
        $report->status = Report::STATUS_CLOSED;
        $this->assertFalse((new ReportCapabilities($supervisor->fresh()))->close($report));
        $report->status = Report::STATUS_OPEN;
        $sub->accessRoles()->detach(Role::findByName('MANAGER'));
        $this->assertFalse(Report::visibleTo($manager)->whereKey($report)->exists());
        $this->assertFalse((new ReportCapabilities($manager))->view($report));
        $sub->accessRoles()->detach(Role::findByName('SUPERVISOR'));
        $this->assertFalse((new ReportCapabilities($supervisor))->close($report));
        $this->actingAs($supervisor)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page->has('attentionTickets', 0));
        $sub->accessRoles()->detach(Role::findByName('USER'));
        $this->assertTrue(Report::visibleTo($author)->whereKey($report)->exists());
        $this->actingAs($author)->post(route('reports.store'), $payload)->assertSessionHasErrors('sub_activity_id');
    }

    public function test_custom_role_access_is_dynamic_and_requires_review_permission(): void
    {
        $this->seed(RoleSeeder::class);
        config(['activity_access.role_based' => true]);
        $role = Role::create(['name' => 'COORDINATOR', 'guard_name' => 'web']);
        $user = User::factory()->create()->assignRole($role);
        $author = User::factory()->create();
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Gym', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);
        $sub = $activity->children()->create(['name' => 'Inspection']);
        $sub->accessRoles()->attach($role);
        $report = Report::create(['author_id' => $author->id, 'area_id' => $area->id, 'sub_area_id' => $subArea->id, 'sub_activity_id' => $sub->id, 'issue' => 'Finding', 'status' => 'open']);
        $this->assertFalse(Report::visibleTo($user)->whereKey($report)->exists());
        $role->givePermissionTo('reports.review.area');
        $this->assertTrue(Report::visibleTo($user->fresh())->whereKey($report)->exists());
        $sub->accessRoles()->detach($role);
        $this->assertFalse(Report::visibleTo($user->fresh())->whereKey($report)->exists());
    }
}
