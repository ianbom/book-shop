<?php

namespace Database\Factories;

use App\Models\StoreSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<StoreSetting> */
class StoreSettingFactory extends Factory
{
    protected $model = StoreSetting::class;

    public function definition(): array
    {
        return [
            'store_name' => 'Toko Buku',
            'whatsapp_number' => '+6281234567890',
            'email' => fake()->safeEmail(),
            'address' => fake()->address(),
            'couriers' => 'jne,sicepat,anteraja,jnt,tiki',
            'origin_contact_name' => fake()->name(),
            'origin_contact_phone' => '+6281234567890',
            'origin_address' => fake()->address(),
            'origin_postal_code' => '61257',
        ];
    }
}
