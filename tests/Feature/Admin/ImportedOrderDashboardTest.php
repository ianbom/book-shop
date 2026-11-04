<?php

namespace Tests\Feature\Admin;

use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ImportedOrderDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    public function test_historical_and_approved_transfer_totals_remain_separate_from_wallet_finance(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $wallet = $customer->wallet()->create(['balance' => '75.25']);
        $website = Order::factory()->create(['user_id' => $customer->id, 'shipping_cost' => '10.10']);
        $wallet->transactions()->create([
            'order_id' => $website->id, 'created_by' => $customer->id,
            'type' => WalletTransactionType::OrderPayment, 'direction' => WalletTransactionDirection::Debit,
            'amount' => '110.30', 'balance_before' => '185.55', 'balance_after' => '75.25',
        ]);
        $wallet->transactions()->create([
            'order_id' => $website->id, 'created_by' => $customer->id,
            'type' => WalletTransactionType::OrderRefund, 'direction' => WalletTransactionDirection::Credit,
            'amount' => '5.15', 'balance_before' => '70.10', 'balance_after' => '75.25',
        ]);
        $imported = $this->importedOrder($customer, 'pending', 'pending');
        foreach (['0.10', '0.20', '1234567890.12'] as $paid) {
            $this->item($imported, $paid, $paid);
        }
        $archived = $this->importedOrder($customer, 'completed', 'completed');
        $this->item($archived, '2.03', '2.03');
        $this->item($website, '9.99', '9.99');
        $this->submission($imported, 'approved', '0.10');
        $this->submission($imported, 'approved', '0.20');
        $this->submission($imported, 'pending', '800.50');
        $this->submission($imported, 'rejected', '900.75');
        $this->submission($website, 'approved', '999.99');

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get(route('admin.dashboard'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('finance.customer_wallet_balance', '75.25')
            ->where('finance.gross_order_payments', '110.30')
            ->where('finance.refunds', '5.15')
            ->where('finance.book_spend', '100.20')
            ->where('finance.shipping_spend', '10.10')
            ->where('finance.voucher_discounts', '0.00')
            ->where('finance.imported_historical_paid', '1234567892.45')
            ->where('finance.approved_order_transfers', '0.30'));
        Http::assertNothingSent();
    }

    public function test_lifetime_payment_totals_can_exceed_one_order_storage_limit(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        foreach (range(1, 2) as $index) {
            $order = $this->importedOrder($customer, 'completed', 'completed', [
                'subtotal' => '6000000000000.00', 'total' => '6000000000000.00', 'shipping_cost' => '0.00',
            ]);
            $this->item($order, '6000000000000.00', '6000000000000.00');
            $this->submission($order, 'approved', '6000000000000.00');
        }
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get(route('admin.dashboard'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('finance.imported_historical_paid', '12000000000000.00')
            ->where('finance.approved_order_transfers', '12000000000000.00'));
        Http::assertNothingSent();
    }

    public function test_website_trend_and_statuses_ignore_import_dates_but_recent_orders_identify_source(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(12));
        $customer = User::factory()->create(['role' => 'customer']);
        Order::factory()->create(['user_id' => $customer->id, 'order_code' => 'WEB-NOW', 'status' => 'pending']);
        Order::factory()->create(['user_id' => $customer->id, 'created_at' => now()->subDays(9), 'status' => 'completed']);
        $this->importedOrder($customer, 'completed', 'completed', ['order_code' => 'IMP-NOW']);
        $this->importedOrder($customer, 'pending', 'pending', ['created_at' => now()->subDays(9)]);
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        foreach ([7, 30] as $period) {
            $this->get(route('admin.dashboard', ['period' => $period]))
                ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('trend.total', $period === 7 ? 1 : 2)
                ->where('trend.previous_total', $period === 7 ? 1 : 0)
                ->has('trend.days', $period)
                ->where('trend.days.'.($period - 1).'.count', 1)
                ->where('statusCounts.0.count', 1)
                ->where('statusCounts.5.count', $period === 7 ? 0 : 1)
                ->where('recentOrders', fn ($orders) => collect($orders)->contains(fn ($order) => $order['order_code'] === 'IMP-NOW' && $order['source'] === 'imported')
                    && collect($orders)->contains(fn ($order) => $order['order_code'] === 'WEB-NOW' && $order['source'] === 'website')));
        }
        Http::assertNothingSent();
    }

    public function test_operational_queues_separate_settlement_review_and_ready_orders_using_original_status(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $website = Order::factory()->create(['user_id' => $customer->id, 'status' => 'pending']);
        $website->shipments()->create(['shipment_code' => 'DASH-WEB', 'courier_company' => 'jne', 'courier_type' => 'REG', 'status' => 'pending', 'price' => '10.00']);
        foreach (['shipping', 'completed', 'cancelled'] as $original) {
            $archive = $this->importedOrder($customer, 'pending', $original);
            $this->item($archive);
            $this->submission($archive, 'pending', '30.00');
            $archive->shipments()->create(['shipment_code' => 'DASH-ARCHIVE-'.$original, 'courier_company' => 'jne', 'courier_type' => 'REG', 'status' => 'pending', 'price' => '10.00']);
        }
        $waiting = $this->importedOrder($customer, 'processing', 'processing');
        $this->item($waiting);
        $waiting->shipments()->create(['shipment_code' => 'DASH-WAITING', 'courier_company' => 'jne', 'courier_type' => 'REG', 'status' => 'pending', 'price' => '10.00']);
        $review = $this->importedOrder($customer, 'pending', 'pending', ['shipping_selected_at' => now()]);
        $this->item($review);
        $this->submission($review, 'pending', '30.00');
        $noShipping = $this->importedOrder($customer, 'pending', 'pending', ['payment_status' => 'paid']);
        $this->item($noShipping, '100.00', '100.00');
        $unbalanced = $this->importedOrder($customer, 'packing', 'packing', ['payment_status' => 'paid', 'shipping_selected_at' => now()]);
        $this->item($unbalanced);
        $this->submission($unbalanced, 'approved', '10.00');
        foreach (['pending', 'shipping'] as $status) {
            $ready = $this->importedOrder($customer, $status, 'pending', ['payment_status' => 'paid', 'shipping_selected_at' => now()]);
            $this->item($ready);
            $this->submission($ready, 'approved', '30.00');
            $ready->shipments()->create(['shipment_code' => 'DASH-READY-'.$status, 'courier_company' => 'jne', 'courier_type' => 'REG', 'status' => 'pending', 'price' => '10.00']);
        }
        $cancelled = Order::factory()->create(['user_id' => $customer->id, 'status' => 'cancelled']);
        $cancelled->shipments()->create(['shipment_code' => 'DASH-CANCELLED', 'courier_company' => 'jne', 'courier_type' => 'REG', 'status' => 'pending', 'price' => '10.00']);

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get(route('admin.dashboard'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('operational.orders_to_process', 2)
                ->where('operational.pending_orders', 2)
                ->where('operational.awaiting_settlement', 3)
                ->where('operational.pending_payment_reviews', 1)
                ->where('operational.pending_shipments', 3));
        Http::assertNothingSent();
    }

    private function importedOrder(User $customer, string $status, string $originalStatus, array $attributes = []): Order
    {
        return Order::factory()->create(array_merge([
            'user_id' => $customer->id, 'source' => 'imported', 'status' => $status,
            'import_metadata' => ['original_status' => $originalStatus],
            'subtotal' => '100.00', 'shipping_cost' => '10.00', 'total' => '110.00',
            'wallet_amount' => '0.00',
        ], $attributes));
    }

    private function item(Order $order, string $subtotal = '100.00', string $paid = '80.00'): void
    {
        $order->items()->create([
            'name' => 'Snapshot buku', 'sale_type' => 'preorder', 'value' => $subtotal,
            'quantity' => 1, 'weight' => 100, 'subtotal' => $subtotal,
            'historical_paid' => $paid, 'historical_dp' => '999.99',
        ]);
    }

    private function submission(Order $order, string $status, string $amount): void
    {
        $order->paymentSubmissions()->create([
            'uploaded_by' => $order->user_id, 'submission_key' => (string) Str::uuid(),
            'amount' => $amount, 'proof_path' => 'order-payments/dashboard.png',
            'status' => $status, 'pending_slot' => $status === 'pending' ? 1 : null,
            'bank_account_snapshot' => ['bank_name' => 'Bank', 'account_number' => '001', 'account_holder' => 'Toko'],
            'billing_fingerprint' => str_repeat('a', 64),
        ]);
    }
}
