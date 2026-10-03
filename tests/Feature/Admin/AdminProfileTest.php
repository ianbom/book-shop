<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_admin_profile_is_admin_only_and_shows_own_address(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        UserAddress::create([
            'user_id' => $admin->id,
            'label' => 'Rumah Admin',
            'destination_contact_name' => 'Admin',
            'destination_contact_phone' => '08123456789',
            'destination_address' => 'Jalan Admin',
        ]);
        UserAddress::create([
            'user_id' => $customer->id,
            'label' => 'Rumah Customer',
            'destination_contact_name' => 'Customer',
            'destination_contact_phone' => '08987654321',
            'destination_address' => 'Jalan Customer',
        ]);

        $this->get(route('profile.edit'))->assertRedirect(route('login'));
        $this->actingAs($admin)->get(route('profile.edit'))->assertRedirect(route('admin.profile'));
        $this->actingAs($customer)->get(route('profile.edit'))->assertRedirect(route('customer.dashboard.profile'));
        $this->actingAs($customer)->get(route('admin.profile'))->assertForbidden();

        $this->actingAs($admin)->get(route('admin.profile'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/profile/profile')
                ->where('address.destination_address', 'Jalan Admin')
                ->where('profilePhotoUrl', null));
    }

    public function test_admin_can_update_name_phone_and_profile_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->patch(route('admin.profile.update'), [
            'name' => 'Admin Updated',
            'phone' => '08123456789',
            'profile_photo' => UploadedFile::fake()->image('admin.jpg'),
        ])->assertRedirect(route('admin.profile'));

        $admin->refresh();
        $this->assertSame('Admin Updated', $admin->name);
        $this->assertSame('08123456789', $admin->phone);
        Storage::disk('public')->assertExists($admin->profile_photo_path);
    }

    public function test_admin_can_look_up_and_save_a_personal_address(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        config(['services.biteship.key' => 'test-api-key']);
        Http::fake([
            'api.biteship.com/v1/maps/areas*' => Http::response([
                'success' => true,
                'areas' => [[
                    'id' => 'area-admin',
                    'postal_code' => 60231,
                    'administrative_division_level_1_name' => 'Jawa Timur',
                    'administrative_division_level_2_name' => 'Surabaya',
                    'administrative_division_level_3_name' => 'Wonokromo',
                ]],
            ]),
        ]);

        $this->actingAs($admin)->getJson(route('admin.profile.address.areas', ['postal_code' => '60231']))
            ->assertOk()->assertJsonPath('areas.0.id', 'area-admin');
        $this->actingAs($admin)->put(route('admin.profile.address.save'), [
            'label' => 'Rumah',
            'destination_contact_name' => 'Admin',
            'destination_contact_phone' => '08123456789',
            'destination_contact_email' => 'admin@example.com',
            'destination_postal_code' => '60231',
            'destination_area_id' => 'area-admin',
            'subdistrict_name' => 'Darmo',
            'destination_address' => 'Jalan Admin',
            'destination_latitude' => '-7.2911',
            'destination_longitude' => '112.7351',
        ])->assertRedirect(route('admin.profile'));

        $this->assertDatabaseHas('user_addresses', [
            'user_id' => $admin->id,
            'destination_area_id' => 'area-admin',
            'destination_address' => 'Jalan Admin',
        ]);
    }
}
