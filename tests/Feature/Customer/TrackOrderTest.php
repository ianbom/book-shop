<?php

namespace Tests\Feature\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\StoreSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrackOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_open_tracking_form(): void
    {
        $this->get(route('track-order.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/track-order/index')
            );
    }

    public function test_customer_can_track_order_by_public_order_code(): void
    {
        StoreSetting::factory()->create(['whatsapp_number' => '0812-3456-7890']);
        $order = Order::factory()->create([
            'order_code' => 'BK-TRACK123',
            'status' => OrderStatus::Shipping,
            'payment_status' => PaymentStatus::Paid,
            'book_title' => 'Atomic Habits',
            'book_author' => 'James Clear',
            'book_isbn' => '9780735211292',
            'quantity' => 3,
            'unit_price' => 125000,
            'subtotal' => 375000,
            'shipping_cost' => 0,
            'total' => 375000,
        ]);

        OrderStatusHistory::factory()->create([
            'order_id' => $order->id,
            'status' => OrderStatus::Pending,
            'note' => 'Pesanan dibuat.',
            'created_at' => now()->subDays(2),
            'changed_by' => null,
        ]);
        OrderStatusHistory::factory()->create([
            'order_id' => $order->id,
            'status' => OrderStatus::Shipping,
            'note' => 'Pesanan dikirim.',
            'created_at' => now()->subDay(),
            'changed_by' => null,
        ]);

        $this->get(route('track-order.show', ['orderCode' => $order->order_code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/track-order/show')
                ->where('order.order_code', 'BK-TRACK123')
                ->where('order.book_title', 'Atomic Habits')
                ->where('order.book_author', 'James Clear')
                ->where('order.book_isbn', '9780735211292')
                ->where('order.quantity', 3)
                ->where('order.unit_price', '125000.00')
                ->where('order.total', '375000.00')
                ->where('order.status', 'shipping')
                ->where('order.payment_status', 'paid')
                ->has('order.status_histories', 2)
                ->where('order.status_histories.0.status', 'pending')
                ->where('order.status_histories.1.status', 'shipping')
                ->where('order.whatsapp_url', fn (?string $url) => str_contains((string) $url, 'BK-TRACK123'))
                ->missing('order.id')
                ->missing('order.customer_phone')
                ->missing('order.customer_address')
                ->missing('order.status_histories.0.changed_by')
            );
    }

    public function test_unknown_order_code_returns_customer_friendly_not_found_page(): void
    {
        $this->get(route('track-order.show', ['orderCode' => 'BK-NOTFOUND']))
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/track-order/show')
                ->where('order', null)
                ->where('error', 'Pesanan tidak ditemukan. Periksa kembali kode order Anda.')
            );
    }

    public function test_soft_deleted_order_is_not_exposed(): void
    {
        $order = Order::factory()->create(['order_code' => 'BK-DELETED']);
        $order->delete();

        $this->get(route('track-order.show', ['orderCode' => 'BK-DELETED']))
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->where('order', null)
            );
    }

    public function test_tracking_omits_whatsapp_action_when_store_number_is_invalid(): void
    {
        StoreSetting::factory()->create(['whatsapp_number' => 'not-a-number']);
        $order = Order::factory()->create(['order_code' => 'BK-NOWA']);

        $this->get(route('track-order.show', ['orderCode' => $order->order_code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.whatsapp_url', null)
            );
    }
}
