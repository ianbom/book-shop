<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StoreSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_read_every_store_setting_field(): void
    {
        $setting = StoreSetting::factory()->create($this->settings());

        $this->actingAs($this->admin())->get(route('admin.settings.edit'))
            ->assertInertia(function (Assert $page) use ($setting): void {
                $page->component('admin/settings/index')->where('setting.id', $setting->id);

                foreach ($this->settings() as $field => $value) {
                    $page->where("setting.{$field}", $value);
                }
            });
    }

    public function test_admin_can_save_every_store_setting_field(): void
    {
        StoreSetting::factory()->create();

        $this->actingAs($this->admin())->patch(route('admin.settings.update'), $this->settings())
            ->assertRedirect();

        $this->assertDatabaseCount('store_settings', 1);
        $this->assertDatabaseHas('store_settings', $this->settings());
    }

    public function test_admin_can_create_settings_and_clear_optional_fields(): void
    {
        $this->actingAs($this->admin())->get(route('admin.settings.edit'))
            ->assertInertia(fn (Assert $page) => $page->component('admin/settings/index')->where('setting', null));

        $input = $this->settings();
        $input['whatsapp_number'] = '';
        $input['shipper_contact_name'] = '';
        $input['origin_latitude'] = '';
        $input['origin_longitude'] = '';

        $this->actingAs($this->admin())->patch(route('admin.settings.update'), $input)
            ->assertRedirect();

        $this->assertDatabaseHas('store_settings', [
            'id' => 1,
            'store_name' => $input['store_name'],
            'whatsapp_number' => null,
            'shipper_contact_name' => null,
            'origin_latitude' => null,
            'origin_longitude' => null,
        ]);
    }

    public function test_invalid_settings_are_rejected_without_changing_data(): void
    {
        $setting = StoreSetting::factory()->create();
        $this->actingAs($this->admin());

        foreach ([
            ['store_name' => '', 'error' => 'store_name'],
            ['couriers' => 'jne,,sicepat', 'error' => 'couriers'],
            ['origin_postal_code' => '', 'origin_area_id' => '', 'origin_latitude' => '', 'origin_longitude' => '', 'error' => 'origin_postal_code'],
            ['origin_latitude' => '-7.1234567', 'origin_longitude' => '', 'error' => 'origin_longitude'],
            ['origin_latitude' => '91', 'error' => 'origin_latitude'],
            ['shipper_contact_email' => 'bukan-email', 'error' => 'shipper_contact_email'],
        ] as $invalid) {
            $error = $invalid['error'];
            unset($invalid['error']);

            $this->patch(route('admin.settings.update'), [...$this->settings(), ...$invalid])
                ->assertSessionHasErrors($error);
        }

        $this->assertSame('Toko Buku', $setting->fresh()->store_name);
    }

    public function test_customer_cannot_read_or_update_store_settings(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('admin.settings.edit'))->assertForbidden();
        $this->patch(route('admin.settings.update'), $this->settings())->assertForbidden();
        $this->assertDatabaseCount('store_settings', 0);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => UserRole::Admin])->save();

        return $admin;
    }

    /** @return array<string, string> */
    private function settings(): array
    {
        return [
            'store_name' => 'Wonder Book',
            'whatsapp_number' => '+6281234567890',
            'email' => 'store@example.test',
            'phone' => '+6281234567890',
            'address' => 'Jl. Buku No. 1',
            'couriers' => 'jne,sicepat',
            'shipper_contact_name' => 'Pengirim Toko',
            'shipper_contact_phone' => '+6281234567890',
            'shipper_contact_email' => 'shipper@example.test',
            'shipper_organization' => 'Wonder Book',
            'origin_contact_name' => 'Admin Gudang',
            'origin_contact_phone' => '+6281234567890',
            'origin_contact_email' => 'origin@example.test',
            'origin_address' => 'Jl. Gudang No. 2',
            'origin_note' => 'Pintu samping',
            'origin_postal_code' => '61257',
            'origin_area_id' => 'area-123',
            'origin_location_id' => 'location-123',
            'origin_latitude' => '-7.1234567',
            'origin_longitude' => '112.1234567',
        ];
    }
}
