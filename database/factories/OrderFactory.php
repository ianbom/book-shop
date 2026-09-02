<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Book;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $book = Book::factory()->create();
        $quantity = fake()->numberBetween(1, 5);
        $unitPrice = fake()->randomFloat(2, 25000, 300000);
        $subtotal = $unitPrice * $quantity;

        return [
            'order_code' => 'BO-'.Str::upper(Str::random(10)),
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->e164PhoneNumber(),
            'customer_email' => fake()->optional()->safeEmail(),
            'customer_address' => fake()->address(),
            'customer_note' => fake()->optional()->sentence(),
            'book_id' => $book->id,
            'book_title' => $book->title,
            'book_isbn' => $book->isbn,
            'book_author' => $book->author,
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'subtotal' => $subtotal,
            'shipping_cost' => 0,
            'total' => $subtotal,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
        ];
    }
}
