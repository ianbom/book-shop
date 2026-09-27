<?php

namespace Tests\Feature\Customer;

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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerOrderCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cancellation_restores_stock_wallet_and_cancels_pending_shipment_once(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = $customer->wallet()->create(['balance' => 25000]);
        $book = Book::factory()->create(['stock' => 3]);
        $order = Order::create([
            'order_code' => 'ORD-CANCEL-1',
            'user_id' => $customer->id,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 100000,
            'total' => 100000,
            'wallet_amount' => 120000,
        ]);
        $item = $order->items()->create([
            'book_id' => $book->id,
            'name' => $book->title,
            'sku' => $book->sku,
            'value' => 50000,
            'quantity' => 2,
            'weight' => 500,
            'subtotal' => 100000,
            'sale_type' => 'ready_stock',
        ]);
        BookStockMovement::create([
            'book_id' => $book->id,
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'changed_by' => $customer->id,
            'type' => StockMovementType::Order,
            'quantity' => -2,
            'stock_before' => 5,
            'stock_after' => 3,
        ]);
        $wallet->transactions()->create([
            'order_id' => $order->id,
            'created_by' => $customer->id,
            'type' => WalletTransactionType::OrderPayment,
            'direction' => WalletTransactionDirection::Debit,
            'amount' => 100000,
            'balance_before' => 125000,
            'balance_after' => 25000,
        ]);
        $shipment = Shipment::create([
            'order_id' => $order->id,
            'shipment_code' => 'SHP-CANCEL-1',
            'courier_company' => 'jne',
            'courier_type' => 'REG',
            'price' => 10000,
            'status' => 'pending',
        ]);

        $this->actingAs($customer)->patch(route('customer.dashboard.orders.cancel', $order))->assertRedirect();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(PaymentStatus::Refunded, $order->fresh()->payment_status);
        $this->assertSame(125000, (int) $wallet->fresh()->balance);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertSame('cancelled', $shipment->fresh()->status->value);
        $this->assertDatabaseHas('wallet_transactions', [
            'order_id' => $order->id,
            'type' => WalletTransactionType::OrderRefund->value,
            'amount' => 100000,
        ]);

        $this->actingAs($customer)->patch(route('customer.dashboard.orders.cancel', $order))->assertSessionHasErrors('status');
        $this->assertSame(125000, (int) $wallet->fresh()->balance);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertDatabaseCount('wallet_transactions', 2);
        $this->assertDatabaseCount('book_stock_movements', 2);
    }

    public function test_customer_cannot_cancel_another_customers_order_or_an_order_already_processing(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Customer]);
        $other = User::factory()->create(['role' => UserRole::Customer]);
        $otherOrder = Order::create([
            'order_code' => 'ORD-OTHER', 'user_id' => $other->id,
            'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000,
        ]);
        $processingOrder = Order::create([
            'order_code' => 'ORD-PROCESSING',
            'user_id' => $owner->id,
            'status' => OrderStatus::Processing,
            'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000,
        ]);

        $this->actingAs($owner)->patch(route('customer.dashboard.orders.cancel', $otherOrder))->assertNotFound();
        $this->actingAs($owner)->patch(route('customer.dashboard.orders.cancel', $processingOrder))->assertSessionHasErrors('status');

        $this->assertSame(OrderStatus::Pending, $otherOrder->fresh()->status);
        $this->assertSame(OrderStatus::Processing, $processingOrder->fresh()->status);
    }

    public function test_customer_can_cancel_waiting_preorder_without_restoring_unreserved_stock(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = $customer->wallet()->create(['balance' => 0]);
        $order = Order::create([
            'order_code' => 'ORD-PREORDER-CANCEL', 'user_id' => $customer->id,
            'status' => OrderStatus::WaitingPreorder, 'payment_status' => PaymentStatus::Paid,
            'subtotal' => 50000, 'total' => 50000, 'wallet_amount' => 50000,
        ]);
        $wallet->transactions()->create([
            'order_id' => $order->id, 'created_by' => $customer->id,
            'type' => WalletTransactionType::OrderPayment,
            'direction' => WalletTransactionDirection::Debit,
            'amount' => 50000, 'balance_before' => 50000, 'balance_after' => 0,
        ]);

        $this->actingAs($customer)->patch(route('customer.dashboard.orders.cancel', $order))->assertRedirect();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(50000, (int) $wallet->fresh()->balance);
        $this->assertDatabaseMissing('book_stock_movements', ['order_id' => $order->id, 'type' => 'cancellation']);
    }

    public function test_customer_cannot_cancel_shipment_already_sent_to_provider(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = $customer->wallet()->create(['balance' => 0]);
        $order = Order::create([
            'order_code' => 'ORD-BOOKED-1', 'user_id' => $customer->id,
            'subtotal' => 100000, 'total' => 100000, 'wallet_amount' => 100000,
            'payment_status' => PaymentStatus::Paid,
        ]);
        $wallet->transactions()->create([
            'order_id' => $order->id, 'created_by' => $customer->id,
            'type' => WalletTransactionType::OrderPayment,
            'direction' => WalletTransactionDirection::Debit,
            'amount' => 100000, 'balance_before' => 100000, 'balance_after' => 0,
        ]);
        $shipment = Shipment::create([
            'order_id' => $order->id, 'shipment_code' => 'SHP-BOOKED-1',
            'courier_company' => 'jne', 'courier_type' => 'REG', 'price' => 10000,
            'biteship_order_id' => 'provider-order-1',
        ]);

        $this->actingAs($customer)->patch(route('customer.dashboard.orders.cancel', $order))->assertSessionHasErrors('status');

        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
        $this->assertSame('pending', $shipment->fresh()->status->value);
        $this->assertSame(0, (int) $wallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 1);
    }

    public function test_order_list_marks_only_pending_orders_as_cancellable(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        Order::create([
            'order_code' => 'ORD-LIST-PENDING', 'user_id' => $customer->id,
            'status' => OrderStatus::Pending, 'subtotal' => 100000,
            'total' => 100000, 'wallet_amount' => 100000,
        ]);
        Order::create([
            'order_code' => 'ORD-LIST-PROCESSING', 'user_id' => $customer->id,
            'status' => OrderStatus::Processing, 'subtotal' => 100000,
            'total' => 100000, 'wallet_amount' => 100000,
        ]);

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['status' => 'pending']))
            ->assertInertia(fn ($page) => $page->where('orders.data.0.can_cancel', true));
        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['status' => 'processing']))
            ->assertInertia(fn ($page) => $page->where('orders.data.0.can_cancel', false));
    }
}
