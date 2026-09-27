<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\Book;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Models\WalletTopup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_provides_period_charts_action_counts_and_lifetime_wallet_breakdown(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = $customer->wallet()->create(['balance' => 75000]);
        $admin->wallet()->create(['balance' => 99000]);
        $order = Order::create([
            'order_code' => 'ORD-DASH-1', 'user_id' => $customer->id,
            'subtotal' => 105000, 'voucher_discount' => 5000,
            'shipping_cost' => 10000, 'total' => 110000,
            'wallet_amount' => 110000, 'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Paid,
        ]);
        $order->forceFill(['created_at' => now()->subDays(2), 'updated_at' => now()])->save();
        $wallet->transactions()->create([
            'order_id' => $order->id, 'created_by' => $customer->id,
            'type' => WalletTransactionType::OrderPayment,
            'direction' => WalletTransactionDirection::Debit,
            'amount' => 110000, 'balance_before' => 185000, 'balance_after' => 75000,
        ]);
        $wallet->transactions()->create([
            'order_id' => $order->id, 'created_by' => $admin->id,
            'type' => WalletTransactionType::OrderRefund,
            'direction' => WalletTransactionDirection::Credit,
            'amount' => 15000, 'balance_before' => 60000, 'balance_after' => 75000,
        ]);
        Shipment::create([
            'order_id' => $order->id, 'shipment_code' => 'SHP-DASH-1',
            'courier_company' => 'jne', 'courier_type' => 'REG', 'price' => 10000,
            'status' => 'pending',
        ]);
        $voucher = Voucher::create([
            'code' => 'DASH5', 'name' => 'Diskon 5', 'type' => 'fixed',
            'value' => 5000, 'created_by' => $admin->id,
        ]);
        VoucherUsage::create([
            'voucher_id' => $voucher->id, 'user_id' => $customer->id,
            'order_id' => $order->id, 'discount_amount' => 5000,
        ]);
        $cancelledOrder = Order::create([
            'order_code' => 'ORD-DASH-CANCELLED', 'user_id' => $customer->id,
            'subtotal' => 50000, 'voucher_discount' => 2000,
            'shipping_cost' => 0, 'total' => 48000, 'wallet_amount' => 48000,
            'status' => OrderStatus::Cancelled, 'payment_status' => PaymentStatus::Refunded,
        ]);
        VoucherUsage::create([
            'voucher_id' => $voucher->id, 'user_id' => $customer->id,
            'order_id' => $cancelledOrder->id, 'discount_amount' => 2000,
        ]);
        WalletTopup::create([
            'topup_code' => 'TOP-DASH-1', 'user_id' => $customer->id,
            'requested_amount' => 50000, 'proof_image_path' => 'proof.jpg',
            'status' => 'pending',
        ]);
        Book::factory()->create(['stock' => 2, 'sale_type' => 'ready_stock', 'is_active' => true]);
        Book::factory()->create(['stock' => 0, 'sale_type' => 'preorder', 'is_active' => true]);
        Book::factory()->create(['stock' => 0, 'sale_type' => 'ready_stock', 'is_active' => false]);

        $this->actingAs($admin)->get(route('admin.dashboard', ['period' => 7]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('period', 7)
                ->where('operational.orders_to_process', 1)
                ->where('operational.pending_topups', 1)
                ->where('operational.risky_stock', 1)
                ->where('operational.pending_shipments', 1)
                ->where('finance.customer_wallet_balance', '75000.00')
                ->where('finance.gross_order_payments', '110000.00')
                ->where('finance.refunds', '15000.00')
                ->where('finance.book_spend', '100000.00')
                ->where('finance.shipping_spend', '10000.00')
                ->where('finance.voucher_discounts', '5000.00')
                ->where('trend.total', 2)
                ->where('trend.previous_total', 0)
                ->where('statusCounts.0.status', 'pending')
                ->where('statusCounts.0.count', 1)
                ->where('statusCounts.6.count', 1)
                ->where('recentOrders.0.customer_name', $customer->name)
                ->has('actions.low_stock_books', 1));
    }

    public function test_order_trend_includes_empty_days_and_compares_the_previous_matching_period(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        foreach ([
            ['ORD-TREND-NOW', OrderStatus::Pending, now()],
            ['ORD-TREND-PREVIOUS', OrderStatus::Completed, now()->subDays(9)],
        ] as [$code, $status, $createdAt]) {
            $order = Order::create([
                'order_code' => $code, 'user_id' => $customer->id,
                'subtotal' => 10000, 'total' => 10000, 'wallet_amount' => 10000,
                'status' => $status,
            ]);
            $order->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->save();
        }

        $this->actingAs($admin)->get(route('admin.dashboard', ['period' => 7]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trend.total', 1)
                ->where('trend.previous_total', 1)
                ->has('trend.days', 7)
                ->where('statusCounts.5.count', 0));

        $this->get(route('admin.dashboard', ['period' => 30]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trend.total', 2)
                ->where('trend.previous_total', 0)
                ->has('trend.days', 30)
                ->where('statusCounts.5.count', 1));
    }

    public function test_dashboard_rejects_non_admins_and_invalid_periods(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]))
            ->get(route('admin.dashboard'))
            ->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]))
            ->get(route('admin.dashboard', ['period' => 14]))
            ->assertSessionHasErrors('period');
    }

    public function test_empty_dashboard_has_zero_finances_and_a_complete_daily_axis(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]))
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('period', 30)
                ->where('operational.orders_to_process', 0)
                ->where('finance.customer_wallet_balance', '0.00')
                ->where('finance.book_spend', '0.00')
                ->where('finance.shipping_spend', '0.00')
                ->where('trend.total', 0)
                ->has('trend.days', 30)
                ->has('recentOrders', 0)
                ->has('actions.low_stock_books', 0));
    }
}
