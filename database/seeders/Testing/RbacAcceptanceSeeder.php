<?php

declare(strict_types=1);

namespace Database\Seeders\Testing;

use App\Models\Report;
use App\Models\SubActivity;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class RbacAcceptanceSeeder extends Seeder
{
    public int $reportsPerUser = 30;

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Seeder pengujian laporan diblokir di luar local/testing.');
        }
        if ($this->reportsPerUser < 30 || $this->reportsPerUser > 365) {
            throw new RuntimeException('Jumlah laporan uji minimal 30 dan maksimal 365 per pengguna.');
        }

        $users = User::with(['roles.permissions', 'permissions', 'managedAreas', 'supervisedSubAreas', 'assignedActivities', 'assignedSubActivities'])->orderBy('id')->get();
        $subAreas = SubArea::where('is_active', true)->whereHas('area', fn ($query) => $query->where('is_active', true))->orderBy('id')->get();
        $children = SubActivity::whereHas('activity', fn ($query) => $query->where('is_active', true)->whereNull('deleted_at'))->orderBy('id')->get();
        if ($users->isEmpty() || $subAreas->isEmpty() || $children->isEmpty()) {
            throw new RuntimeException('Siapkan pengguna, Area/Sub-area aktif, dan Aktivitas/Sub-aktivitas terlebih dahulu. Seeder laporan tidak membuat atau mengubah data master.');
        }

        $issueChildren = $children->where('category', 'ISSUE')->values();
        $scenarios = [];
        $unassigned = [];
        DB::transaction(function () use ($users, $subAreas, $issueChildren, &$scenarios, &$unassigned): void {
            foreach ($users->filter(fn (User $user) => $user->is_active && $user->can('reports.solve.own.area')) as $supervisor) {
                $reporter = $users->first(fn (User $user) => $user->id !== $supervisor->id);
                if (! $reporter || $issueChildren->isEmpty()) {
                    $unassigned[] = $supervisor->name;

                    continue;
                }
                $location = $subAreas->first(fn (SubArea $area) => $supervisor->supervisedSubAreas->contains('id', $area->id));
                if (! $location) {
                    $location = $subAreas->get($supervisor->id % $subAreas->count());
                    $location->supervisors()->syncWithoutDetaching([$supervisor->id]);
                }
                if (! $location) {
                    $unassigned[] = $supervisor->name;

                    continue;
                }
                $child = $issueChildren->first(fn (SubActivity $item) => $supervisor->assignedSubActivities->contains('id', $item->id)) ?? $issueChildren->get($supervisor->id % $issueChildren->count());
                $supervisor->assignedSubActivities()->syncWithoutDetaching([$child->id]);
                $supervisor->load('supervisedSubAreas', 'assignedSubActivities');
                $scenarios[$reporter->id][] = ['location' => $location, 'child' => $child];
            }
        });

        $reviewScenarios = [];
        $reviewersWithoutReporter = [];
        DB::transaction(function () use ($users, $subAreas, $children, &$reviewScenarios, &$reviewersWithoutReporter): void {
            $activities = $children->pluck('activity_id')->unique()->values();
            foreach ($users->filter(fn (User $user) => $user->is_active && $user->hasRole('MANAGER') && $user->can('reports.review.area')) as $index => $manager) {
                $location = $subAreas->first(fn (SubArea $item) => $manager->managedAreas->contains('id', $item->area_id)) ?? $subAreas->get($index % $subAreas->count());
                $activityId = $activities->first(fn ($id) => $manager->assignedActivities->contains('id', $id)) ?? $activities->get($index % $activities->count());
                $child = $children->first(fn (SubActivity $item) => $item->activity_id === $activityId);
                $manager->managedAreas()->syncWithoutDetaching([$location->area_id]);
                $manager->assignedActivities()->syncWithoutDetaching([$activityId]);

                $reporter = $users->first(fn (User $user) => $user->id !== $manager->id);
                if (! $reporter) {
                    $reviewersWithoutReporter[] = $manager->name;

                    continue;
                }
                $reviewScenarios[$reporter->id][] = ['location' => $location, 'child' => $child];
            }
        });

        $globalCloser = $users->first(fn (User $user) => $user->is_active && $user->can('reports.solve.all'));
        $scopedClosers = [];
        foreach ($users as $user) {
            if ($user->is_active && $user->can('reports.solve.own.area')) {
                foreach ($user->supervisedSubAreas as $location) {
                    foreach ($user->assignedSubActivities as $child) {
                        $scopedClosers[$location->id.':'.$child->id] ??= $user->id;
                    }
                }
            }
        }
        $photos = $this->samplePhotos();
        $manifestPath = 'testing/report-fixtures-'.hash('sha256', json_encode(config('database.connections.'.config('database.default')))).'.json';
        $disk = Storage::disk('local');
        $manifest = $disk->exists($manifestPath) ? json_decode($disk->get($manifestPath), true, 512, JSON_THROW_ON_ERROR) : [];
        $total = max($users->count() * $this->reportsPerUser, $subAreas->count(), $children->count());
        $extra = $total - $users->count() * $this->reportsPerUser;
        DB::transaction(function () use ($users, $subAreas, $children, $globalCloser, $scopedClosers, $photos, $manifest, $manifestPath, $disk, $extra, $scenarios, $reviewScenarios): void {
            $ordinal = 0;
            foreach ($users as $userIndex => $user) {
                $fixtures = [];
                foreach (Report::withTrashed()->where('author_id', $user->id)->get() as $existing) {
                    foreach ($manifest[$user->id] ?? [] as $number => $entry) {
                        if ($existing->id === $entry['id'] && hash('sha256', $existing->issue.'|'.$existing->created_at) === $entry['fingerprint']) {
                            $fixtures[(int) $number] = $existing;
                        }
                    }
                    if (preg_match('/^\[RBAC-DEMO:'.preg_quote((string) $user->id, '/').':(\d+)\]/', $existing->issue, $match)) {
                        $fixtures[(int) $match[1]] = $existing;
                    }
                }
                $baseCount = $this->reportsPerUser + intdiv($extra, $users->count()) + ($userIndex < $extra % $users->count() ? 1 : 0);
                $userScenarios = array_merge($scenarios[$user->id] ?? [], $reviewScenarios[$user->id] ?? []);
                $count = $baseCount + count($userScenarios);
                for ($index = 0; $index < $count; $index++) {
                    $scenario = $userScenarios[$index - $baseCount] ?? null;
                    $location = $scenario['location'] ?? $subAreas->get($ordinal % $subAreas->count());
                    $child = $scenario['child'] ?? $children->get($ordinal % $children->count());
                    if ($scenario === null) {
                        $ordinal++;
                    }
                    $closerId = $globalCloser?->id ?? $scopedClosers[$location->id.':'.$child->id] ?? null;
                    $closed = $scenario === null && $child->category === 'ISSUE' && $index % 4 === 0 && $closerId !== null;
                    $photoIndex = $ordinal + $userIndex;
                    $createdAt = now()->subDays([0, 2, 10, 35, 65, 110][$index % 6])->subHours(3)->subMinutes($index);
                    $fixture = $fixtures[$index + 1] ?? new Report;
                    $fixture->fill([
                        'author_id' => $user->id,
                        'issue' => $child->category === 'REPORT'
                            ? [
                                "The {$child->name} inspection at {$location->name} is complete. The area is clean and the work route remains clear.",
                                "Routine {$child->name} checks at {$location->name} are complete. Equipment is organized and operations are running normally.",
                                "Conditions at {$location->name} were reviewed during {$child->name}. The area was documented and no immediate issues were observed.",
                            ][$index % 3]
                            : [
                                "During the {$child->name} inspection at {$location->name}, the team found a condition that requires follow-up.",
                                "A finding was recorded during {$child->name} at {$location->name}. The area team should review it before the next shift.",
                                "The {$child->name} check at {$location->name} found a section of the work area that needs inspection and housekeeping.",
                            ][$index % 3],
                        'area_id' => $location->area_id, 'sub_area_id' => $location->id, 'sub_activity_id' => $child->id,
                        'activity' => $index % 3 === 0 ? 'The inspection took place during operating hours. The area team was notified for follow-up.' : null,
                        'status' => $closed ? Report::STATUS_CLOSED : Report::STATUS_OPEN,
                        'photo_before' => $photoIndex % 7 !== 0 ? $photos[$photoIndex % count($photos)] : null,
                        'photo_after' => $closed && $photoIndex % 8 !== 0 ? $photos[($photoIndex + 1) % count($photos)] : null,
                        'close_comment' => $closed ? 'The follow-up is complete and the area has been checked again.' : null,
                        'closed_by' => $closed ? $closerId : null, 'closed_at' => $closed ? $createdAt->copy()->addHour() : null,
                    ]);
                    $fixture->forceFill(['created_at' => $createdAt, 'updated_at' => $closed ? $createdAt->copy()->addHour() : $createdAt, 'deleted_at' => null]);
                    $fixture->save();
                    if ($fixture->category_snapshot !== $child->category) {
                        DB::table('reports')->where('id', $fixture->id)->update(['category_snapshot' => $child->category]);
                    }
                    $manifest[$user->id][$index + 1] = ['id' => $fixture->id, 'fingerprint' => hash('sha256', $fixture->issue.'|'.$fixture->created_at)];
                }
            }
            if (! $disk->put($manifestPath, json_encode($manifest, JSON_THROW_ON_ERROR))) {
                throw new RuntimeException('Gagal menyimpan penanda internal laporan uji.');
            }
        });
        $this->command?->info(sprintf('%d laporan dasar untuk %d pengguna dan %d skenario close SPV disiapkan. Assignment uji ditambahkan tanpa menghapus assignment yang ada.', $total, $users->count(), array_sum(array_map('count', $scenarios))));
        if ($unassigned !== []) {
            $this->command?->warn('SPV tanpa skenario close (ISSUE atau reporter lain tidak tersedia): '.implode(', ', $unassigned));
        }
        $this->command?->info(sprintf('%d skenario review Manager disiapkan.', array_sum(array_map('count', $reviewScenarios))));
        if ($reviewersWithoutReporter !== []) {
            $this->command?->warn('Manager tanpa laporan dari pengguna lain karena reporter lain tidak tersedia: '.implode(', ', $reviewersWithoutReporter));
        }
    }

    private function samplePhotos(): array
    {
        $paths = [];
        foreach (['assembly-line.jpg', 'industrial-equipment.jpg', 'warehouse.jpg'] as $filename) {
            $path = "reports/testing/commons/{$filename}";
            if (! Storage::disk('public')->exists($path)) {
                $contents = file_get_contents(__DIR__.'/assets/'.$filename);
                if (! is_string($contents) || ! Storage::disk('public')->put($path, $contents)) {
                    throw new RuntimeException('Gagal menyiapkan foto uji.');
                }
            }
            $paths[] = $path;
        }

        foreach ([['assembly-line.jpg', 'small-landscape.jpg', 320, 213, false], ['warehouse.jpg', 'small-portrait.jpg', 240, 316, false], ['industrial-equipment.jpg', 'square.jpg', 600, 600, true]] as [$source, $filename, $width, $height, $square]) {
            $path = "reports/testing/commons/{$filename}";
            if (! Storage::disk('public')->exists($path)) {
                $image = imagecreatefromjpeg(__DIR__.'/assets/'.$source);
                $resized = imagecreatetruecolor($width, $height);
                if ($image === false || $resized === false) {
                    throw new RuntimeException('Gagal memproses foto uji.');
                }
                $sourceWidth = imagesx($image);
                $sourceHeight = imagesy($image);
                $cropSize = min($sourceWidth, $sourceHeight);
                imagecopyresampled($resized, $image, 0, 0, $square ? intdiv($sourceWidth - $cropSize, 2) : 0, $square ? intdiv($sourceHeight - $cropSize, 2) : 0, $width, $height, $square ? $cropSize : $sourceWidth, $square ? $cropSize : $sourceHeight);
                ob_start();
                $encoded = imagejpeg($resized, null, 85);
                $contents = ob_get_clean();
                imagedestroy($image);
                imagedestroy($resized);
                if (! $encoded || ! is_string($contents) || ! Storage::disk('public')->put($path, $contents)) {
                    throw new RuntimeException('Gagal menyimpan foto uji.');
                }
            }
            $paths[] = $path;
        }

        return $paths;
    }
}
