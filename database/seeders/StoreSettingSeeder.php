<?php

namespace Database\Seeders;

use App\Models\StoreSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use RuntimeException;

class StoreSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = Arr::except(config('store'), ['bank_accounts']);
        $required = [
            'store_name' => 'STORE_NAME',
            'couriers' => 'STORE_COURIERS',
            'origin_contact_name' => 'STORE_ORIGIN_CONTACT_NAME',
            'origin_contact_phone' => 'STORE_ORIGIN_CONTACT_PHONE',
            'origin_address' => 'STORE_ORIGIN_ADDRESS',
        ];
        $missing = array_filter($required, fn (string $key, string $field) => blank($settings[$field] ?? null), ARRAY_FILTER_USE_BOTH);

        if ($missing !== []) {
            throw new RuntimeException(implode(', ', $missing).' must be configured.');
        }

        if (blank($settings['origin_postal_code'] ?? null)
            && blank($settings['origin_area_id'] ?? null)
            && (blank($settings['origin_latitude'] ?? null) || blank($settings['origin_longitude'] ?? null))) {
            throw new RuntimeException('Configure STORE_ORIGIN_POSTAL_CODE, STORE_ORIGIN_AREA_ID, or both STORE_ORIGIN_LATITUDE and STORE_ORIGIN_LONGITUDE.');
        }

        StoreSetting::query()->updateOrCreate(['id' => 1], $settings);
    }
}
