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
        DB::transaction(function () use ($users, $subAreas, $children, $globalCloser, $scopedClosers, $photos, $manifest, $manifestPath, $disk, $extra): void {
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
                $count = $this->reportsPerUser + intdiv($extra, $users->count()) + ($userIndex < $extra % $users->count() ? 1 : 0);
                for ($index = 0; $index < $count; $index++, $ordinal++) {
                    $location = $subAreas->get($ordinal % $subAreas->count());
                    $child = $children->get($ordinal % $children->count());
                    $closerId = $globalCloser?->id ?? $scopedClosers[$location->id.':'.$child->id] ?? null;
                    $closed = $child->category === 'ISSUE' && $index % 4 === 0 && $closerId !== null;
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
                        'photo_before' => $index % 6 !== 0 ? $photos[$index % count($photos)] : null,
                        'photo_after' => $closed && $index % 8 !== 0 ? $photos[($index + 1) % count($photos)] : null,
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
        $this->command?->info(sprintf('%d laporan untuk %d pengguna disiapkan, mencakup seluruh Sub-area dan Sub-aktivitas aktif yang tersedia. Data master, akun, permission, password, dan penugasan tidak diubah.', $total, $users->count()));
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

        return $paths;
    }
}
