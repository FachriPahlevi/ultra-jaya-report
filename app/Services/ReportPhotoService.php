<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Report;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class ReportPhotoService
{
    public function store(UploadedFile $photo, Report $report, string $stage): string
    {
        if (! in_array($stage, ['before', 'after'], true)) {
            throw new RuntimeException('Tahap foto laporan tidak valid.');
        }

        $contents = file_get_contents($photo->getRealPath());
        $source = $contents === false ? false : imagecreatefromstring($contents);

        if ($source === false) {
            throw new RuntimeException('Foto laporan tidak dapat diproses.');
        }

        $sourceWidth = imagesx($source);
        $sourceHeight = imagesy($source);
        $maxDimension = (int) config('reports.photos.max_dimension', 1600);
        $scale = min($maxDimension / max($sourceWidth, 1), $maxDimension / max($sourceHeight, 1), 1);
        $width = max(1, (int) round($sourceWidth * $scale));
        $height = max(1, (int) round($sourceHeight * $scale));
        $target = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($target, 255, 255, 255);
        imagefill($target, 0, 0, $white);
        imagecopyresampled($target, $source, 0, 0, 0, 0, $width, $height, $sourceWidth, $sourceHeight);

        ob_start();
        imagejpeg($target, null, (int) config('reports.photos.jpeg_quality', 82));
        $encoded = ob_get_clean();
        imagedestroy($source);
        imagedestroy($target);

        if (! is_string($encoded)) {
            throw new RuntimeException('Foto laporan gagal dikompresi.');
        }

        $path = sprintf(
            'reports/%s/%s/%d/%s-%s-%s.jpg',
            now()->format('Y'),
            now()->format('m'),
            $report->getKey(),
            $stage,
            now()->format('Ymd-His'),
            Str::lower(Str::random(8)),
        );

        if (! Storage::disk($this->disk())->put($path, $encoded)) {
            throw new RuntimeException('Foto laporan gagal disimpan.');
        }

        return $path;
    }

    public function replace(UploadedFile $photo, Report $report, string $stage, ?string $oldPath): string
    {
        $newPath = $this->store($photo, $report, $stage);
        $this->delete($oldPath);

        return $newPath;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk($this->disk())->delete($path);
        }
    }

    private function disk(): string
    {
        return (string) config('reports.photos.disk', 'public');
    }
}
