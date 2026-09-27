<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OrderDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_detail_contains_current_order_relations_and_requires_admin(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->order($customer);
        $order->items()->create(['name' => 'Buku Pilihan', 'sku' => 'BK-1', 'value' => 100000, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'ready_stock']);
        $shipment = $this->shipment($order);
        $shipment->statusHistories()->create(['status' => 'pending', 'description' => 'Disiapkan', 'raw_payload' => ['secret' => 'hidden']]);
        $url = route('admin.orders.show', $order);

        $this->get($url)->assertRedirect(route('login'));
        $this->actingAs($customer)->get($url)->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]))->get($url)
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/show')
                ->where('order.items.0.name', 'Buku Pilihan')
                ->where('order.shipments.0.shipment_code', 'SHP-DETAIL-1')
                ->has('order.shipments.0.status_histories', 1)
                ->missing('order.shipments.0.status_histories.0.raw_payload'));
    }

    public function test_cancellation_restores_only_reserved_stock_and_refunds_wallet_once(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = $customer->wallet()->create(['balance' => 0]);
        $book = Book::factory()->create(['stock' => 3]);
        $order = $this->order($customer);
        $item = $order->items()->create(['book_id' => $book->id, 'name' => $book->title, 'sku' => 'BK-1', 'value' => 100000, 'quantity' => 2, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'ready_stock']);
        BookStockMovement::create(['book_id' => $book->id, 'order_id' => $order->id, 'order_item_id' => $item->id, 'type' => StockMovementType::Order, 'quantity' => -2, 'stock_before' => 5, 'stock_after' => 3]);
        $wallet->transactions()->create(['order_id' => $order->id, 'type' => WalletTransactionType::OrderPayment, 'direction' => WalletTransactionDirection::Debit, 'amount' => 100000, 'balance_before' => 100000, 'balance_after' => 0]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])->assertRedirect();
        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(PaymentStatus::Refunded, $order->fresh()->payment_status);
        $this->assertSame('100000.00', $wallet->fresh()->balance);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertDatabaseHas('wallet_transactions', ['order_id' => $order->id, 'type' => 'order_refund', 'amount' => 100000]);
        $this->assertDatabaseHas('book_stock_movements', ['order_item_id' => $item->id, 'type' => 'cancellation', 'quantity' => 2]);
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])->assertSessionHasErrors('status');
        $this->assertSame('100000.00', $wallet->fresh()->balance);
    }

    public function test_order_and_shipment_transitions_are_strict_and_shipment_is_scoped(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->order($customer);
        $shipment = $this->shipment($order);
        $otherShipment = $this->shipment($this->order($customer, 'ORD-DETAIL-OTHER'), 'SHP-DETAIL-OTHER');

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'shipping'])->assertSessionHasErrors('status');
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'processing'])->assertRedirect();
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->id, 'status' => 'processing']);
        $this->actingAs($customer)->patch(route('admin.orders.shipments.status', [$order, $shipment]), ['status' => 'booked'])->assertForbidden();
        $this->actingAs($admin)->patch(route('admin.orders.shipments.status', [$order, $otherShipment]), ['status' => 'booked'])->assertNotFound();
        $url = route('admin.orders.shipments.status', [$order, $shipment]);
        $this->actingAs($admin)->patch($url, ['status' => 'delivered'])->assertSessionHasErrors('status');
        $shipment->update(['biteship_order_id' => 'provider-detail']);
        $this->actingAs($admin)->patch($url, ['status' => 'booked', 'description' => 'Diserahkan ke kurir'])->assertRedirect();
        $this->assertDatabaseHas('shipment_status_histories', ['shipment_id' => $shipment->id, 'status' => 'booked', 'description' => 'Diserahkan ke kurir']);
        $this->assertSame(OrderStatus::Processing, $order->fresh()->status);
    }

    public function test_preorder_cancellation_refunds_remaining_wallet_without_restoring_unreserved_stock(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = $customer->wallet()->create(['balance' => 20000]);
        $book = Book::factory()->create(['stock' => 4, 'sale_type' => 'preorder']);
        $order = $this->order($customer);
        $order->update(['status' => OrderStatus::WaitingPreorder, 'payment_status' => PaymentStatus::PartiallyRefunded]);
        $order->items()->create(['book_id' => $book->id, 'name' => $book->title, 'sku' => 'PRE-1', 'value' => 100000, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'preorder']);
        $wallet->transactions()->create(['order_id' => $order->id, 'type' => WalletTransactionType::OrderPayment, 'direction' => WalletTransactionDirection::Debit, 'amount' => 100000, 'balance_before' => 100000, 'balance_after' => 0]);
        $wallet->transactions()->create(['order_id' => $order->id, 'type' => WalletTransactionType::OrderRefund, 'direction' => WalletTransactionDirection::Credit, 'amount' => 20000, 'balance_before' => 0, 'balance_after' => 20000]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])->assertRedirect();
        $this->assertSame('100000.00', $wallet->fresh()->balance);
        $this->assertSame(4, $book->fresh()->stock);
        $this->assertDatabaseHas('wallet_transactions', ['order_id' => $order->id, 'type' => 'order_refund', 'amount' => 80000]);
        $this->assertDatabaseMissing('book_stock_movements', ['order_id' => $order->id, 'type' => 'cancellation']);
    }

    public function test_cancellation_rolls_back_if_payment_transaction_is_missing(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $book = Book::factory()->create(['stock' => 3]);
        $order = $this->order($customer);
        $item = $order->items()->create(['book_id' => $book->id, 'name' => $book->title, 'sku' => 'BK-1', 'value' => 100000, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'ready_stock']);
        BookStockMovement::create(['book_id' => $book->id, 'order_id' => $order->id, 'order_item_id' => $item->id, 'type' => StockMovementType::Order, 'quantity' => -1, 'stock_before' => 4, 'stock_after' => 3]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
        $this->assertSame(3, $book->fresh()->stock);
        $this->assertDatabaseMissing('book_stock_movements', ['order_id' => $order->id, 'type' => 'cancellation']);
    }

    public function test_detail_includes_shipping_voucher_payment_history_and_stock_data(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer, 'phone' => '0812345678']);
        $order = $this->order($customer);
        $order->shippingAddress()->create([
            'destination_contact_name' => 'Nama Penerima',
            'destination_contact_phone' => '0812345678',
            'destination_address' => 'Jalan Buku 1',
            'destination_postal_code' => '12345',
            'province_name' => 'Jawa Barat',
            'city_name' => 'Bandung',
            'district_name' => 'Coblong',
            'subdistrict_name' => 'Dago',
        ]);
        $voucher = Voucher::create(['code' => 'DETAIL5', 'name' => 'Diskon detail', 'type' => 'fixed', 'value' => 5000, 'created_by' => $admin->id]);
        $order->update(['voucher_id' => $voucher->id, 'voucher_discount' => 5000]);
        VoucherUsage::create(['voucher_id' => $voucher->id, 'user_id' => $customer->id, 'order_id' => $order->id, 'discount_amount' => 5000, 'created_at' => now()]);
        $wallet = $customer->wallet()->create(['balance' => 0]);
        $wallet->transactions()->create(['order_id' => $order->id, 'type' => WalletTransactionType::OrderPayment, 'direction' => WalletTransactionDirection::Debit, 'amount' => 100000, 'balance_before' => 100000, 'balance_after' => 0]);
        $book = Book::factory()->create();
        BookStockMovement::create(['book_id' => $book->id, 'order_id' => $order->id, 'changed_by' => $admin->id, 'type' => StockMovementType::Order, 'quantity' => -1, 'stock_before' => 5, 'stock_after' => 4]);
        $order->statusHistories()->create(['status' => 'pending', 'changed_by' => $admin->id, 'note' => 'Order diterima']);

        $this->actingAs($admin)->get(route('admin.orders.show', $order))
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.customer.phone', '0812345678')
                ->where('order.shipping_address.city', 'Bandung')
                ->where('order.voucher.code', 'DETAIL5')
                ->where('order.voucher.discount', '5000.00')
                ->where('order.wallet_transactions.0.type', 'order_payment')
                ->where('order.status_histories.0.changed_by', $admin->name)
                ->where('order.stock_movements.0.quantity', -1));
    }

    private function order(User $customer, string $code = 'ORD-DETAIL-1'): Order
    {
        return Order::create(['order_code' => $code, 'user_id' => $customer->id, 'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000, 'payment_status' => PaymentStatus::Paid]);
    }

    private function shipment(Order $order, string $code = 'SHP-DETAIL-1'): Shipment
    {
        return $order->shipments()->create(['shipment_code' => $code, 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000]);
    }
}
