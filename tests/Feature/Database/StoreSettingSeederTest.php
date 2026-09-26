<?php

namespace Tests\Feature\Database;

use App\Models\StoreSetting;
use Database\Seeders\StoreSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class StoreSettingSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_setting_seeder_creates_expected_settings_without_duplicates(): void
    {
        config(['store' => [
            'store_name' => 'Buku Order',
            'whatsapp_number' => '628117866977',
            'email' => 'store@example.test',
            'address' => 'Alamat toko',
            'couriers' => 'jne,sicepat',
            'origin_contact_name' => 'Admin Toko',
            'origin_contact_phone' => '628117866977',
            'origin_address' => 'Alamat asal',
            'origin_postal_code' => '61257',
        ]]);

        $setting = StoreSetting::factory()->create();

        $this->seed(StoreSettingSeeder::class);
        $this->seed(StoreSettingSeeder::class);

        $this->assertDatabaseCount('store_settings', 1);
        $this->assertDatabaseHas('store_settings', [
            'id' => $setting->id,
            'store_name' => 'Buku Order',
            'whatsapp_number' => '628117866977',
            'email' => 'store@example.test',
            'address' => 'Alamat toko',
            'couriers' => 'jne,sicepat',
            'origin_contact_name' => 'Admin Toko',
            'origin_address' => 'Alamat asal',
        ]);
    }

    public function test_store_setting_seeder_rejects_missing_required_environment_values(): void
    {
        config(['store' => []]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('STORE_NAME');

        $this->seed(StoreSettingSeeder::class);
    }

    public function test_store_setting_seeder_requires_an_origin_location_method(): void
    {
        config(['store' => [
            'store_name' => 'Buku Order',
            'couriers' => 'jne',
            'origin_contact_name' => 'Admin Toko',
            'origin_contact_phone' => '628117866977',
            'origin_address' => 'Alamat asal',
            'origin_latitude' => '-7.3',
        ]]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('STORE_ORIGIN_POSTAL_CODE');

        $this->seed(StoreSettingSeeder::class);
    }
}
