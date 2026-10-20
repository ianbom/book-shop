<?php

namespace Tests\Feature\Admin;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookFormTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_automatically_sets_shipping_category_with_or_without_a_client_value(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        foreach ([[], ['shipping_category' => 'fashion']] as $categoryInput) {
            $data = [...$this->bookData(), ...$categoryInput];
            $this->post(route('admin.books.store'), $data)->assertSessionHasNoErrors()->assertRedirect();
            $this->assertDatabaseHas('books', [
                'slug' => $data['slug'], 'shipping_category' => 'others', 'stock' => 2, 'is_active' => false,
            ]);
        }
    }

    public function test_edit_normalizes_shipping_category_without_changing_stock_or_preventing_inactive_books(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        foreach ([[], ['shipping_category' => 'fashion']] as $categoryInput) {
            $book = Book::factory()->create(['shipping_category' => 'hobby', 'stock' => 7]);
            $data = [...$this->bookData(), 'slug' => $book->slug, ...$categoryInput];
            $this->put(route('admin.books.update', $book), $data)->assertSessionHasNoErrors()->assertRedirect();
            $this->assertDatabaseHas('books', [
                'id' => $book->id, 'shipping_category' => 'others', 'stock' => 7, 'is_active' => false,
            ]);
        }
    }

    private function bookData(): array
    {
        $data = Book::factory()->make()->getAttributes();
        unset($data['shipping_category']);

        return [...$data, 'initial_stock' => 2, 'is_active' => false, 'category_ids' => []];
    }
}
