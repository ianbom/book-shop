<?php

namespace Tests\Feature\Database;

use App\Models\StoreSetting;
use Database\Seeders\StoreSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreSettingSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_setting_seeder_creates_expected_settings_without_duplicates(): void
    {
        $setting = StoreSetting::factory()->create();
        $setting->delete();

        $this->seed(StoreSettingSeeder::class);
        $this->seed(StoreSettingSeeder::class);

        $this->assertDatabaseCount('store_settings', 1);
        $this->assertDatabaseHas('store_settings', [
            'id' => $setting->id,
            'whatsapp_number' => '628117866977',
            'email' => 'wonderprince@gmail.com',
            'address' => 'Jl Merdeka Surabaya',
            'deleted_at' => null,
        ]);
    }
}
