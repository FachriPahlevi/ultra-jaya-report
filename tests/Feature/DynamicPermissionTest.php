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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DynamicPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_custom_role_can_be_reviewer_and_closer_and_receives_union_of_scopes(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create()->assignRole('ADMIN');
        $role = Role::create(['name' => 'OPERATIONS_LEAD']);
        $role->syncPermissions(['activities.view', 'reports.review.area', 'reports.solve.own.area', 'reports.create']);
        $lead = User::factory()->create()->assignRole($role);
        [$reviewArea, $reviewSubArea, $reviewActivity, $reviewChild] = $this->context('Review');
        [$closeArea, $closeSubArea, $closeActivity, $closeChild] = $this->context('Close');
        [$otherArea, $otherSubArea, $otherActivity, $otherChild] = $this->context('Other');
        $this->actingAs($admin)->putJson(route('activities.sub-activities.access-roles.update', [$reviewActivity, $reviewChild]), ['role_ids' => [$role->id]])->assertOk();
        $this->actingAs($admin)->putJson(route('activities.sub-activities.access-roles.update', [$closeActivity, $closeChild]), ['role_ids' => [$role->id]])->assertOk();
        $lead->supervisedSubAreas()->attach($closeSubArea);
        $reviewReport = $this->report($admin, $reviewSubArea, $reviewChild);
        $closeReport = $this->report($admin, $closeSubArea, $closeChild);
        $otherReport = $this->report($admin, $otherSubArea, $otherChild);
        $this->actingAs($lead)->get(route('reports.index'))->assertInertia(fn (Assert $page) => $page->has('reports', 2));
        $this->assertTrue($lead->can('view', $reviewReport));
        $this->assertTrue($lead->can('close', $closeReport));
        $this->assertFalse($lead->can('close', $reviewReport));
        $this->assertFalse($lead->can('view', $otherReport));
        $this->actingAs($lead)->post(route('reports.close', $closeReport), ['close_comment' => 'Selesai'])->assertRedirect();
        $this->assertSame('closed', $closeReport->fresh()->status);
        $role->revokePermissionTo('reports.solve.own.area');
        $lead = $lead->fresh();
        $newReport = $this->report($admin, $closeSubArea, $closeChild);
        $this->assertFalse($lead->can('close', $newReport));
        $this->actingAs($lead)->get(route('reports.index'))->assertInertia(fn (Assert $page) => $page->has('reports', 3));
    }

    public function test_manager_gains_create_and_global_close_through_settings_without_role_name_changes(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create()->assignRole('ADMIN');
        $manager = User::factory()->create()->assignRole('MANAGER');
        $role = Role::findByName('MANAGER');
        $this->actingAs($admin)->postJson(route('settings.roles.permissions', $role), [
            'permissions' => ['reports.create', 'reports.solve.all', 'reports.export'],
        ])->assertOk();
        [$area, $subArea, $activity, $child] = $this->context('Manager');
        $child->accessRoles()->attach($role);
        $otherReport = $this->report($admin, $subArea, $child);
        $this->actingAs($manager->fresh())->get(route('reports.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->has('reports', 1));
        $this->actingAs($manager)->postJson(route('reports.store'), [
            'type_activity' => $activity->id, 'sub_activity_id' => $child->id,
            'area_activity' => $area->id, 'sub_area_id' => $subArea->id, 'issue' => 'Temuan Manager',
        ])->assertRedirect();
        $this->actingAs($manager)->post(route('reports.close', $otherReport), ['close_comment' => 'Ditangani Manager'])->assertRedirect();
        $this->assertSame('closed', $otherReport->fresh()->status);
        $this->actingAs($manager)->get(route('reports.export', 'excel'))->assertOk();
    }

    public function test_custom_role_scope_fields_and_category_management_follow_permissions(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create()->assignRole('ADMIN');
        $role = Role::create(['name' => 'QUALITY_LEAD']);
        $role->syncPermissions(['reports.review.area', 'reports.solve.own.area', 'activities.view', 'activities.edit', 'activities.category.manage']);
        [$area, $subArea, $activity, $child] = $this->context('Quality');
        $payload = ['name' => 'Quality Lead', 'email' => 'quality@example.test', 'password' => 'password', 'role' => $role->name];
        $this->actingAs($admin)->postJson(route('settings.users.store'), $payload)->assertCreated();
        $quality = User::where('email', $payload['email'])->firstOrFail();
        $this->actingAs($admin)->putJson(route('areas.assignees.update', $area), ['user_ids' => [$quality->id]])->assertOk();
        $this->actingAs($admin)->putJson(route('areas.sub-areas.assignees.update', [$area, $subArea]), ['user_ids' => [$quality->id]])->assertOk();
        $this->assertTrue($quality->managedAreas()->whereKey($area->id)->exists());
        $this->assertTrue($quality->supervisedSubAreas()->whereKey($subArea->id)->exists());
        $this->actingAs($quality)->get(route('activities.index'))->assertInertia(fn (Assert $page) => $page->where('canManageActivityCategory', true)->has('roleOptions', 0));
        $this->actingAs($quality)->putJson(route('activities.sub-activities.update', [$activity, $child]), ['name' => $child->name, 'category' => 'REPORT'])->assertOk();
        $this->assertSame('REPORT', $child->fresh()->category);
        $this->actingAs($quality)->putJson(route('activities.sub-activities.access-roles.update', [$activity, $child]), ['role_ids' => [$role->id]])->assertForbidden();
    }

    public function test_area_access_and_assignment_management_do_not_bypass_permissions_by_role(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create()->assignRole('ADMIN');
        Role::findByName('ADMIN')->revokePermissionTo('areas.view.all');
        $admin = $admin->fresh();
        [$area, $subArea] = $this->context('Area');
        $this->actingAs($admin)->get(route('areas.index'))->assertInertia(fn (Assert $page) => $page->has('areas.data', 0));
        $admin->givePermissionTo('areas.view.all');
        $this->actingAs($admin)->get(route('areas.index'))->assertInertia(fn (Assert $page) => $page->has('areas.data', 1));
        $editor = User::factory()->create();
        $editor->givePermissionTo(['users.create', 'users.edit', 'settings.view']);
        $this->actingAs($editor)->postJson(route('settings.users.store'), [
            'name' => 'No assignment permission', 'email' => 'blocked@example.test', 'password' => 'password',
            'role' => 'SUPERVISOR', 'sub_area_ids' => [$subArea->id],
        ])->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'blocked@example.test']);
    }

    private function context(string $name): array
    {
        $area = Area::create(['area' => $name, 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => $name, 'is_active' => true, 'max_personnel' => 5]);
        $activity = Activity::create(['name' => $name, 'is_active' => true]);
        $child = $activity->children()->create(['name' => $name]);

        return [$area, $subArea, $activity, $child];
    }

    private function report(User $author, SubArea $subArea, SubActivity $child): Report
    {
        return Report::create(['author_id' => $author->id, 'area_id' => $subArea->area_id, 'sub_area_id' => $subArea->id,
            'sub_activity_id' => $child->id, 'issue' => 'Temuan', 'status' => 'open']);
    }
}
