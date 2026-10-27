<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_routes_are_unavailable(): void
    {
        $this->get('/forgot-password')->assertNotFound();
        $this->post('/forgot-password')->assertNotFound();
        $this->get('/reset-password/token')->assertNotFound();
        $this->post('/reset-password')->assertNotFound();
    }
}
