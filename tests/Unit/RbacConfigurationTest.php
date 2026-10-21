<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;

class RbacConfigurationTest extends TestCase
{
    public function test_every_role_template_references_permissions_in_the_catalog(): void
    {
        $permissions = config('rbac.permissions');

        foreach (config('rbac.roles') as $role) {
            if ($role['permissions'] === ['*']) {
                continue;
            }

            foreach ($role['permissions'] as $permission) {
                $this->assertArrayHasKey($permission, $permissions);
            }
        }
    }
}
