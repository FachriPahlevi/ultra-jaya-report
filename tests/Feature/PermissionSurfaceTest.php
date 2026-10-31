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
        $this->assertSame($own->issue, $sheet->getCell('I2')->getValue());
        $response = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', 'author_ids' => [$other->id], 'my_reports_only' => 'false']))->assertOk();
        $this->assertSame(1, IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet()->getHighestRow());
        $this->actingAs($owner)->getJson(route('reports.export', ['type' => 'excel', 'area_ids' => 'invalid']))->assertUnprocessable();
    }

    public function test_pdf_export_is_split_into_safe_batches_without_a_report_limit(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create()->assignRole('SUPER_ADMIN');
        [$area, $subArea, $activity, $issue] = $this->context('PDF limit');
        foreach (range(1, 101) as $index) {
            $this->report($owner, $area, $subArea, $issue, "Report {$index}");
        }
        $first = $this->actingAs($owner)->get(route('reports.export', ['type' => 'pdf', 'batch' => 1]))->assertOk()
            ->assertHeader('X-Export-Batch', '1')
            ->assertHeader('X-Export-Total-Batches', '2')
            ->assertHeader('X-Export-Total-Reports', '101');
        $this->assertStringStartsWith('%PDF-', $first->getContent());

        $second = $this->actingAs($owner)->get(route('reports.export', ['type' => 'pdf', 'batch' => 2]))->assertOk()
            ->assertHeader('X-Export-Batch', '2');
        $this->assertStringStartsWith('%PDF-', $second->getContent());
        $this->actingAs($owner)->getJson(route('reports.export', ['type' => 'pdf', 'batch' => 3]))
            ->assertUnprocessable()->assertJsonValidationErrors('batch');
    }

    public function test_export_filters_type_and_issue_status_within_the_users_scope(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create()->assignRole('USER');
        $owner->givePermissionTo('reports.export');
        $other = User::factory()->create()->assignRole('USER');
        [$area, $subArea, $activity, $issue] = $this->context('Export types');
        $observation = $activity->children()->create(['name' => 'Observation', 'category' => 'REPORT']);
        $this->report($owner, $area, $subArea, $issue, 'Open issue');
        $this->report($owner, $area, $subArea, $issue, 'Closed issue')->update(['status' => 'closed']);
        $this->report($owner, $area, $subArea, $observation, 'Report observation');
        $this->report($other, $area, $subArea, $issue, 'Hidden issue');

        foreach ([
            [['category' => 'ISSUE'], ['Open issue', 'Closed issue']],
            [['category' => 'ISSUE', 'status' => 'open'], ['Open issue']],
            [['category' => 'ISSUE', 'status' => 'closed'], ['Closed issue']],
            [['category' => 'REPORT'], ['Report observation']],
            [[], ['Open issue', 'Closed issue', 'Report observation']],
        ] as [$filters, $expected]) {
            $response = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', ...$filters]))->assertOk();
            $sheet = IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
            $issues = [];
            for ($row = 2; $row <= $sheet->getHighestRow(); $row++) {
                $issues[] = $sheet->getCell("I{$row}")->getValue();
            }
            $this->assertEqualsCanonicalizing($expected, $issues);
        }
        $this->actingAs($owner)->getJson(route('reports.export', ['type' => 'excel', 'category' => 'REPORT', 'status' => 'closed']))
            ->assertUnprocessable()->assertJsonValidationErrors('category');
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
        $ticket->update([
            'status' => 'closed',
            'activity' => 'Inspection performed during the morning shift.',
            'photo_before' => 'test/photos/before.jpg',
            'photo_after' => 'test/photos/after.jpg',
            'closed_at' => now(),
            'closed_by' => $owner->id,
            'close_comment' => 'The affected area was cleaned and verified.',
        ]);
        $this->report($owner, $area, $subArea, $reportActivity, 'Routine inspection');

        $response = $this->actingAs($owner)->get(route('reports.export', 'excel'))->assertOk();
        $sheet = IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
        $this->assertEqualsCanonicalizing(['REPORT', 'CLOSED'], [$sheet->getCell('M2')->getValue(), $sheet->getCell('M3')->getValue()]);
        $photoRow = $sheet->getCell('M2')->getValue() === 'CLOSED' ? 2 : 3;
        $this->assertSame($owner->name, $sheet->getCell("B{$photoRow}")->getValue());
        $this->assertSame('SUPER_ADMIN', $sheet->getCell("C{$photoRow}")->getValue());
        $this->assertSame($area->area, $sheet->getCell("D{$photoRow}")->getValue());
        $this->assertSame($subArea->name, $sheet->getCell("E{$photoRow}")->getValue());
        $this->assertSame($activity->name, $sheet->getCell("F{$photoRow}")->getValue());
        $this->assertSame($issue->name, $sheet->getCell("G{$photoRow}")->getValue());
        $this->assertSame('ISSUE', $sheet->getCell("H{$photoRow}")->getValue());
        $this->assertSame('Inspection finding', $sheet->getCell("I{$photoRow}")->getValue());
        $this->assertSame('Inspection performed during the morning shift.', $sheet->getCell("J{$photoRow}")->getValue());
        $this->assertSame($owner->name, $sheet->getCell("P{$photoRow}")->getValue());
        $this->assertSame('SUPER_ADMIN', $sheet->getCell("Q{$photoRow}")->getValue());
        $this->assertSame('The affected area was cleaned and verified.', $sheet->getCell("R{$photoRow}")->getValue());
        $this->assertSame(165.0, $sheet->getRowDimension($photoRow)->getRowHeight());
        $drawings = iterator_to_array($sheet->getDrawingCollection());
        $this->assertCount(2, $drawings);
        $archive = new \ZipArchive;
        $this->assertTrue($archive->open($response->baseResponse->getFile()->getPathname()));
        $embeddedPhotos = 0;
        for ($index = 0; $index < $archive->numFiles; $index++) {
            if (str_starts_with($archive->getNameIndex($index), 'xl/media/')) {
                $embeddedPhotos++;
            }
        }
        $archive->close();
        $this->assertSame(2, $embeddedPhotos);
        $this->assertEqualsCanonicalizing(["K{$photoRow}", "L{$photoRow}"], array_map(fn ($drawing) => $drawing->getCoordinates(), $drawings));
        foreach ($drawings as $drawing) {
            $this->assertLessThanOrEqual(250, $drawing->getWidth());
            $this->assertLessThanOrEqual(200, $drawing->getHeight());
            $this->assertSame(8, $drawing->getOffsetX());
            $this->assertSame(8, $drawing->getOffsetY());
        }
        $pdfHtml = view('exports.reports', [
            'reports' => collect([$ticket->fresh()->load(['author.roles', 'area', 'subArea', 'activityType', 'subActivity', 'closer.roles'])]),
            'photos' => [],
        ])->render();
        foreach ([$owner->name, $area->area, $subArea->name, $activity->name, $issue->name, 'Inspection finding', 'Inspection performed during the morning shift.', 'The affected area was cleaned and verified.'] as $detail) {
            $this->assertStringContainsString($detail, $pdfHtml);
        }
        $this->assertStringContainsString('margin: 28pt 28pt 34pt', $pdfHtml);
        $this->assertStringContainsString('.report-page-break', $pdfHtml);
        $pdf = $this->actingAs($owner)->get(route('reports.export', ['type' => 'pdf', 'batch' => 1]))->assertOk();
        $this->assertStringStartsWith('%PDF-', $pdf->getContent());
        $reportOnly = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', 'status' => 'report']))->assertOk();
        $reportSheet = IOFactory::load($reportOnly->baseResponse->getFile()->getPathname())->getActiveSheet();
        $this->assertSame(2, $reportSheet->getHighestRow());
        $this->assertSame('REPORT', $reportSheet->getCell('M2')->getValue());
        $openOnly = $this->actingAs($owner)->get(route('reports.export', ['type' => 'excel', 'status' => 'open']))->assertOk();
        $this->assertSame(1, IOFactory::load($openOnly->baseResponse->getFile()->getPathname())->getActiveSheet()->getHighestRow());
    }

    public function test_crafted_form_input_cannot_bypass_sub_activity_role_scope(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create()->assignRole('SUPERVISOR');
        [$area, $subArea, $activity, $child] = $this->context('Assigned');
        [$outside, $outsideSubArea, $outsideActivity, $outsideChild] = $this->context('Outside');
        $user->supervisedSubAreas()->attach($subArea);
        $child->accessRoles()->attach($user->roles->modelKeys());
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
        $reviewer->assignRole('MANAGER');
        $child->accessRoles()->attach($reviewer->roles->modelKeys());
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
