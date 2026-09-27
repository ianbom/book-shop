<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_must_log_in_and_admin_cannot_add_to_cart(): void
    {
        $book = Book::factory()->create(['stock' => 3]);
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->where('cartCount', 0));
        $this->post('/cart/items', ['book_id' => $book->id])->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post('/cart/items', ['book_id' => $book->id])->assertForbidden();
        $this->assertDatabaseCount('carts', 0);
    }

    public function test_customer_can_add_multiple_books_and_increment_existing_item(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $first = Book::factory()->create(['stock' => 3]);
        $second = Book::factory()->create(['stock' => 2]);
        $this->actingAs($user)->post('/cart/items', ['book_id' => $first->id])->assertRedirect();
        $this->post('/cart/items', ['book_id' => $first->id])->assertRedirect();
        $this->post('/cart/items', ['book_id' => $second->id])->assertRedirect();
        $this->assertDatabaseCount('carts', 1);
        $this->assertDatabaseCount('cart_items', 2);
        $this->assertDatabaseHas('cart_items', ['cart_id' => $user->cart->id, 'book_id' => $first->id, 'quantity' => 2]);
        $this->get(route('books.index'))->assertInertia(fn (Assert $page) => $page->where('cartCount', 3));
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->where('cartCount', 3));
        $this->assertSame(3, $first->fresh()->stock);
    }

    public function test_inactive_deleted_and_out_of_stock_books_cannot_be_added(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $book = Book::factory()->create(['stock' => 2]);
        $this->actingAs($user)->post('/cart/items', ['book_id' => $book->id])->assertRedirect();
        $this->post('/cart/items', ['book_id' => $book->id])->assertRedirect();
        $this->post('/cart/items', ['book_id' => $book->id])->assertSessionHasErrors('book_id');
        $this->assertDatabaseHas('cart_items', ['book_id' => $book->id, 'quantity' => 2]);
        $book->update(['is_active' => false]);
        $this->post('/cart/items', ['book_id' => $book->id])->assertSessionHasErrors('book_id');
        $book->update(['is_active' => true]);
        $book->delete();
        $this->post('/cart/items', ['book_id' => $book->id])->assertSessionHasErrors('book_id');
        $this->post('/cart/items', ['book_id' => 999999])->assertSessionHasErrors('book_id');
        $this->assertDatabaseCount('cart_items', 1);
        $this->assertDatabaseCount('carts', 1);
    }
}
