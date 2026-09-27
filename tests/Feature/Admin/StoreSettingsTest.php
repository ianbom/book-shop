<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
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

    public function test_admin_can_create_and_edit_bank_accounts(): void
    {
        $this->actingAs($this->admin());
        $account = ['bank_name' => 'BCA', 'account_holder' => 'Toko Buku', 'account_number' => '0012345678'];

        $this->patch(route('admin.settings.update'), [...$this->settings(), 'bank_accounts' => [$account]])
            ->assertSessionHasNoErrors();

        $setting = StoreSetting::query()->findOrFail(1);
        $this->assertSame([$account], $setting->bank_accounts);
        $this->get(route('admin.settings.edit'))
            ->assertInertia(fn (Assert $page) => $page->where('setting.bank_accounts.0.account_number', '0012345678'));

        $account['account_number'] = '0098765432';
        $this->patch(route('admin.settings.update'), [...$this->settings(), 'bank_accounts' => [$account]])
            ->assertSessionHasNoErrors();
        $this->assertSame([$account], $setting->fresh()->bank_accounts);
    }

    public function test_bank_account_fields_are_required_and_account_number_stays_numeric_text(): void
    {
        $this->actingAs($this->admin())
            ->patch(route('admin.settings.update'), [...$this->settings(), 'bank_accounts' => [[
                'bank_name' => '', 'account_holder' => 'Toko Buku', 'account_number' => '12a',
            ]]])
            ->assertSessionHasErrors(['bank_accounts.0.bank_name', 'bank_accounts.0.account_number']);
        $this->assertDatabaseCount('store_settings', 0);
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

    public function test_admin_can_lookup_origin_areas_by_postal_code(): void
    {
        config(['services.biteship.key' => 'test-key']);
        Http::fake([
            'api.biteship.com/v1/maps/areas*' => Http::response([
                'success' => true,
                'areas' => [[
                    'id' => 'area-123',
                    'postal_code' => '61257',
                    'administrative_division_level_1_name' => 'Jawa Timur',
                    'administrative_division_level_2_name' => 'Sidoarjo',
                    'administrative_division_level_3_name' => 'Waru',
                ]],
            ]),
        ]);

        $this->actingAs($this->admin())
            ->getJson(route('admin.settings.address.areas', ['postal_code' => '61257']))
            ->assertOk()
            ->assertExactJson(['areas' => [[
                'id' => 'area-123',
                'postal_code' => '61257',
                'province' => 'Jawa Timur',
                'city' => 'Sidoarjo',
                'district' => 'Waru',
            ]]]);
    }

    public function test_customer_cannot_lookup_admin_origin_areas(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.settings.address.areas', ['postal_code' => '61257']))
            ->assertForbidden();
    }

    public function test_admin_origin_area_lookup_requires_a_five_digit_postal_code(): void
    {
        $this->actingAs($this->admin())
            ->getJson(route('admin.settings.address.areas', ['postal_code' => '6125']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('postal_code');
    }

    public function test_admin_can_lookup_origin_map_center_for_a_matching_area(): void
    {
        config([
            'services.biteship.key' => 'test-key',
            'services.nominatim.user_agent' => 'book-shop-tests',
        ]);
        Http::fake([
            'api.biteship.com/v1/maps/areas*' => Http::response([
                'success' => true,
                'areas' => [[
                    'id' => 'area-123',
                    'postal_code' => '61257',
                    'administrative_division_level_1_name' => 'Jawa Timur',
                    'administrative_division_level_2_name' => 'Sidoarjo',
                    'administrative_division_level_3_name' => 'Waru',
                ]],
            ]),
            'nominatim.openstreetmap.org/search*' => Http::response([
                ['lat' => '-7.35', 'lon' => '112.72'],
            ]),
        ]);

        $this->actingAs($this->admin())
            ->getJson(route('admin.settings.address.map-center', [
                'postal_code' => '61257',
                'area_id' => 'area-123',
            ]))
            ->assertOk()
            ->assertExactJson(['center' => ['latitude' => -7.35, 'longitude' => 112.72]]);
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
