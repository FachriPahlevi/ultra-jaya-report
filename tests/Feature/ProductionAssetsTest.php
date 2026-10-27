<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class ProductionAssetsTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_and_public_dashboard_render_with_built_vite_assets(): void
    {
        $manifestPath = public_path('build/manifest.json');
        if (! is_file($manifestPath)) {
            $this->markTestSkipped('Run npm run build to verify production Vite assets.');
        }

        $manifest = json_decode((string) file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
        $this->assertArrayHasKey('resources/js/app.tsx', $manifest);
        $this->assertFileExists(public_path('build/'.$manifest['resources/js/app.tsx']['file']));
        Vite::useHotFile(storage_path('framework/testing/nonexistent-vite-hot-file'));

        foreach (['/login', '/dashboard'] as $url) {
            $this->get($url)->assertOk()->assertSee($manifest['resources/js/app.tsx']['file'], false);
        }
    }
}
