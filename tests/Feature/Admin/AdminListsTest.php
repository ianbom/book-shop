<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\BookImage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shipment;
use App\Models\User;
use App\Models\Voucher;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminListsTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admins_can_view_the_four_lists(): void
    {
        $pages = [
            ['admin.shipments.index', 'admin/shipments/index', 'shipments'],
            ['admin.top-ups.index', 'admin/top-ups/index', 'topups'],
            ['admin.wallet-transactions.index', 'admin/wallet-transactions/index', 'transactions'],
            ['admin.vouchers.index', 'admin/vouchers/index', 'vouchers'],
        ];

        foreach ($pages as [$routeName, $component, $property]) {
            auth()->logout();
            $this->get(route($routeName))->assertRedirect(route('login'));
            $this->actingAs(User::factory()->create())->get(route($routeName))->assertForbidden();
            $this->actingAs($this->admin())->get(route($routeName))
                ->assertInertia(fn (Assert $page) => $page->component($component)->has("{$property}.meta.links"));
        }
    }

    public function test_shipments_search_filter_sort_and_reject_unknown_sort(): void
    {
        $admin = $this->admin();
        $customer = User::factory()->create(['name' => 'Rani Pelanggan']);
        $order = $this->order($customer, 'ORD-RANI');
        Shipment::create([
            'order_id' => $order->id,
            'shipment_code' => 'SHP-OLD',
            'courier_company' => 'jne',
            'courier_type' => 'reg',
            'delivery_type' => 'now',
            'price' => 30000,
            'status' => 'pending',
        ])->forceFill(['created_at' => '2026-09-20 10:00:00'])->save();
        Shipment::create([
            'order_id' => $order->id,
            'shipment_code' => 'SHP-NEW',
            'courier_company' => 'jne',
            'courier_type' => 'yes',
            'delivery_type' => 'scheduled',
            'price' => 15000,
            'status' => 'booked',
        ])->forceFill(['created_at' => '2026-09-21 10:00:00'])->save();

        $this->actingAs($admin)->get(route('admin.shipments.index', [
            'search' => 'Rani', 'status' => 'booked', 'delivery_type' => 'scheduled',
            'date_from' => '2026-09-21', 'date_to' => '2026-09-21',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('shipments.data', 1)
            ->where('shipments.data.0.shipment_code', 'SHP-NEW')
            ->where('filters.status', 'booked'));

        $this->actingAs($admin)->get(route('admin.shipments.index', ['sort' => 'price', 'sort_direction' => 'asc']))
            ->assertInertia(fn (Assert $page) => $page->where('shipments.data.0.shipment_code', 'SHP-NEW'));
        $this->actingAs($admin)->get(route('admin.shipments.index', ['sort' => 'drop table']))
            ->assertSessionHasErrors('sort');
        $this->actingAs($admin)->get(route('admin.shipments.index', ['date_from' => '2026-09-22', 'date_to' => '2026-09-21']))
            ->assertSessionHasErrors('date_to');
    }

    public function test_topups_search_status_date_and_amount_sort(): void
    {
        $admin = $this->admin();
        $customer = User::factory()->create(['name' => 'Bima Pembeli']);
        foreach ([['TOP-A', 20000, 'pending', '2026-09-20'], ['TOP-B', 50000, 'approved', '2026-09-21']] as [$code, $amount, $status, $date]) {
            WalletTopup::create([
                'topup_code' => $code,
                'user_id' => $customer->id,
                'requested_amount' => $amount,
                'proof_image_path' => 'proofs/test.jpg',
                'status' => $status,
            ])->forceFill(['created_at' => "$date 12:00:00"])->save();
        }

        $this->actingAs($admin)->get(route('admin.top-ups.index', [
            'search' => 'Bima', 'status' => 'approved', 'date_from' => '2026-09-21', 'date_to' => '2026-09-21',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('topups.data', 1)
            ->where('topups.data.0.topup_code', 'TOP-B')
            ->missing('topups.data.0.proof_image_path'));

        $this->actingAs($admin)->get(route('admin.top-ups.index', ['sort' => 'requested_amount', 'sort_direction' => 'asc']))
            ->assertInertia(fn (Assert $page) => $page->where('topups.data.0.topup_code', 'TOP-A'));
    }

    public function test_wallet_transactions_search_type_direction_date_and_sort(): void
    {
        $admin = $this->admin();
        $customer = User::factory()->create(['name' => 'Citra Pembeli']);
        $wallet = Wallet::create(['user_id' => $customer->id, 'balance' => 60000]);
        foreach ([['topup_credit', 'credit', 50000, '2026-09-20'], ['admin_adjustment_debit', 'debit', 10000, '2026-09-21']] as [$type, $direction, $amount, $date]) {
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'created_by' => $admin->id,
                'type' => $type,
                'direction' => $direction,
                'amount' => $amount,
                'balance_before' => 60000,
                'balance_after' => 60000,
                'created_at' => "$date 12:00:00",
            ]);
        }

        $this->actingAs($admin)->get(route('admin.wallet-transactions.index', [
            'search' => 'Citra', 'type' => 'admin_adjustment_debit', 'direction' => 'debit',
            'date_from' => '2026-09-21', 'date_to' => '2026-09-21',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page->has('transactions.data', 1)
            ->where('transactions.data.0.type', 'admin_adjustment_debit'));

        $this->actingAs($admin)->get(route('admin.wallet-transactions.index', ['sort' => 'amount', 'sort_direction' => 'asc']))
            ->assertInertia(fn (Assert $page) => $page->where('transactions.data.0.amount', '10000.00'));
        $this->actingAs($admin)->get(route('admin.wallet-transactions.index', ['direction' => 'unknown']))
            ->assertSessionHasErrors('direction');
    }

    public function test_vouchers_search_type_availability_and_sort(): void
    {
        $admin = $this->admin();
        foreach ([
            ['AKTIF', 'fixed', 10000, true, now()->subDay(), now()->addDay()],
            ['NANTI', 'percentage', 20, true, now()->addDay(), now()->addDays(3)],
            ['HABIS', 'fixed', 5000, true, now()->subDays(3), now()->subDay()],
            ['MATI', 'fixed', 2000, false, null, null],
        ] as [$code, $type, $value, $active, $starts, $ends]) {
            Voucher::create([
                'code' => $code,
                'name' => "Voucher $code",
                'type' => $type,
                'value' => $value,
                'is_active' => $active,
                'starts_at' => $starts,
                'ends_at' => $ends,
                'created_by' => $admin->id,
            ]);
        }

        $this->actingAs($admin)->get(route('admin.vouchers.index', [
            'search' => 'NANTI', 'type' => 'percentage', 'status' => 'scheduled',
        ]))->assertInertia(fn (Assert $page) => $page->has('vouchers.data', 1)
            ->where('vouchers.data.0.code', 'NANTI')
            ->where('vouchers.data.0.status', 'scheduled'));

        $this->actingAs($admin)->get(route('admin.vouchers.index', ['status' => 'expired']))
            ->assertInertia(fn (Assert $page) => $page->has('vouchers.data', 1)->where('vouchers.data.0.code', 'HABIS'));
        $this->actingAs($admin)->get(route('admin.vouchers.index', ['status' => 'active']))
            ->assertInertia(fn (Assert $page) => $page->has('vouchers.data', 1)->where('vouchers.data.0.code', 'AKTIF'));
        $this->actingAs($admin)->get(route('admin.vouchers.index', ['status' => 'inactive']))
            ->assertInertia(fn (Assert $page) => $page->has('vouchers.data', 1)->where('vouchers.data.0.code', 'MATI'));
        $this->actingAs($admin)->get(route('admin.vouchers.index', ['sort' => 'value', 'sort_direction' => 'desc']))
            ->assertInertia(fn (Assert $page) => $page->where('vouchers.data.0.code', 'AKTIF'));
    }

    public function test_pagination_keeps_search_and_sort_query_parameters(): void
    {
        $admin = $this->admin();
        foreach (range(1, 16) as $index) {
            Voucher::create([
                'code' => "PROMO-$index",
                'name' => "Promo $index",
                'type' => 'fixed',
                'value' => $index * 1000,
                'created_by' => $admin->id,
            ]);
        }

        $this->actingAs($admin)->get(route('admin.vouchers.index', [
            'search' => 'Promo', 'sort' => 'value', 'sort_direction' => 'asc',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('vouchers.data', 15)
            ->where('vouchers.meta.total', 16)
            ->where('vouchers.links.next', fn (string $url) => str_contains($url, 'search=Promo')
                && str_contains($url, 'sort=value')
                && str_contains($url, 'page=2')));
    }

    public function test_order_list_displays_primary_book_image_and_filters_date_range(): void
    {
        $admin = $this->admin();
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $inside = $this->order($customer, 'ORD-INSIDE');
        $inside->forceFill(['created_at' => '2026-09-21 10:00:00'])->save();
        $outside = $this->order($customer, 'ORD-OUTSIDE');
        $outside->forceFill(['created_at' => '2026-09-20 10:00:00'])->save();
        $book = Book::factory()->create(['title' => 'Buku Contoh', 'author' => 'Penulis Contoh']);
        BookImage::factory()->create(['book_id' => $book->id, 'image_path' => 'books/other.webp', 'is_primary' => false]);
        BookImage::factory()->create(['book_id' => $book->id, 'image_path' => 'books/cover.webp', 'alt_text' => 'Sampul contoh', 'is_primary' => true]);
        OrderItem::create(['order_id' => $inside->id, 'book_id' => $book->id, 'name' => 'Buku Contoh', 'sku' => 'BOOK-1', 'weight' => 500, 'sale_type' => 'ready_stock', 'value' => 100000, 'quantity' => 2, 'subtotal' => 200000]);
        OrderItem::create(['order_id' => $inside->id, 'name' => 'Buku Kedua', 'sku' => 'BOOK-2', 'weight' => 500, 'sale_type' => 'ready_stock', 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        $book->delete();

        $this->actingAs($admin)->get(route('admin.orders.index', [
            'date_from' => '2026-09-21', 'date_to' => '2026-09-21', 'payment' => 'paid',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.book_title', 'Buku Contoh')
            ->where('orders.data.0.quantity', 3)
            ->where('orders.data.0.primary_image_url', Storage::disk('public')->url('books/cover.webp'))
            ->where('filters.date_from', '2026-09-21')
            ->where('filters.date_to', '2026-09-21')
            ->missing('filters.payment'));

        $this->actingAs($admin)->get(route('admin.orders.index', ['search' => 'ORD-OUTSIDE']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.book_title', 'Buku')
                ->where('orders.data.0.quantity', 0)
                ->where('orders.data.0.primary_image_url', null));
    }

    public function test_order_list_displays_customer_and_price_breakdown_even_for_deleted_customers(): void
    {
        $admin = $this->admin();
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->order($customer, 'ORD-PRICES');
        $order->update(['subtotal' => 300000, 'shipping_cost' => 25000, 'voucher_discount' => 10000, 'total' => 315000]);

        $this->actingAs($admin)->get(route('admin.orders.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.customer_name', $customer->name)
                ->where('orders.data.0.customer_email', $customer->email)
                ->where('orders.data.0.subtotal', '300000.00')
                ->where('orders.data.0.shipping_cost', '25000.00')
                ->where('orders.data.0.total', '315000.00'));

        $customer->delete();

        $this->actingAs($admin)->get(route('admin.orders.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.customer_name', $customer->name)
                ->where('orders.data.0.customer_email', $customer->email));
    }

    public function test_order_date_filter_rejects_invalid_or_reversed_ranges(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.orders.index', [
            'date_from' => '2026-09-22', 'date_to' => '2026-09-21',
        ]))->assertSessionHasErrors('date_to');

        $this->actingAs($admin)->get(route('admin.orders.index', ['date_from' => 'not-a-date']))
            ->assertSessionHasErrors('date_from');
    }

    public function test_order_pagination_preserves_both_dates_without_payment_filter(): void
    {
        $admin = $this->admin();
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        foreach (range(1, 16) as $index) {
            $this->order($customer, sprintf('ORD-DATE-%02d', $index))
                ->forceFill(['created_at' => '2026-09-21 10:00:00'])->save();
        }

        $this->actingAs($admin)->get(route('admin.orders.index', [
            'date_from' => '2026-09-21', 'date_to' => '2026-09-21', 'payment' => 'paid',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 15)
            ->where('orders.meta.total', 16)
            ->where('orders.links.next', fn (string $url) => str_contains($url, 'date_from=2026-09-21')
                && str_contains($url, 'date_to=2026-09-21')
                && ! str_contains($url, 'payment=')));
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => UserRole::Admin])->save();

        return $admin;
    }

    private function order(User $customer, string $code): Order
    {
        return Order::create([
            'order_code' => $code,
            'user_id' => $customer->id,
            'subtotal' => 100000,
            'total' => 100000,
            'wallet_amount' => 100000,
        ]);
    }
}
