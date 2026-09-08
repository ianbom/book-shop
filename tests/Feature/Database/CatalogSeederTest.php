<?php

namespace Tests\Feature\Database;

use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Category;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeder_creates_genres_books_covers_and_initial_stock_history_without_duplicates(): void
    {
        Storage::fake('public');

        $this->seed(CatalogSeeder::class);
        $this->seed(CatalogSeeder::class);

        $this->assertDatabaseCount('categories', 7);
        $this->assertDatabaseCount('books', 23);
        $this->assertDatabaseCount('book_images', 23);
        $this->assertDatabaseCount('book_stock_movements', 23);
        $this->assertSame(23, Book::has('categories')->count());
        $this->assertSame(23, BookStockMovement::where('type', StockMovementType::Initial)->count());

        $covers = Book::with('images')->get()->pluck('images.0.image_path');
        $covers->each(fn (string $path) => Storage::disk('public')->assertExists($path));
        $this->assertCount(23, $covers->unique());
        $this->assertDatabaseHas('books', [
            'slug' => 'the-world-without-you',
            'title' => 'The World Without You',
            'author' => 'Joshua Henkin',
            'isbn' => null,
        ]);
        $this->assertDatabaseHas('book_images', [
            'image_path' => 'books/the-world-without-you/cover.jpeg',
            'is_primary' => true,
        ]);
        $this->assertDatabaseHas('books', [
            'slug' => 'hidden-figures',
            'title' => 'Hidden Figures',
            'author' => 'Margot Lee Shetterly',
        ]);
        $this->assertSame('Fiksi', Category::where('slug', 'fiksi')->value('name'));
        $this->assertDatabaseHas('books', [
            'slug' => 'maria-stuart',
            'title' => 'Maria Stuart',
            'author' => 'Stefan Zweig',
        ]);
    }
}
