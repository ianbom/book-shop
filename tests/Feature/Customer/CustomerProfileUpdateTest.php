<?php

namespace Tests\Feature\Customer;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_update_phone_and_profile_photo(): void
    {
        Storage::fake('public');
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        $this->actingAs($customer)->patch(route('customer.dashboard.profile.update'), [
            'phone' => '08123456789',
            'profile_photo' => UploadedFile::fake()->image('profile.jpg'),
        ])->assertRedirect(route('customer.dashboard.profile'));

        $customer->refresh();
        $this->assertSame('08123456789', $customer->phone);
        $this->assertNotNull($customer->profile_photo_path);
        Storage::disk('public')->assertExists($customer->profile_photo_path);

        $this->actingAs($customer)->get(route('customer.dashboard.profile'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('profilePhotoUrl', Storage::disk('public')->url($customer->profile_photo_path)));
    }

    public function test_replacing_profile_photo_removes_the_old_file(): void
    {
        Storage::fake('public');
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $oldPath = 'profile-photos/'.$customer->id.'/old.jpg';
        Storage::disk('public')->put($oldPath, 'old photo');
        $customer->forceFill(['profile_photo_path' => $oldPath])->save();

        $this->actingAs($customer)->patch(route('customer.dashboard.profile.update'), [
            'phone' => $customer->phone,
            'profile_photo' => UploadedFile::fake()->image('new.png'),
        ])->assertRedirect(route('customer.dashboard.profile'));

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($customer->refresh()->profile_photo_path);
    }

    public function test_invalid_photo_is_rejected_without_changing_phone_or_existing_photo(): void
    {
        Storage::fake('public');
        $customer = User::factory()->create(['role' => UserRole::Customer, 'phone' => '08111111111']);
        $oldPath = 'profile-photos/'.$customer->id.'/old.jpg';
        Storage::disk('public')->put($oldPath, 'old photo');
        $customer->forceFill(['profile_photo_path' => $oldPath])->save();

        $this->actingAs($customer)->from(route('customer.dashboard.profile'))
            ->patch(route('customer.dashboard.profile.update'), [
                'phone' => '08222222222',
                'profile_photo' => UploadedFile::fake()->create('invalid.svg', 4, 'image/svg+xml'),
            ])->assertSessionHasErrors('profile_photo');

        $customer->refresh();
        $this->assertSame('08111111111', $customer->phone);
        $this->assertSame($oldPath, $customer->profile_photo_path);
        Storage::disk('public')->assertExists($oldPath);
    }

    public function test_profile_update_is_limited_to_customers(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->patch(route('customer.dashboard.profile.update'), [
            'phone' => '08123456789',
        ])->assertForbidden();
    }
}
