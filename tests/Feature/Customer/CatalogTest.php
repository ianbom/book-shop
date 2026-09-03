<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_only_exposes_active_books_and_applies_filters(): void
    {
        $business = Category::factory()->create(['name' => 'Bisnis', 'slug' => 'bisnis']);
        $technology = Category::factory()->create(['name' => 'Teknologi', 'slug' => 'teknologi']);
        $matched = Book::factory()->create([
            'title' => 'Atomic Systems',
            'author' => 'James Clear',
            'isbn' => '9780000000001',
            'price' => 120000,
            'stock' => 4,
        ]);
        $matched->categories()->attach($business);

        $other = Book::factory()->create(['title' => 'Code Complete', 'stock' => 0]);
        $other->categories()->attach($technology);
        Book::factory()->create(['title' => 'Buku Nonaktif', 'is_active' => false]);

        $this->get(route('books.index', [
            'search' => 'james',
            'category' => 'bisnis',
            'availability' => 'available',
            'sort' => 'price_asc',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/books/index')
                ->has('books.data', 1)
                ->where('books.data.0.id', $matched->id)
                ->where('books.meta.total', 1)
                ->where('filters.search', 'james')
                ->where('filters.category', 'bisnis')
                ->where('filters.availability', 'available')
                ->where('filters.sort', 'price_asc'),
            );
    }

    public function test_catalog_searches_by_isbn_and_preserves_query_on_pagination(): void
    {
        $book = Book::factory()->create(['isbn' => '9781234567890']);
        Book::factory()->count(12)->create();

        $this->get(route('books.index', ['search' => '9781234567890']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('books.data', 1)
                ->where('books.data.0.id', $book->id)
                ->where('books.meta.links.0.url', fn (?string $url) => $url === null || str_contains($url, 'search=9781234567890')),
            );
    }
}
