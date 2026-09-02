<?php

namespace Database\Factories;

use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<BookStockMovement> */
class BookStockMovementFactory extends Factory
{
    protected $model = BookStockMovement::class;

    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'changed_by' => User::factory(),
            'type' => StockMovementType::AdjustmentIn,
            'quantity' => 10,
            'stock_before' => 0,
            'stock_after' => 10,
            'note' => fake()->optional()->sentence(),
            'created_at' => now(),
        ];
    }
}
