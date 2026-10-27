<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_password_update_route_is_unavailable(): void
    {
        $user = User::factory()->create();
        $password = $user->password;
        $this->actingAs($user)->put('/password', [])->assertNotFound();
        $this->assertSame($password, $user->fresh()->password);
    }
}
