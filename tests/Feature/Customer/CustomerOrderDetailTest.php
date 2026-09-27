<?php

namespace Tests\Feature\Customer;

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\BookImage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerOrderDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_detail_is_visible_only_to_its_customer(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Customer]);
        $other = User::factory()->create(['role' => UserRole::Customer]);
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $order = Order::create(['order_code' => 'ORD-DETAIL-1', 'user_id' => $owner->id, 'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000]);
        $url = route('customer.dashboard.orders.show', $order);

        $this->get($url)->assertRedirect(route('login'));
        $this->actingAs($admin)->get($url)->assertForbidden();
        $this->actingAs($other)->get($url)->assertNotFound();
        $this->actingAs($owner)->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('customer/dashboard/orders/show')
            ->where('order.order_code', 'ORD-DETAIL-1')
            ->has('order.items', 0)
            ->has('order.shipments', 0)
            ->where('order.shipping_address', null)
            ->where('order.voucher', null));
    }

    public function test_detail_contains_snapshot_but_no_internal_fields(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Customer]);
        $order = Order::create(['order_code' => 'ORD-DETAIL-2', 'user_id' => $owner->id, 'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000]);
        OrderItem::create(['order_id' => $order->id, 'name' => 'Buku Contoh', 'sku' => 'BUKU-1', 'weight' => 500, 'sale_type' => 'ready_stock', 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        OrderStatusHistory::create(['order_id' => $order->id, 'status' => 'pending', 'note' => 'Diproses', 'created_at' => now()]);

        $this->actingAs($owner)->get(route('customer.dashboard.orders.show', $order))
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.items.0.name', 'Buku Contoh')
                ->where('order.items.0.primary_image', null)
                ->where('order.status_histories.0.status', 'pending')
                ->missing('order.items.0.book_id')
                ->missing('order.status_histories.0.changed_by')
                ->missing('order.wallet_transactions.0.balance_after'));
    }

    public function test_detail_shows_primary_book_cover_even_when_book_is_archived(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Customer]);
        $book = Book::factory()->create();
        BookImage::factory()->create(['book_id' => $book->id, 'image_path' => 'books/other.webp', 'is_primary' => false]);
        BookImage::factory()->create(['book_id' => $book->id, 'image_path' => 'books/cover.webp', 'alt_text' => 'Sampul buku', 'is_primary' => true]);
        $order = Order::create(['order_code' => 'ORD-COVER-1', 'user_id' => $owner->id, 'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000]);
        OrderItem::create(['order_id' => $order->id, 'book_id' => $book->id, 'name' => 'Buku Contoh', 'sku' => 'BUKU-1', 'weight' => 500, 'sale_type' => 'ready_stock', 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        $book->delete();

        $this->actingAs($owner)->get(route('customer.dashboard.orders.show', $order))
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.items.0.primary_image.url', Storage::disk('public')->url('books/cover.webp'))
                ->where('order.items.0.primary_image.alt_text', 'Sampul buku')
                ->missing('order.items.0.book_id'));
    }
}
