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
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class PermissionSurfaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_requires_its_own_permission_and_cannot_expand_visible_data(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create()->assignRole('USER');
        $other = User::factory()->create()->assignRole('USER');
        [$area, $subArea, $activity, $child] = $this->context('Export');
        $own = $this->report($owner, $area, $subArea, $child, 'Visible own report');
        $this->report($other, $area, $subArea, $child, 'Private other report');
        $owner->syncRoles([]);
        $owner->syncPermissions(['reports.view.own']);
        $this->actingAs($owner)->get(route('reports.export', 'excel'))->assertForbidden();
        $owner->givePermissionTo('reports.export');
        $response = $this->actingAs($owner)->get(route('reports.export', 'excel'))->assertOk();
        $sheet = IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
        $this->assertSame(2, $sheet->getHighestRow());
        $this->assertSame($own->issue, $sheet->getCell('E2')->getValue());
        $response = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', 'author_ids' => [$other->id], 'my_reports_only' => 'false']))->assertOk();
        $this->assertSame(1, IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet()->getHighestRow());
        $this->actingAs($owner)->getJson(route('reports.export', ['type' => 'excel', 'area_ids' => 'invalid']))->assertUnprocessable();
    }

    public function test_excel_photos_fit_their_own_cells_and_report_category_has_report_status(): void
    {
        Storage::fake('public');
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create()->assignRole('SUPER_ADMIN');
        [$area, $subArea, $activity, $issue] = $this->context('Photo export');
        $reportActivity = $activity->children()->create(['name' => 'Observation', 'category' => 'REPORT']);
        $photo = file_get_contents(base_path('database/seeders/Testing/assets/assembly-line.jpg'));
        Storage::disk('public')->put('test/photos/before.jpg', $photo);
        Storage::disk('public')->put('test/photos/after.jpg', $photo);
        $ticket = $this->report($owner, $area, $subArea, $issue, 'Inspection finding');
        $ticket->update(['status' => 'closed', 'photo_before' => 'test/photos/before.jpg', 'photo_after' => 'test/photos/after.jpg']);
        $this->report($owner, $area, $subArea, $reportActivity, 'Routine inspection');

        $response = $this->actingAs($owner)->get(route('reports.export', 'excel'))->assertOk();
        $sheet = IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
        $this->assertEqualsCanonicalizing(['REPORT', 'CLOSED'], [$sheet->getCell('H2')->getValue(), $sheet->getCell('H3')->getValue()]);
        $photoRow = $sheet->getCell('H2')->getValue() === 'CLOSED' ? 2 : 3;
        $this->assertSame(120.0, $sheet->getRowDimension($photoRow)->getRowHeight());
        $drawings = iterator_to_array($sheet->getDrawingCollection());
        $this->assertCount(2, $drawings);
        $this->assertEqualsCanonicalizing(["F{$photoRow}", "G{$photoRow}"], array_map(fn ($drawing) => $drawing->getCoordinates(), $drawings));
        foreach ($drawings as $drawing) {
            $this->assertLessThanOrEqual(184, $drawing->getWidth());
            $this->assertLessThanOrEqual(144, $drawing->getHeight());
            $this->assertSame(8, $drawing->getOffsetX());
            $this->assertSame(8, $drawing->getOffsetY());
        }
        $reportOnly = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', 'status' => 'report']))->assertOk();
        $reportSheet = IOFactory::load($reportOnly->baseResponse->getFile()->getPathname())->getActiveSheet();
        $this->assertSame(2, $reportSheet->getHighestRow());
        $this->assertSame('REPORT', $reportSheet->getCell('H2')->getValue());
        $openOnly = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', 'status' => 'open']))->assertOk();
        $this->assertSame(1, IOFactory::load($openOnly->baseResponse->getFile()->getPathname())->getActiveSheet()->getHighestRow());
    }

    public function test_crafted_form_input_cannot_bypass_assigned_location_and_activity(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create()->assignRole('SUPERVISOR');
        [$area, $subArea, $activity, $child] = $this->context('Assigned');
        [$outside, $outsideSubArea, $outsideActivity, $outsideChild] = $this->context('Outside');
        $user->supervisedSubAreas()->attach($subArea);
        $user->assignedSubActivities()->attach($child);
        $payload = ['area_activity' => $outside->id, 'sub_area_id' => $outsideSubArea->id, 'type_activity' => $outsideActivity->id, 'sub_activity_id' => $outsideChild->id, 'issue' => 'Attempt'];
        $this->actingAs($user)->postJson(route('reports.store'), $payload)->assertUnprocessable()->assertJsonValidationErrors('sub_activity_id');
        $this->assertDatabaseCount('reports', 0);
        $this->actingAs($user)->postJson(route('reports.store'), [...$payload, 'area_activity' => $area->id, 'sub_area_id' => $subArea->id, 'type_activity' => $activity->id, 'sub_activity_id' => $child->id])->assertRedirect();
        $report = Report::firstOrFail();
        $this->actingAs($user)->putJson(route('reports.update', $report), $payload)->assertUnprocessable();
        $this->assertSame($subArea->id, $report->fresh()->sub_area_id);
    }

    public function test_read_only_metadata_and_direct_detail_routes_respect_scope(): void
    {
        $this->seed(RoleSeeder::class);
        $reviewer = User::factory()->create();
        $reviewer->givePermissionTo('reports.review.area');
        $author = User::factory()->create();
        [$area, $subArea, $activity, $child] = $this->context('Visible');
        [$outside, $outsideSubArea, $outsideActivity, $outsideChild] = $this->context('Hidden');
        $reviewer->assignedActivities()->attach($activity);
        $visible = $this->report($author, $area, $subArea, $child, 'Visible');
        $hidden = $this->report($author, $outside, $outsideSubArea, $outsideChild, 'Hidden');
        $this->actingAs($reviewer)->get(route('reports.index'))->assertInertia(fn (Assert $page) => $page
            ->has('reports', 1)->has('activities', 1)->has('areas', 1)->has('users', 0)
            ->where('reports.0.can.update', false)->where('reports.0.can.delete', false)->where('reports.0.can.close', false));
        $this->actingAs($reviewer)->get(route('reports.show', $visible))->assertRedirect(route('reports.index', ['selected_report' => $visible->id]));
        $this->actingAs($reviewer)->get(route('reports.show', $hidden))->assertForbidden();
        $this->actingAs($reviewer)->putJson(route('reports.update', $visible), ['issue' => 'Forbidden'])->assertForbidden();
        $this->actingAs($reviewer)->deleteJson(route('reports.destroy', $visible))->assertForbidden();
        $this->actingAs($reviewer)->postJson(route('reports.close', $visible), ['close_comment' => 'Forbidden'])->assertForbidden();
    }

    private function context(string $name): array
    {
        $area = Area::create(['area' => $name, 'is_active' => true]);
        $subArea = SubArea::create(['area_id' => $area->id, 'name' => $name, 'is_active' => true]);
        $activity = Activity::create(['name' => $name, 'is_active' => true]);
        $child = $activity->children()->create(['name' => $name]);

        return [$area, $subArea, $activity, $child];
    }

    private function report(User $author, Area $area, SubArea $subArea, SubActivity $child, string $issue): Report
    {
        return Report::create(['author_id' => $author->id, 'area_id' => $area->id, 'sub_area_id' => $subArea->id, 'sub_activity_id' => $child->id, 'issue' => $issue, 'status' => 'open']);
    }
}
