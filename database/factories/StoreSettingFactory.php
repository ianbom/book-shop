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
            'store_name' => 'Wonder Book',
            'whatsapp_number' => '+6281234567890',
            'email' => fake()->safeEmail(),
            'address' => fake()->address(),
        ];
    }
}
