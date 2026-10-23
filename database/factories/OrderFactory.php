<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->numberBetween(25000, 300000);

        return [
            'order_code' => 'BO-'.Str::upper(Str::random(10)),
            'user_id' => User::factory(),
            'customer_note' => fake()->optional()->sentence(),
            'subtotal' => $subtotal,
            'voucher_discount' => 0,
            'shipping_cost' => 0,
            'total' => $subtotal,
            'wallet_amount' => 0,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
        ];
    }
}
