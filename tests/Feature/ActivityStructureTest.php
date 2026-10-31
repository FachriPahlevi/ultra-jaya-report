<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Area;
use App\Models\Report;
use App\Models\SubActivity;
use App\Models\SubArea;
use App\Models\User;
use Database\Seeders\ActivitySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ActivityStructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_and_sub_activity_have_distinct_storage_and_nested_crud(): void
    {
        $admin = $this->user('ADMIN');
        $this->assertFalse(Schema::hasColumn('activities', 'parent_id'));
        $this->assertFalse(Schema::hasColumn('activities', 'category'));
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);

        $this->actingAs($admin)->postJson(route('activities.sub-activities.store', $activity), [
            'sub_activities' => [
                ['name' => 'Observation'],
                ['name' => 'Inspection'],
            ],
        ])->assertOk();
        $child = $activity->children()->where('name', 'Observation')->firstOrFail();
        $this->assertSame('ISSUE', $child->category);
        $this->assertDatabaseCount('activities', 1);
        $this->assertDatabaseCount('sub_activities', 2);

        $this->actingAs($admin)->putJson(route('activities.sub-activities.update', [$activity, $child]), [
            'name' => 'Updated observation', 'description' => 'Updated',
        ])->assertOk();
        $this->assertSame('Updated observation', $child->fresh()->name);
        $other = Activity::create(['name' => 'Other', 'is_active' => true]);
        $this->actingAs($admin)->putJson(route('activities.sub-activities.update', [$other, $child]), ['name' => 'Wrong owner'])->assertNotFound();
        $this->actingAs($admin)->delete(route('activities.destroy', $activity))->assertSessionHasErrors('activity');
        $this->actingAs($admin)->delete(route('activities.sub-activities.destroy', [$activity, $child]))->assertRedirect();
        $this->assertSoftDeleted($child);
    }

    public function test_sub_activity_roles_require_permission_and_reject_duplicates(): void
    {
        $editor = $this->user('USER');
        $editor->givePermissionTo(['activities.view', 'activities.edit']);
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Observation']);
        $managers = [$this->user('MANAGER'), $this->user('MANAGER')];
        $supervisors = [$this->user('SUPERVISOR'), $this->user('SUPERVISOR')];
        $roleIds = [$managers[0]->roles->first()->id, $supervisors[0]->roles->first()->id];
        $url = route('activities.sub-activities.access-roles.update', [$activity, $child]);
        $this->actingAs($editor)->putJson($url, ['role_ids' => $roleIds])->assertForbidden();
        $editor->givePermissionTo('permissions.manage');
        $this->actingAs($editor)->putJson($url, ['role_ids' => $roleIds])->assertOk();
        $this->assertDatabaseCount('sub_activity_role', 2);
        $this->actingAs($editor)->putJson($url, ['role_ids' => [$roleIds[0], $roleIds[0]]])->assertUnprocessable();
        $this->actingAs($editor)->get(route('activities.index'))->assertInertia(fn (Assert $page) => $page->has('activities.data.0.children.0.access_roles', 2));
    }

    public function test_only_super_admin_sets_category_and_parent_status_controls_report_choices(): void
    {
        $admin = $this->user('ADMIN');
        $superAdmin = $this->user('SUPER_ADMIN');
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Observation']);
        $url = route('activities.sub-activities.update', [$activity, $child]);
        $this->actingAs($admin)->putJson($url, ['name' => 'Observation', 'category' => 'REPORT'])->assertOk();
        $this->assertSame('ISSUE', $child->fresh()->category);
        $this->actingAs($superAdmin)->putJson($url, ['name' => 'Observation', 'category' => 'REPORT'])->assertOk();
        $this->assertSame('REPORT', $child->fresh()->category);
        $this->actingAs($superAdmin)->putJson($url, ['name' => 'Observation', 'category' => null])->assertUnprocessable();
        $this->actingAs($superAdmin)->putJson(route('activities.update', $activity), ['name' => 'Safety', 'category' => 'ISSUE'])->assertUnprocessable();
        $this->actingAs($superAdmin)->patchJson(route('activities.status', $activity), ['is_active' => false])->assertOk();
        $this->actingAs($superAdmin)->get(route('reports.index'))->assertInertia(fn (Assert $page) => $page->has('activities', 0));
    }

    public function test_reports_require_matching_sub_activity_and_keep_their_category_snapshot(): void
    {
        $user = $this->user('SUPER_ADMIN');
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Safety', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Observation', 'category' => 'REPORT']);
        $child->accessRoles()->attach($user->roles->modelKeys());
        $payload = ['type_activity' => $activity->id, 'area_activity' => $area->id, 'sub_area_id' => $subArea->id, 'issue' => 'Bersih'];
        $this->actingAs($user)->postJson(route('reports.store'), $payload)->assertUnprocessable()->assertJsonValidationErrors('sub_activity_id');
        $other = Activity::create(['name' => 'Other', 'is_active' => true]);
        $this->actingAs($user)->postJson(route('reports.store'), [...$payload, 'type_activity' => $other->id, 'sub_activity_id' => $child->id])->assertUnprocessable();
        $this->actingAs($user)->postJson(route('reports.store'), [...$payload, 'sub_activity_id' => $child->id, 'category_snapshot' => 'ISSUE'])->assertRedirect();
        $report = Report::firstOrFail();
        $this->assertSame('REPORT', $report->category_snapshot);
        $child->update(['category' => 'ISSUE']);
        $this->actingAs($user)->putJson(route('reports.update', $report), ['issue' => 'Masih bersih', 'category_snapshot' => 'ISSUE'])->assertRedirect();
        $this->assertSame('REPORT', $report->fresh()->category_snapshot);
        $this->assertFalse($user->can('close', $report->fresh()));
        $this->actingAs($user)->putJson(route('reports.update', $report), ['type_activity' => $other->id])->assertUnprocessable();
        $this->actingAs($user)->delete(route('activities.sub-activities.destroy', [$activity, $child]))->assertSessionHasErrors('activity');
    }

    public function test_activity_seeder_is_repeatable_without_removing_existing_records(): void
    {
        $custom = Activity::create(['name' => 'Custom activity', 'is_active' => true]);
        $this->seed(ActivitySeeder::class);
        $count = SubActivity::count();
        $this->seed(ActivitySeeder::class);
        $this->assertSame($count, SubActivity::count());
        $this->assertModelExists($custom);
    }

    private function user(string $role): User
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }
}
