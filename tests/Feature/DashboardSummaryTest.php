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
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_recent_tickets_include_up_to_twenty_visible_reports(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create()->assignRole('USER');
        $other = User::factory()->create();
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $location = SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Activity', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Issue', 'category' => 'ISSUE']);

        foreach (range(1, 25) as $index) {
            Report::create(['author_id' => $user->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => "Visible {$index}", 'status' => 'open']);
        }
        Report::create(['author_id' => $other->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => 'Hidden', 'status' => 'open']);

        $this->actingAs($user)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 25)
            ->has('recentReports', 20)
            ->where('recentReports', fn ($reports) => collect($reports)->every(fn ($report) => $report['issue'] !== 'Hidden' && $report['activity'] === 'Issue')));
    }

    public function test_counts_distinguish_reports_from_issues_and_respect_visibility_and_period(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create()->assignRole('USER');
        $other = User::factory()->create();
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $location = SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Activity', 'is_active' => true]);
        $issue = $activity->children()->create(['name' => 'Issue', 'category' => 'ISSUE']);
        $report = $activity->children()->create(['name' => 'Report', 'category' => 'REPORT']);
        $make = fn ($author, $child, $status) => Report::create(['author_id' => $author->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => 'Finding', 'status' => $status]);
        $make($user, $issue, 'open');
        $closed = $make($user, $issue, 'closed');
        $closed->update(['closed_by' => $user->id]);
        $make($user, $report, 'open');
        $make($other, $issue, 'open');

        $this->actingAs($user)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 3)->where('stats.reports', 1)->where('stats.open', 1)->where('stats.closed', 1)
            ->where('attentionCanClose', false)->has('attentionTickets', 1)
            ->has('analytics.areas', 1)->where('analytics.areas.0.total', 3)
            ->has('analytics.activities', 1)->where('analytics.activities.0.total', 3)
            ->has('analytics.subActivities', 2)->where('analytics.subActivities.0.total', 2)
            ->has('analytics.closers', 1)->where('analytics.closers.0.id', $user->id)->where('analytics.closers.0.total', 1)
            ->where('analytics.dailyTrend', fn ($trend) => collect($trend)->sum('total') === 3)
            ->where('recentReports', fn ($reports) => collect($reports)->contains(fn ($item) => $item['category'] === 'REPORT')));
        $this->actingAs($user)->get(route('dashboard', ['period' => 'custom', 'date_from' => '2000-01-01', 'date_to' => '2000-01-02']))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 0)->has('attentionTickets', 0)->has('recentReports', 0)->has('analytics.areas', 0)->has('analytics.closers', 0)
            ->has('analytics.dailyTrend', 2)->where('analytics.dailyTrend.0.total', 0));
    }

    public function test_close_queue_requires_both_sub_area_and_sub_activity_assignments(): void
    {
        $this->seed(RoleSeeder::class);
        $closer = User::factory()->create();
        $closer->givePermissionTo('reports.solve.own.area');
        $author = User::factory()->create();
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $location = SubArea::create(['area_id' => $area->id, 'name' => 'Assigned', 'is_active' => true]);
        $activity = Activity::create(['name' => 'Activity', 'is_active' => true]);
        $assigned = $activity->children()->create(['name' => 'Assigned', 'category' => 'ISSUE']);
        $unassigned = $activity->children()->create(['name' => 'Other', 'category' => 'ISSUE']);
        $observation = $activity->children()->create(['name' => 'Observation', 'category' => 'REPORT']);
        $closer->supervisedSubAreas()->attach($location);
        $closer->assignedSubActivities()->attach($assigned);
        foreach ([$assigned, $unassigned, $observation] as $child) {
            Report::create(['author_id' => $author->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => $child->name, 'status' => 'open']);
        }

        $this->actingAs($closer)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 3)->where('stats.open', 2)->where('stats.reports', 1)
            ->where('attentionCanClose', true)->has('attentionTickets', 1)->where('attentionTickets.0.issue', 'Assigned'));
    }

    public function test_review_and_global_permissions_drive_dashboard_scope_without_role_names(): void
    {
        $this->seed(RoleSeeder::class);
        $reviewer = User::factory()->create();
        $reviewer->givePermissionTo('reports.review.area');
        $globalCloser = User::factory()->create();
        $globalCloser->givePermissionTo('reports.solve.all');
        $author = User::factory()->create();
        $area = Area::create(['area' => 'Area', 'is_active' => true]);
        $location = SubArea::create(['area_id' => $area->id, 'name' => 'Sub-area', 'is_active' => true]);
        $assigned = Activity::create(['name' => 'Assigned', 'is_active' => true]);
        $outside = Activity::create(['name' => 'Other', 'is_active' => true]);
        $reviewer->assignedActivities()->attach($assigned);
        foreach ([$assigned, $outside] as $activity) {
            $child = $activity->children()->create(['name' => $activity->name, 'category' => 'ISSUE']);
            Report::create(['author_id' => $author->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => $activity->name, 'status' => 'open']);
        }

        $this->actingAs($reviewer)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 1)->where('attentionCanClose', false)->has('attentionTickets', 1)->where('attentionTickets.0.issue', 'Assigned')
            ->has('analytics.activities', 1)->where('analytics.activities.0.name', 'Assigned'));
        $this->actingAs($globalCloser)->get(route('dashboard', ['period' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 2)->where('attentionCanClose', true)->has('attentionTickets', 2)->has('analytics.activities', 2));
    }

    public function test_analytics_follow_area_filter_and_exclude_hidden_reports(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create()->assignRole('USER');
        $other = User::factory()->create();
        $activity = Activity::create(['name' => 'Activity', 'is_active' => true]);
        $child = $activity->children()->create(['name' => 'Check', 'category' => 'ISSUE']);
        $areas = [];
        foreach (['First', 'Second'] as $name) {
            $area = Area::create(['area' => $name, 'is_active' => true]);
            $location = SubArea::create(['area_id' => $area->id, 'name' => $name, 'is_active' => true]);
            $areas[] = $area;
            foreach ([$user, $other] as $author) {
                Report::create(['author_id' => $author->id, 'area_id' => $area->id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id, 'issue' => 'Finding', 'status' => 'open']);
            }
        }

        $this->actingAs($user)->get(route('dashboard', ['period' => 'all', 'area_id' => $areas[1]->id]))->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 1)->has('analytics.areas', 1)->where('analytics.areas.0.name', 'Second')
            ->where('analytics.areas.0.total', 1)->where('analytics.activities.0.total', 1));
    }
}
