<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\BookImage;
use App\Models\Category;
use App\Models\PreOrderCode;
use App\Models\StoreSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomepageTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_exposes_preorder_details_in_featured_and_latest_books(): void
    {
        $code = PreOrderCode::create(['code' => 'PO-HOME']);
        $book = Book::factory()->create([
            'sale_type' => 'preorder', 'pre_order_code_id' => $code->id, 'preorder_estimated_date' => '2027-01-01',
        ]);
        $code->delete();

        $this->get(route('home'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('featuredBooks.0.id', $book->id)
            ->where('featuredBooks.0.sale_type', 'preorder')
            ->where('featuredBooks.0.preorder_estimated_date', '2027-01-01')
            ->where('featuredBooks.0.pre_order_code.code', 'PO-HOME')
            ->where('latestBooks.0.sale_type', 'preorder')
            ->where('latestBooks.0.preorder_estimated_date', '2027-01-01')
            ->where('latestBooks.0.pre_order_code.code', 'PO-HOME'));
    }

    public function test_homepage_exposes_active_books_with_a_primary_image_fallback(): void
    {
        $category = Category::factory()->create();
        $visibleBook = Book::factory()->create(['is_active' => true]);
        $hiddenBook = Book::factory()->create(['is_active' => false]);
        $visibleBook->categories()->attach($category);

        BookImage::factory()->create([
            'book_id' => $visibleBook->id,
            'image_path' => 'books/visible/secondary.webp',
            'is_primary' => false,
            'sort_order' => 1,
        ]);
        BookImage::factory()->create([
            'book_id' => $visibleBook->id,
            'image_path' => 'books/visible/first.webp',
            'is_primary' => false,
            'sort_order' => 0,
        ]);
        StoreSetting::factory()->create([
            'whatsapp_number' => '628117866977',
            'email' => 'wonderprince@gmail.com',
            'address' => 'Jl Merdeka Surabaya',
        ]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/home')
                ->has('categories', 1)
                ->has('featuredBooks', 1)
                ->has('latestBooks', 1)
                ->where('featuredBooks.0.id', $visibleBook->id)
                ->where('featuredBooks.0.primary_image.url', config('app.url').'/storage/books/visible/first.webp')
                ->missing('storeSettings.store_name')
                ->where('storeSettings.whatsapp_number', '628117866977')
                ->where('storeSettings.email', 'wonderprince@gmail.com')
                ->where('storeSettings.address', 'Jl Merdeka Surabaya'),
            );

        $this->assertDatabaseHas('books', ['id' => $hiddenBook->id, 'is_active' => false]);
    }

    public function test_homepage_exposes_eight_latest_active_books(): void
    {
        Book::factory()->count(9)->create(['is_active' => true]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/home')
                ->has('latestBooks', 8),
            );
    }
}
