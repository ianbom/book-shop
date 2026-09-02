<?php

namespace Tests\Feature\Database;

use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Category;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeder_creates_genres_books_covers_and_initial_stock_history_without_duplicates(): void
    {
        Storage::fake('public');
        Http::fake(['images.unsplash.com/*' => Http::response('unsplash-cover', 200)]);

        $this->seed(CatalogSeeder::class);
        $this->seed(CatalogSeeder::class);

        $this->assertDatabaseCount('categories', 7);
        $this->assertDatabaseCount('books', 20);
        $this->assertDatabaseCount('book_images', 20);
        $this->assertDatabaseCount('book_stock_movements', 20);
        $this->assertSame(20, Book::has('categories')->count());
        $this->assertSame(20, BookStockMovement::where('type', StockMovementType::Initial)->count());

        $cover = Book::with('images')->firstOrFail()->images->firstOrFail();
        Storage::disk('public')->assertExists($cover->image_path);
        $this->assertSame('Fiksi', Category::where('slug', 'fiksi')->value('name'));
        Http::assertSentCount(20);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'photo-1511108690759-009c47a87d3e'));
    }
}
