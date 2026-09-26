<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get(route('register'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page->component('auth/register'));
    }

    public function test_new_users_can_register_as_customers_and_are_redirected_to_the_store(): void
    {
        $response = $this->withSession(['url.intended' => '/admin'])->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('home'));
        $response->assertSessionMissing('url.intended');
        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'role' => 'customer']);
    }
}
