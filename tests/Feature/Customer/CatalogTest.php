<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\Category;
use App\Models\PreOrderCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_exposes_preorder_details_and_only_codes_with_active_preorder_books(): void
    {
        $code = PreOrderCode::create(['code' => 'PO-ACTIVE']);
        $archived = PreOrderCode::create(['code' => 'PO-ARCHIVED']);
        $archived->delete();
        $preorder = Book::factory()->create([
            'title' => 'A Preorder', 'sale_type' => 'preorder',
            'pre_order_code_id' => $archived->id, 'preorder_estimated_date' => '2027-01-01',
        ]);
        Book::factory()->create(['title' => 'C Active Preorder', 'sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        Book::factory()->create(['title' => 'B Ready Stock']);
        PreOrderCode::create(['code' => 'PO-EMPTY']);
        $inactive = PreOrderCode::create(['code' => 'PO-INACTIVE']);
        Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $inactive->id, 'is_active' => false]);
        $deleted = PreOrderCode::create(['code' => 'PO-DELETED-BOOK']);
        Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $deleted->id])->delete();
        $ready = PreOrderCode::create(['code' => 'PO-READY-STOCK']);
        Book::factory()->create(['title' => 'D Ready Stock', 'pre_order_code_id' => $ready->id]);

        $this->get(route('books.index', ['sort' => 'title_asc']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('books.data.0.id', $preorder->id)
                ->where('books.data.0.sale_type', 'preorder')
                ->where('books.data.0.preorder_estimated_date', '2027-01-01')
                ->where('books.data.0.pre_order_code.id', $archived->id)
                ->where('books.data.0.pre_order_code.code', 'PO-ARCHIVED')
                ->where('books.data.1.sale_type', 'ready_stock')
                ->where('books.data.1.preorder_estimated_date', null)
                ->where('books.data.1.pre_order_code', null)
                ->where('filters.pre_order_code_id', '')
                ->has('preOrderCodes', 2)
                ->where('preOrderCodes.0.id', $code->id)
                ->where('preOrderCodes.1.id', $archived->id));
    }

    public function test_catalog_filters_by_one_preorder_code_and_preserves_other_filters_on_pagination(): void
    {
        $code = PreOrderCode::create(['code' => 'PO-SELECTED']);
        $other = PreOrderCode::create(['code' => 'PO-OTHER']);
        $category = Category::factory()->create(['slug' => 'cerita']);
        $books = Book::factory()->count(13)->create([
            'author' => 'Penulis Pilihan', 'stock' => 2, 'sale_type' => 'preorder', 'pre_order_code_id' => $code->id,
        ]);
        foreach ($books as $book) {
            $book->categories()->attach($category);
        }
        Book::factory()->create(['author' => 'Penulis Pilihan', 'sale_type' => 'preorder', 'pre_order_code_id' => $other->id])->categories()->attach($category);
        Book::factory()->create(['author' => 'Penulis Pilihan', 'pre_order_code_id' => $code->id])->categories()->attach($category);
        Book::factory()->create(['author' => 'Penulis Pilihan', 'sale_type' => 'preorder', 'pre_order_code_id' => $code->id, 'is_active' => false]);

        $this->get(route('books.index', [
            'pre_order_code_id' => $code->id, 'search' => 'Penulis Pilihan',
            'categories' => ['cerita'], 'availability' => 'available', 'sort' => 'title_asc',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('books.data', 12)
            ->where('books.meta.total', 13)
            ->where('books.data', fn ($data) => collect($data)->every(fn ($book) => $book['pre_order_code']['id'] === $code->id && $book['sale_type'] === 'preorder'))
            ->where('filters.pre_order_code_id', (string) $code->id)
            ->where('filters.search', 'Penulis Pilihan')
            ->where('filters.categories', ['cerita'])
            ->where('filters.availability', 'available')
            ->where('filters.sort', 'title_asc')
            ->where('books.links.next', fn (?string $url) => $url !== null && str_contains($url, 'pre_order_code_id='.$code->id) && str_contains($url, 'sort=title_asc')));
    }

    public function test_catalog_rejects_non_scalar_or_invalid_preorder_code_filters(): void
    {
        foreach ([[1, 2], 'invalid', -1] as $value) {
            $this->get(route('books.index', ['pre_order_code_id' => $value]))
                ->assertSessionHasErrors('pre_order_code_id');
        }
    }

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
