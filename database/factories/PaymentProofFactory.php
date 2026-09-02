<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PaymentProof> */
class PaymentProofFactory extends Factory
{
    protected $model = PaymentProof::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'uploaded_by' => User::factory(),
            'image_path' => 'payment-proofs/'.fake()->uuid().'.webp',
            'payment_amount' => fake()->randomFloat(2, 25000, 300000),
            'paid_at' => now(),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
