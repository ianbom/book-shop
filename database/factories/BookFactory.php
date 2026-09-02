<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Book> */
class BookFactory extends Factory
{
    protected $model = Book::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
            'isbn' => fake()->optional()->isbn13(),
            'author' => fake()->name(),
            'description' => fake()->optional()->paragraph(),
            'price' => fake()->randomFloat(2, 25000, 300000),
            'stock' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
