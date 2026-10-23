<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OrderPaymentIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
    }

    public function test_shipping_update_preserves_discount_and_exact_cents(): void
    {
        $order = $this->order();
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => '20000'])
            ->assertSessionHasNoErrors();
        $this->assertSame('110000.00', $order->fresh()->total);
        $this->assertSame('10000.00', $order->fresh()->voucher_discount);
        $this->assertSame('0.00', $order->fresh()->wallet_amount);
        $order->update(['subtotal' => '100000.10', 'voucher_discount' => '10000.03']);
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => '20000.02'])
            ->assertSessionHasNoErrors();
        $this->assertSame('110000.09', $order->fresh()->total);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    #[DataProvider('invalidShippingCosts')]
    public function test_invalid_shipping_is_rejected(string $cost): void
    {
        $order = $this->order();
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => $cost])
            ->assertSessionHasErrors('shipping_cost');
        $this->assertSame('100000.00', $order->fresh()->total);
        $this->assertSame('10000.00', $order->fresh()->shipping_cost);
    }

    public static function invalidShippingCosts(): array
    {
        return [['-1'], ['1.001'], ['10000000000000'], ['9999999999999.99'], ['1e3']];
    }

    #[DataProvider('blockedPaymentStatuses')]
    public function test_shipping_cannot_change_after_payment(string $status): void
    {
        $order = $this->order(['payment_status' => $status, 'wallet_amount' => 100000]);
        $wallet = $order->user->wallet()->create(['balance' => 0]);
        $this->payment($order, $wallet->id);
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => 20000])
            ->assertSessionHasErrors('shipping_cost');
        $this->assertSame('100000.00', $order->fresh()->total);
        $this->assertSame('10000.00', $order->fresh()->shipping_cost);
        $this->assertSame('100000.00', $order->fresh()->wallet_amount);
        $this->assertSame('0.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 1);
    }

    public static function blockedPaymentStatuses(): array
    {
        return [['paid'], ['partially_refunded'], ['refunded'], ['unpaid']];
    }

    public function test_shipping_cannot_change_for_cancelled_order_or_processed_shipment(): void
    {
        $order = $this->order(['status' => OrderStatus::Cancelled]);
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => 20000])
            ->assertSessionHasErrors('shipping_cost');
        $order->update(['status' => OrderStatus::Pending]);
        $order->shipments()->create([
            'shipment_code' => 'SHP-INTEGRITY', 'courier_company' => 'jne',
            'courier_type' => 'REG', 'price' => 10000, 'status' => 'pending',
            'biteship_order_id' => 'already-booked',
        ]);
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => 20000])
            ->assertSessionHasErrors('shipping_cost');
        $this->assertSame('100000.00', $order->fresh()->total);
    }

    public function test_manual_payment_status_endpoint_is_retired(): void
    {
        $order = $this->order(['payment_status' => PaymentStatus::Paid, 'wallet_amount' => 100000]);
        $this->patch('/admin/orders/'.$order->id.'/payment-status', ['payment_status' => 'unpaid'])
            ->assertNotFound();
        $this->assertSame(PaymentStatus::Paid, $order->fresh()->payment_status);
    }

    #[DataProvider('blockedShippingSnapshots')]
    public function test_shipping_rejects_paid_or_inconsistent_snapshots_without_ledger(string $status, int $walletAmount): void
    {
        $order = $this->order(['payment_status' => $status, 'wallet_amount' => $walletAmount]);
        $this->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => 20000])
            ->assertSessionHasErrors('shipping_cost');
        $this->assertSame('100000.00', $order->fresh()->total);
    }

    public static function blockedShippingSnapshots(): array
    {
        return [['paid', 0], ['partially_refunded', 0], ['refunded', 0], ['unpaid', 100000]];
    }

    #[DataProvider('refundAmounts')]
    public function test_cancellation_uses_ledger_not_mutable_payment_status(int $alreadyRefunded): void
    {
        $order = $this->order(['wallet_amount' => 100000]);
        $wallet = $order->user->wallet()->create(['balance' => $alreadyRefunded]);
        $this->payment($order, $wallet->id);
        if ($alreadyRefunded > 0) {
            $order->walletTransactions()->create([
                'wallet_id' => $wallet->id, 'type' => 'order_refund', 'direction' => 'credit',
                'amount' => $alreadyRefunded, 'balance_before' => 0, 'balance_after' => $alreadyRefunded,
            ]);
        }
        $book = $this->reserveStock($order);
        $this->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])
            ->assertSessionHasNoErrors();
        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(PaymentStatus::Refunded, $order->fresh()->payment_status);
        $this->assertSame('100000.00', $wallet->fresh()->balance);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertEquals(100000, $order->walletTransactions()->where('type', 'order_refund')->sum('amount'));
        $transactionCount = $order->walletTransactions()->count();
        $this->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])
            ->assertSessionHasErrors('status');
        $this->assertSame($transactionCount, $order->walletTransactions()->count());
        $this->assertSame(5, $book->fresh()->stock);
    }

    public static function refundAmounts(): array
    {
        return [[0], [20000], [100000]];
    }

    #[DataProvider('invalidPayments')]
    public function test_inconsistent_ledger_rolls_back_cancellation(int $amount, string $direction): void
    {
        $order = $this->order(['wallet_amount' => 100000]);
        $wallet = $order->user->wallet()->create(['balance' => 0]);
        $this->payment($order, $wallet->id, $amount, $direction);
        $book = $this->reserveStock($order);
        $this->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])
            ->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
        $this->assertSame(3, $book->fresh()->stock);
        $this->assertSame('0.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('order_status_histories', 0);
        $this->assertDatabaseCount('book_stock_movements', 1);
        $this->assertDatabaseCount('wallet_transactions', 1);
    }

    public static function invalidPayments(): array
    {
        return [[80000, 'debit'], [120000, 'debit'], [100000, 'credit']];
    }

    #[DataProvider('invalidRefunds')]
    public function test_invalid_refund_ledger_rolls_back_cancellation(int $amount, string $direction): void
    {
        $order = $this->order(['wallet_amount' => 100000]);
        $wallet = $order->user->wallet()->create(['balance' => 0]);
        $this->payment($order, $wallet->id);
        $wallet->transactions()->create([
            'order_id' => $order->id, 'type' => 'order_refund', 'direction' => $direction,
            'amount' => $amount, 'balance_before' => 0, 'balance_after' => $amount,
        ]);
        $book = $this->reserveStock($order);
        $this->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])
            ->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
        $this->assertSame(3, $book->fresh()->stock);
        $this->assertSame('0.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 2);
        $this->assertDatabaseCount('book_stock_movements', 1);
    }

    public static function invalidRefunds(): array
    {
        return [[120000, 'credit'], [20000, 'debit']];
    }

    public function test_missing_customer_wallet_rolls_back_cancellation(): void
    {
        $order = $this->order(['wallet_amount' => 100000]);
        $otherWallet = User::factory()->create()->wallet()->create(['balance' => 0]);
        $this->payment($order, $otherWallet->id);
        $book = $this->reserveStock($order);
        $this->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])
            ->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
        $this->assertSame(3, $book->fresh()->stock);
        $this->assertSame('0.00', $otherWallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 1);
        $this->assertDatabaseCount('book_stock_movements', 1);
    }

    public function test_truly_unpaid_order_cancels_without_creating_refund(): void
    {
        $order = $this->order();
        $this->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])
            ->assertSessionHasNoErrors();
        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(PaymentStatus::Unpaid, $order->fresh()->payment_status);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    private function order(array $attributes = []): Order
    {
        return Order::create(array_merge([
            'order_code' => 'ORD-INTEGRITY', 'user_id' => User::factory()->create()->id,
            'subtotal' => 100000, 'voucher_discount' => 10000, 'shipping_cost' => 10000,
            'total' => 100000, 'wallet_amount' => 0,
        ], $attributes));
    }

    private function payment(Order $order, int $walletId, int $amount = 100000, string $direction = 'debit'): void
    {
        $order->walletTransactions()->create([
            'wallet_id' => $walletId, 'type' => 'order_payment', 'direction' => $direction,
            'amount' => $amount, 'balance_before' => $amount, 'balance_after' => 0,
        ]);
    }

    private function reserveStock(Order $order): Book
    {
        $book = Book::factory()->create(['stock' => 3]);
        $item = $order->items()->create([
            'book_id' => $book->id, 'name' => $book->title, 'value' => 50000,
            'quantity' => 2, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'ready_stock',
        ]);
        BookStockMovement::create([
            'book_id' => $book->id, 'order_id' => $order->id, 'order_item_id' => $item->id,
            'type' => 'order', 'quantity' => -2, 'stock_before' => 5, 'stock_after' => 3,
        ]);

        return $book;
    }
}
