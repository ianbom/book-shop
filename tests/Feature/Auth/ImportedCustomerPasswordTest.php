<?php

use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function importedPasswordUser(): User
{
    $user = User::factory()->create(['role' => 'customer', 'password' => 'customer123', 'email_verified_at' => null]);
    $user->forceFill(['must_change_password' => true])->save();

    return $user;
}

it('redirects initial login to mandatory password change', function () {
    $user = importedPasswordUser();
    $this->post('/login', ['email' => $user->email, 'password' => 'customer123'])
        ->assertRedirect('/change-password');
});

it('blocks account and enrollment routes until the password changes', function () {
    $this->withoutVite()->actingAs(importedPasswordUser());
    foreach (['/customer/dashboard/orders', '/customer/dashboard/carts', '/settings/profile', '/settings/security'] as $url) {
        $this->get($url)->assertRedirect('/change-password');
    }
    $this->postJson('/user/passkeys', [])->assertForbidden()->assertJsonPath('code', 'password_change_required');
    $this->getJson('/api/user')->assertForbidden()->assertJsonPath('code', 'password_change_required');
    $this->get('/change-password')->assertOk();
    $this->post('/logout')->assertRedirect();
    $this->assertGuest();
});

it('validates and changes the password without email verification', function () {
    $user = importedPasswordUser();
    $this->actingAs($user)->put('/change-password', ['current_password' => 'wrong', 'password' => 'another-password', 'password_confirmation' => 'another-password'])
        ->assertSessionHasErrors('current_password');
    $this->put('/change-password', ['current_password' => 'customer123', 'password' => 'customer123', 'password_confirmation' => 'customer123'])
        ->assertSessionHasErrors('password');
    expect($user->fresh()->must_change_password)->toBeTrue();
    $this->put('/change-password', ['current_password' => 'customer123', 'password' => 'another-password', 'password_confirmation' => 'another-password'])
        ->assertSessionHasNoErrors()->assertRedirect('/');
    expect($user->fresh()->must_change_password)->toBeFalse()->and(Hash::check('another-password', $user->fresh()->password))->toBeTrue()
        ->and($user->fresh()->email_verified_at)->toBeNull();
    $this->withoutVite()->get('/customer/dashboard/orders')->assertOk();
});

it('does not force existing customers and clears the flag after a valid reset', function () {
    $this->withoutVite()->actingAs(User::factory()->create(['role' => 'customer']))->get('/customer/dashboard/orders')->assertOk();
    $user = importedPasswordUser();
    app(ResetUserPassword::class)->reset($user, ['password' => 'reset-password', 'password_confirmation' => 'reset-password']);
    expect($user->fresh()->must_change_password)->toBeFalse()->and(Hash::check('reset-password', $user->fresh()->password))->toBeTrue();
});

it('rejects the current password during a forced reset', function () {
    $user = importedPasswordUser();
    $user->forceFill(['password' => 'previous-password'])->save();
    expect(fn () => app(ResetUserPassword::class)->reset($user, ['password' => 'previous-password', 'password_confirmation' => 'previous-password']))
        ->toThrow(ValidationException::class);
    expect($user->fresh()->must_change_password)->toBeTrue();
});

it('requires matching confirmation before clearing the mandatory flag', function () {
    $user = importedPasswordUser();
    $this->actingAs($user)->put('/change-password', ['current_password' => 'customer123', 'password' => 'another-password', 'password_confirmation' => 'different-password'])
        ->assertSessionHasErrors('password');
    expect($user->fresh()->must_change_password)->toBeTrue()->and(Hash::check('customer123', $user->fresh()->password))->toBeTrue();
});

it('throttles mandatory password changes', function () {
    $this->actingAs(importedPasswordUser());
    for ($attempt = 0; $attempt < 6; $attempt++) {
        $this->put('/change-password', [])->assertSessionHasErrors();
    }
    $this->put('/change-password', [])->assertStatus(429);
});

it('rejects the initial password during a forced reset', function () {
    $user = importedPasswordUser();
    expect(fn () => app(ResetUserPassword::class)->reset($user, ['password' => 'customer123', 'password_confirmation' => 'customer123']))
        ->toThrow(ValidationException::class);
    expect($user->fresh()->must_change_password)->toBeTrue();
});
