<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\Cart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CartPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_a_customer_can_view_the_cart(): void
    {
        $this->get('/customer/dashboard/carts')->assertRedirect(route('login'));

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/customer/dashboard/carts')->assertForbidden();
        $this->patch('/cart/items/1', ['quantity' => 2])->assertForbidden();
        $this->delete('/cart/items/1')->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => 'customer']))
            ->get('/customer/dashboard/carts')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/dashboard/carts/index')
                ->has('items', 0)
                ->where('subtotal', '0.00')
                ->where('total', '0.00'));

        $this->assertDatabaseCount('carts', 0);
    }

    public function test_cart_shows_only_own_items_and_calculates_current_prices(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $cart = Cart::create(['user_id' => $customer->id]);
        $first = Book::factory()->create(['price' => 10000, 'stock' => 5]);
        $second = Book::factory()->create(['price' => 12500, 'stock' => 5]);
        $cart->items()->create(['book_id' => $first->id, 'quantity' => 2]);
        $cart->items()->create(['book_id' => $second->id, 'quantity' => 3]);
        Cart::create(['user_id' => User::factory()->create(['role' => 'customer'])->id])
            ->items()->create(['book_id' => $first->id, 'quantity' => 1]);
        $first->update(['price' => 11000]);

        $this->actingAs($customer)->get('/customer/dashboard/carts')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/dashboard/carts/index')
                ->has('items', 2)
                ->where('items.0.book.id', $first->id)
                ->where('items.0.quantity', 2)
                ->where('items.0.line_subtotal', '22000.00')
                ->where('subtotal', '59500.00')
                ->where('total', '59500.00')
                ->where('cartCount', 5));
    }

    public function test_quantity_changes_validate_stock_and_ownership(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $cart = Cart::create(['user_id' => $customer->id]);
        $book = Book::factory()->create(['price' => 12500, 'stock' => 3]);
        $item = $cart->items()->create(['book_id' => $book->id, 'quantity' => 1]);
        $other = User::factory()->create(['role' => 'customer']);

        $this->actingAs($other)->patch("/cart/items/{$item->id}", ['quantity' => 2])->assertNotFound();
        $this->actingAs($customer)->patch("/cart/items/{$item->id}", ['quantity' => 2])->assertRedirect();
        $this->assertDatabaseHas('cart_items', ['id' => $item->id, 'quantity' => 2]);
        $this->get('/customer/dashboard/carts')->assertInertia(fn (Assert $page) => $page
            ->where('items.0.line_subtotal', '25000.00')
            ->where('total', '25000.00')
            ->where('cartCount', 2));
        $this->patch("/cart/items/{$item->id}", ['quantity' => 4])->assertSessionHasErrors('quantity');
        $this->patch("/cart/items/{$item->id}", ['quantity' => 0])->assertSessionHasErrors('quantity');
        $this->assertDatabaseHas('cart_items', ['id' => $item->id, 'quantity' => 2]);
        $this->assertSame(3, $book->fresh()->stock);
    }

    public function test_only_the_owner_can_remove_an_item(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $item = Cart::create(['user_id' => $customer->id])->items()
            ->create(['book_id' => Book::factory()->create(['stock' => 1])->id, 'quantity' => 1]);
        $other = User::factory()->create(['role' => 'customer']);

        $this->actingAs($other)->delete("/cart/items/{$item->id}")->assertNotFound();
        $this->actingAs($customer)->delete("/cart/items/{$item->id}")->assertRedirect();
        $this->assertDatabaseCount('cart_items', 0);
        $this->get('/customer/dashboard/carts')->assertInertia(fn (Assert $page) => $page
            ->has('items', 0)
            ->where('total', '0.00')
            ->where('cartCount', 0));
    }

    public function test_unavailable_book_can_still_be_removed(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $book = Book::factory()->create(['price' => 10000, 'stock' => 2]);
        $item = Cart::create(['user_id' => $customer->id])->items()
            ->create(['book_id' => $book->id, 'quantity' => 1]);

        $book->update(['is_active' => false, 'stock' => 0]);
        $this->actingAs($customer)->patch("/cart/items/{$item->id}", ['quantity' => 2])->assertSessionHasErrors('quantity');

        $book->delete();
        $this->get('/customer/dashboard/carts')->assertInertia(fn (Assert $page) => $page
            ->where('items.0.book', null)
            ->where('items.0.line_subtotal', '0.00')
            ->where('total', '0.00'));
        $this->delete("/cart/items/{$item->id}")->assertRedirect();
        $this->assertDatabaseCount('cart_items', 0);
    }
}
