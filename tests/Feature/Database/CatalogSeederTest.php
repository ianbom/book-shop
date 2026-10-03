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
        $this->assertDatabaseCount('books', 10);
        $this->assertDatabaseCount('book_images', 10);
        $this->assertDatabaseCount('book_stock_movements', 10);
        $this->assertSame(10, Book::has('categories')->count());
        $this->assertSame(10, BookStockMovement::where('type', StockMovementType::Initial)->count());
        $this->assertSame([
            'Bintang Kecil dan Mimpi Besar',
            'Gerbang Ajaib Negeri Angka',
            'Hari Ceria di Peternakan',
            'Kelinci Kecil yang Pemberani',
            'Kucing Baik Hati dan Teman Baru',
            'Pesta Si Ayam Ceria',
            'Petualangan di Hutan Pelangi',
            'Rahasia Rumah Pohon',
            'Sahabat Kecil di Negeri Awan',
            'Si Penjelajah Cilik dan Laut Biru',
        ], Book::orderBy('title')->pluck('title')->all());

        $covers = Book::with('images')->get()->pluck('images.0.image_path');
        $covers->each(fn (string $path) => Storage::disk('public')->assertExists($path));
        $this->assertCount(10, $covers->unique());
        $sourceHashes = array_map(fn (string $path) => hash_file('sha256', $path), glob(public_path('kid_books/*.jpeg')));
        $coverHashes = $covers->map(fn (string $path) => hash('sha256', Storage::disk('public')->get($path)))->all();
        sort($sourceHashes);
        sort($coverHashes);
        $this->assertSame($sourceHashes, $coverHashes);
        $this->assertDatabaseHas('books', [
            'slug' => 'hari-ceria-di-peternakan',
            'title' => 'Hari Ceria di Peternakan',
            'author' => 'Mira Puspita',
            'isbn' => null,
            'shipping_category' => 'others',
            'weight' => 500,
            'sale_type' => 'ready_stock',
        ]);
        $this->assertDatabaseHas('book_images', [
            'image_path' => 'books/hari-ceria-di-peternakan/cover.jpeg',
            'is_primary' => true,
        ]);
        $this->assertDatabaseHas('books', [
            'slug' => 'gerbang-ajaib-negeri-angka',
            'title' => 'Gerbang Ajaib Negeri Angka',
            'author' => 'Raka Pratama',
        ]);
        $this->assertSame('Fiksi', Category::where('slug', 'fiksi')->value('name'));
        $this->assertDatabaseHas('books', [
            'slug' => 'pesta-si-ayam-ceria',
            'title' => 'Pesta Si Ayam Ceria',
            'author' => 'Dita Maharani',
        ]);
    }
}
