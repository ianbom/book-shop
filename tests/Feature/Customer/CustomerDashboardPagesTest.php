<?php

namespace Tests\Feature\Customer;

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\BookImage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PreOrderCode;
use App\Models\Shipment;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerDashboardPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_is_customer_only_and_shows_own_default_address(): void
    {
        $route = route('customer.dashboard.profile');
        $this->get($route)->assertRedirect(route('login'));

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->actingAs($admin)->get($route)->assertForbidden();

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        UserAddress::create([
            'user_id' => $customer->id,
            'destination_contact_name' => $customer->name,
            'destination_contact_phone' => '08123456789',
            'destination_address' => 'Jl. Buku Indah No. 12',
            'is_default' => true,
        ]);

        $this->actingAs($customer)->get($route)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/dashboard/profile')
                ->where('address.destination_address', 'Jl. Buku Indah No. 12'));
    }

    public function test_customer_can_search_postal_areas_and_save_one_address(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        config(['services.biteship.key' => 'test-api-key']);
        Http::fake([
            'api.biteship.com/v1/maps/areas*' => Http::response([
                'success' => true,
                'areas' => [[
                    'id' => 'area-1',
                    'postal_code' => 60231,
                    'administrative_division_level_1_name' => 'Jawa Timur',
                    'administrative_division_level_2_name' => 'Surabaya',
                    'administrative_division_level_3_name' => 'Wonokromo',
                ]],
            ]),
        ]);

        $this->actingAs($customer)->getJson(route('customer.dashboard.address.areas', ['postal_code' => '60231']))
            ->assertOk()
            ->assertJsonPath('areas.0.id', 'area-1')
            ->assertJsonPath('areas.0.province', 'Jawa Timur');

        $this->put(route('customer.dashboard.address.save'), [
            'label' => 'Rumah',
            'destination_contact_name' => 'Bella',
            'destination_contact_phone' => '08123456789',
            'destination_contact_email' => 'bella@example.com',
            'destination_postal_code' => '60231',
            'destination_area_id' => 'area-palsu',
            'subdistrict_name' => 'Darmo',
            'destination_address' => 'Jl. Buku Indah No. 12',
            'destination_latitude' => '-7.2911',
            'destination_longitude' => '112.7351',
        ])->assertSessionHasErrors('destination_area_id');
        $this->assertDatabaseCount('user_addresses', 0);

        $payload = [
            'label' => 'Rumah',
            'destination_contact_name' => 'Bella',
            'destination_contact_phone' => '08123456789',
            'destination_contact_email' => 'bella@example.com',
            'destination_postal_code' => '60231',
            'destination_area_id' => 'area-1',
            'subdistrict_name' => 'Darmo',
            'destination_address' => 'Jl. Buku Indah No. 12',
            'destination_note' => 'Pagar biru',
            'destination_latitude' => '-7.2911',
            'destination_longitude' => '112.7351',
        ];

        $this->put(route('customer.dashboard.address.save'), $payload)->assertRedirect(route('customer.dashboard.profile'));
        $this->assertDatabaseHas('user_addresses', [
            'user_id' => $customer->id,
            'destination_area_id' => 'area-1',
            'province_name' => 'Jawa Timur',
            'destination_location_id' => null,
            'is_default' => true,
        ]);

        $this->put(route('customer.dashboard.address.save'), array_merge($payload, [
            'label' => 'Kantor', 'destination_address' => 'Jl. Buku Baru No. 2',
        ]))->assertRedirect(route('customer.dashboard.profile'));

        $this->assertDatabaseCount('user_addresses', 1);
        $this->assertDatabaseHas('user_addresses', [
            'user_id' => $customer->id,
            'label' => 'Kantor',
            'destination_address' => 'Jl. Buku Baru No. 2',
        ]);

        $this->put(route('customer.dashboard.address.save', ['return_to' => 'cart']), $payload)
            ->assertRedirect(route('customer.dashboard.carts.index'));
        $this->get(route('customer.dashboard.carts.index'))
            ->assertInertia(fn (Assert $page) => $page->where('hasAddress', true));
        $this->assertDatabaseCount('user_addresses', 1);

        $this->put(route('customer.dashboard.address.save', ['return_to' => 'https://example.com']), $payload)
            ->assertRedirect(route('customer.dashboard.profile'));
    }

    public function test_address_map_center_uses_postal_geocoding(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        config([
            'services.biteship.key' => 'test-api-key',
            'services.nominatim.user_agent' => 'BookShopTest/1.0 (test@example.com)',
        ]);
        Http::fake([
            'api.biteship.com/v1/maps/areas*' => Http::response([
                'success' => true,
                'areas' => [[
                    'id' => 'area-2', 'postal_code' => 60232,
                    'administrative_division_level_1_name' => 'Jawa Timur',
                    'administrative_division_level_2_name' => 'Surabaya',
                    'administrative_division_level_3_name' => 'Wonokromo',
                ]],
            ]),
            'nominatim.openstreetmap.org/search*' => Http::response([
                ['lat' => '-7.29', 'lon' => '112.73'],
            ]),
        ]);

        $this->actingAs($customer)
            ->getJson(route('customer.dashboard.address.map-center', ['postal_code' => '60232', 'area_id' => 'area-2']))
            ->assertOk()
            ->assertJsonPath('center.latitude', -7.29)
            ->assertJsonPath('center.longitude', 112.73);

        $this->getJson(route('customer.dashboard.address.map-center', ['postal_code' => '60232', 'area_id' => 'area-2']))
            ->assertOk()->assertJsonPath('center.latitude', -7.29);
        Http::assertSentCount(2);
    }

    public function test_address_lookup_rejects_non_customers_and_handles_provider_failure(): void
    {
        $route = route('customer.dashboard.address.areas', ['postal_code' => '60233']);
        $this->get($route)->assertRedirect(route('login'));

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->actingAs($admin)->get($route)->assertForbidden();

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        config(['services.biteship.key' => 'test-api-key']);
        Http::fake(['api.biteship.com/v1/maps/areas*' => Http::response([], 503)]);
        $this->actingAs($customer)->getJson($route)->assertStatus(503);
        $this->assertDatabaseCount('user_addresses', 0);
    }

    public function test_customer_pages_require_a_customer_account(): void
    {
        foreach (['orders', 'wallets', 'vouchers'] as $page) {
            $route = route("customer.dashboard.{$page}.index");
            auth()->logout();
            $this->get($route)->assertRedirect(route('login'));
            $admin = User::factory()->create();
            $admin->forceFill(['role' => UserRole::Admin])->save();
            $this->actingAs($admin)->get($route)->assertForbidden();
            $customer = User::factory()->create(['role' => UserRole::Customer]);
            $this->actingAs($customer)->get($route)
                ->assertOk()
                ->assertInertia(fn (Assert $inertia) => $inertia->component("customer/dashboard/{$page}/index"));
        }
    }

    public function test_orders_are_scoped_to_the_customer_and_searchable(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $this->order($customer, 'ORD-MY-BOOK');
        $this->order(User::factory()->create(), 'ORD-OTHER-BOOK');

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['search' => 'MY-BOOK']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.order_code', 'ORD-MY-BOOK')
                ->where('orders.data.0.primary_image', null)
                ->where('orders.data.0.shipment_status', null)
                ->where('orders.data.0.preorder_estimated_date', null)
                ->where('filters.search', 'MY-BOOK'));
    }

    public function test_preorder_code_filter_combines_with_book_search_and_ignores_removed_date_filters(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $code = PreOrderCode::query()->create(['code' => 'BATCH-A']);
        $wanted = $this->order($customer, 'ORD-ONE');
        $readyStock = $this->order($customer, 'ORD-TWO');
        $foreign = $this->order(User::factory()->create(), 'ORD-THREE');
        $preorderBook = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        $readyStockBook = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        foreach ([[$wanted, $preorderBook, 'preorder'], [$readyStock, $readyStockBook, 'ready_stock'], [$foreign, $preorderBook, 'preorder']] as [$order, $book, $saleType]) {
            OrderItem::create(['order_id' => $order->id, 'book_id' => $book->id, 'name' => 'Buku Pilihan', 'weight' => 500, 'sale_type' => $saleType, 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        }
        $preorderBook->delete();
        $code->delete();

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['search' => 'Buku Pilihan']))
            ->assertInertia(fn (Assert $page) => $page->has('orders.data', 2));

        $this->get(route('customer.dashboard.orders.index', [
            'pre_order_code' => 'BATCH-A', 'search' => 'Buku Pilihan', 'date_from' => '2099-01-01', 'date_to' => '2099-12-31',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_code', 'ORD-ONE')
            ->where('filters.pre_order_code', 'BATCH-A')
            ->where('filters.search', 'Buku Pilihan')
            ->missing('filters.date_from')
            ->missing('filters.date_to'));
    }

    public function test_preorder_code_filter_validates_the_input(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]));
        foreach ([str_repeat('X', 101), ['ORD-1']] as $code) {
            $this->getJson(route('customer.dashboard.orders.index', ['pre_order_code' => $code]))
                ->assertUnprocessable()->assertJsonValidationErrors('pre_order_code');
        }
    }

    public function test_preorder_code_filter_accepts_zero_as_a_search_term(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $code = PreOrderCode::query()->create(['code' => 'BATCH-0A']);
        $book = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        $order = $this->order($customer, 'ORD-ONE');
        OrderItem::create(['order_id' => $order->id, 'book_id' => $book->id, 'name' => 'Preorder', 'weight' => 500, 'sale_type' => 'preorder', 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        $this->order($customer, 'ORD-ZERO-UNRELATED');

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['pre_order_code' => '0']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.order_code', 'ORD-ONE'));
    }

    public function test_order_list_shows_latest_shipment_and_earliest_preorder_snapshot_date(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->order($customer, 'ORD-PREORDER');
        $order->update(['payment_status' => 'paid']);
        $book = Book::factory()->create(['sale_type' => 'preorder', 'preorder_estimated_date' => '2027-06-01']);
        foreach ([['preorder', '2027-02-10'], ['preorder', '2027-01-20'], ['preorder', null], ['ready_stock', '2026-12-01']] as [$saleType, $date]) {
            OrderItem::create([
                'order_id' => $order->id, 'book_id' => $book->id, 'name' => 'Buku Snapshot',
                'weight' => 500, 'sale_type' => $saleType, 'preorder_estimated_date' => $date,
                'value' => 100000, 'quantity' => 1, 'subtotal' => 100000,
            ]);
        }
        $olderShipment = Shipment::create([
            'order_id' => $order->id, 'shipment_code' => 'SHP-OLDER', 'courier_company' => 'jne',
            'courier_type' => 'REG', 'price' => 10000, 'status' => 'delivered',
        ]);
        $olderShipment->forceFill(['created_at' => now()->subDay()])->save();
        Shipment::create([
            'order_id' => $order->id, 'shipment_code' => 'SHP-LATEST', 'courier_company' => 'jne',
            'courier_type' => 'REG', 'price' => 10000, 'status' => 'in_transit',
        ]);
        $book->delete();

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.payment_status', 'paid')
                ->where('orders.data.0.shipment_status', 'in_transit')
                ->where('orders.data.0.preorder_estimated_date', '2027-01-20'));
    }

    public function test_order_list_shows_first_books_primary_cover(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->order($customer, 'ORD-WITH-COVER');
        $book = Book::factory()->create();
        BookImage::factory()->create(['book_id' => $book->id, 'image_path' => 'books/other.webp', 'is_primary' => false]);
        BookImage::factory()->create(['book_id' => $book->id, 'image_path' => 'books/cover.webp', 'alt_text' => 'Sampul pesanan', 'is_primary' => true]);
        OrderItem::create(['order_id' => $order->id, 'book_id' => $book->id, 'name' => 'Buku Contoh', 'sku' => 'BUKU-1', 'weight' => 500, 'sale_type' => 'ready_stock', 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        $book->delete();

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['search' => 'WITH-COVER']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.primary_image.url', Storage::disk('public')->url('books/cover.webp'))
                ->where('orders.data.0.primary_image.alt_text', 'Sampul pesanan'));
    }

    public function test_order_pagination_preserves_the_preorder_code_filter(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $code = PreOrderCode::query()->create(['code' => 'BATCH-PAGE']);
        $book = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        foreach (range(1, 16) as $index) {
            $order = $this->order($customer, sprintf('ORD-PAGE-%02d', $index));
            OrderItem::create(['order_id' => $order->id, 'book_id' => $book->id, 'name' => 'Buku preorder', 'weight' => 500, 'sale_type' => 'preorder', 'value' => 100000, 'quantity' => 1, 'subtotal' => 100000]);
        }

        $this->actingAs($customer)->get(route('customer.dashboard.orders.index', ['search' => 'ORD-PAGE', 'pre_order_code' => 'BATCH-PAGE', 'page' => 2]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.total', 16)
                ->where('orders.current_page', 2)
                ->where('filters.search', 'ORD-PAGE')
                ->where('filters.pre_order_code', 'BATCH-PAGE')
                ->where('orders.links.1.url', fn (string $value) => str_contains($value, 'pre_order_code=BATCH-PAGE')));
    }

    public function test_wallet_shows_only_its_owners_balance_and_transactions(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $wallet = Wallet::create(['user_id' => $customer->id, 'balance' => 42000]);
        $other = Wallet::create(['user_id' => User::factory()->create()->id, 'balance' => 9000]);
        foreach ([$wallet, $other] as $owner) {
            WalletTransaction::create([
                'wallet_id' => $owner->id,
                'type' => 'topup_credit',
                'direction' => 'credit',
                'amount' => $owner->balance,
                'balance_before' => 0,
                'balance_after' => $owner->balance,
                'created_at' => now(),
            ]);
        }

        $this->actingAs($customer)->get(route('customer.dashboard.wallets.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('balance', '42000.00')
                ->has('transactions.data', 1)
                ->where('transactions.data.0.balance_after', '42000.00'));
    }

    public function test_vouchers_only_include_active_vouchers_with_remaining_usage(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $available = $this->voucher('AVAILABLE');
        $this->voucher('EXPIRED', ['ends_at' => now()->subDay()]);
        $this->voucher('INACTIVE', ['is_active' => false]);
        $exhausted = $this->voucher('EXHAUSTED', ['usage_limit' => 1]);
        $usageOrder = $this->order($customer, 'ORD-VOUCHER-USED');
        VoucherUsage::create([
            'voucher_id' => $exhausted->id,
            'user_id' => $customer->id,
            'order_id' => $usageOrder->id,
            'discount_amount' => 1000,
            'created_at' => now(),
        ]);

        $this->actingAs($customer)->get(route('customer.dashboard.vouchers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('vouchers.data', 1)
                ->where('vouchers.data.0.code', $available->code));
    }

    public function test_used_voucher_remains_available_to_other_customers(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $other = User::factory()->create(['role' => UserRole::Customer]);
        $voucher = $this->voucher('ONCE-EACH', ['usage_limit' => 2]);
        $order = $this->order($other, 'ORD-OTHER-VOUCHER');
        VoucherUsage::create([
            'voucher_id' => $voucher->id,
            'user_id' => $other->id,
            'order_id' => $order->id,
            'discount_amount' => 1000,
            'created_at' => now(),
        ]);

        $this->actingAs($other)->get(route('customer.dashboard.vouchers.index'))
            ->assertInertia(fn (Assert $page) => $page->has('vouchers.data', 0));
        $this->actingAs($customer)->get(route('customer.dashboard.vouchers.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('vouchers.data', 1)
                ->where('vouchers.data.0.remaining_uses', 1));
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

    private function voucher(string $code, array $attributes = []): Voucher
    {
        return Voucher::create(array_merge([
            'code' => $code,
            'name' => "Voucher {$code}",
            'type' => 'fixed',
            'value' => 5000,
            'created_by' => User::factory()->create()->id,
        ], $attributes));
    }
}
