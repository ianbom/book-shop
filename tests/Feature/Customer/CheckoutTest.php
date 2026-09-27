<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Voucher;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_redirects_without_address(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']))
            ->get(route('customer.dashboard.checkout'))
            ->assertRedirect(route('customer.dashboard.profile'));
    }

    public function test_checkout_commits_order_wallet_stock_and_local_shipment(): void
    {
        [$user, $book, $address] = $this->checkoutData();
        $this->fakeRates();

        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            'address_id' => $address->id, 'courier_company' => 'jne', 'courier_type' => 'REG', 'shipping_cost' => '10000.00',
        ])->assertRedirect(route('customer.dashboard.orders.index'));

        $order = $user->orders()->firstOrFail();
        $this->assertSame('110000.00', $order->total);
        $this->assertSame(4, $book->fresh()->stock);
        $this->assertSame('90000.00', $user->wallet->fresh()->balance);
        $this->assertDatabaseHas('wallet_transactions', ['order_id' => $order->id, 'type' => 'order_payment', 'amount' => '110000.00']);
        $this->assertDatabaseHas('order_shipping_addresses', ['order_id' => $order->id, 'source_address_id' => $address->id]);
        $this->assertDatabaseHas('shipments', ['order_id' => $order->id, 'status' => 'pending', 'biteship_order_id' => null]);
        $this->assertDatabaseHas('shipment_status_histories', ['shipment_id' => $order->shipments()->value('id'), 'status' => 'pending']);
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->id, 'status' => 'pending']);
        $this->assertDatabaseCount('shipment_items', 1);
        $this->assertDatabaseCount('cart_items', 0);
        Http::assertSent(fn ($request) => $request->url() === 'https://api.biteship.com/v1/rates/couriers');
    }

    public function test_insufficient_balance_leaves_no_partial_checkout(): void
    {
        [$user, $book, $address] = $this->checkoutData(109999);
        $this->fakeRates();

        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            'address_id' => $address->id, 'courier_company' => 'jne', 'courier_type' => 'REG', 'shipping_cost' => '10000.00',
        ])->assertSessionHasErrors('wallet_balance');

        foreach (['orders', 'wallet_transactions', 'shipments', 'book_stock_movements'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseCount('cart_items', 1);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertSame('109999.00', $user->wallet->fresh()->balance);
    }

    public function test_rates_use_store_origin_customer_destination_and_cart_items(): void
    {
        [$user, $book, $address] = $this->checkoutData();
        $this->fakeRates();

        $this->actingAs($user)->getJson(route('customer.dashboard.checkout.rates', ['address_id' => $address->id]))
            ->assertOk()->assertJsonPath('rates.0.price', '10000.00');

        Http::assertSent(fn ($request) => $request['origin_area_id'] === 'origin-area'
            && $request['destination_area_id'] === 'destination-area'
            && $request['items'][0]['quantity'] === 1
            && $request['items'][0]['name'] === $book->title);
    }

    public function test_voucher_and_multiple_books_apply_discount_once(): void
    {
        [$user, $book, $address] = $this->checkoutData(300000);
        $secondBook = Book::factory()->create(['price' => 50000, 'stock' => 3]);
        CartItem::query()->create(['cart_id' => $user->cart->id, 'book_id' => $secondBook->id, 'quantity' => 2]);
        $voucher = Voucher::query()->create([
            'code' => 'SAVE30', 'name' => 'Hemat 30', 'type' => 'fixed',
            'value' => 30000, 'min_order_amount' => 100000, 'usage_limit' => 1,
            'created_by' => User::factory()->create(['role' => 'admin'])->id,
        ]);
        $this->fakeRates();

        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            'address_id' => $address->id, 'voucher_id' => $voucher->id,
            'courier_company' => 'jne', 'courier_type' => 'REG', 'shipping_cost' => '10000.00',
        ])->assertRedirect(route('customer.dashboard.orders.index'));

        $order = $user->orders()->firstOrFail();
        $this->assertSame('200000.00', $order->subtotal);
        $this->assertSame('30000.00', $order->voucher_discount);
        $this->assertSame('180000.00', $order->total);
        $this->assertSame('120000.00', $user->wallet->fresh()->balance);
        $this->assertSame(4, $book->fresh()->stock);
        $this->assertSame(1, $secondBook->fresh()->stock);
        $this->assertDatabaseCount('order_items', 2);
        $this->assertDatabaseCount('shipment_items', 2);
        $this->assertDatabaseHas('voucher_usages', ['voucher_id' => $voucher->id, 'order_id' => $order->id]);
    }

    public function test_forged_shipping_price_cannot_charge_wallet(): void
    {
        [$user, $book, $address] = $this->checkoutData();
        $this->fakeRates();
        $payload = ['address_id' => $address->id, 'courier_company' => 'jne', 'courier_type' => 'REG'];

        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            ...$payload, 'shipping_cost' => '0.00',
        ])->assertSessionHasErrors('shipping_cost');

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertSame('200000.00', $user->wallet->fresh()->balance);
    }

    public function test_biteship_failure_leaves_no_partial_checkout(): void
    {
        [$user, $book, $address] = $this->checkoutData();
        config(['services.biteship.key' => 'test-key']);
        Http::fake(['api.biteship.com/*' => Http::response(['success' => false], 503)]);

        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            'address_id' => $address->id, 'courier_company' => 'jne',
            'courier_type' => 'REG', 'shipping_cost' => '10000.00',
        ])->assertSessionHasErrors('shipping');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('shipments', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertSame(5, $book->fresh()->stock);
        $this->assertSame('200000.00', $user->wallet->fresh()->balance);
    }

    public function test_checkout_rejects_another_customers_address_and_repeat_payment(): void
    {
        [$user, $book, $address] = $this->checkoutData();
        $stranger = User::factory()->create(['role' => 'customer']);
        $foreignAddress = $address->replicate();
        $foreignAddress->user_id = $stranger->id;
        $foreignAddress->save();
        $this->fakeRates();
        $payload = ['courier_company' => 'jne', 'courier_type' => 'REG', 'shipping_cost' => '10000.00'];

        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            ...$payload, 'address_id' => $foreignAddress->id,
        ])->assertNotFound();
        $this->post(route('customer.dashboard.checkout.store'), [
            ...$payload, 'address_id' => $address->id,
        ])->assertRedirect(route('customer.dashboard.orders.index'));
        $this->post(route('customer.dashboard.checkout.store'), [
            ...$payload, 'address_id' => $address->id,
        ])->assertSessionHasErrors('items');
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('wallet_transactions', 1);
        $this->assertSame(4, $book->fresh()->stock);
    }

    public function test_invalid_voucher_or_insufficient_stock_cannot_create_an_order(): void
    {
        [$user, $book, $address] = $this->checkoutData();
        $this->fakeRates();
        $payload = [
            'address_id' => $address->id, 'courier_company' => 'jne',
            'courier_type' => 'REG', 'shipping_cost' => '10000.00',
        ];
        $this->actingAs($user)->post(route('customer.dashboard.checkout.store'), [
            ...$payload, 'voucher_id' => 99999,
        ])->assertSessionHasErrors('voucher_id');

        $book->update(['stock' => 0]);
        $this->post(route('customer.dashboard.checkout.store'), $payload)
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('shipments', 0);
        $this->assertSame('200000.00', $user->wallet->fresh()->balance);
    }

    private function checkoutData(int $balance = 200000): array
    {
        $user = User::factory()->create(['role' => 'customer']);
        $address = UserAddress::query()->create([
            'user_id' => $user->id, 'label' => 'Rumah', 'destination_contact_name' => $user->name,
            'destination_contact_phone' => '081234567890', 'destination_address' => 'Jalan Mawar 1',
            'destination_postal_code' => '12345', 'destination_area_id' => 'destination-area', 'is_default' => true,
        ]);
        $book = Book::factory()->create(['price' => 100000, 'stock' => 5]);
        $cart = Cart::query()->create(['user_id' => $user->id]);
        CartItem::query()->create(['cart_id' => $cart->id, 'book_id' => $book->id, 'quantity' => 1]);
        Wallet::query()->create(['user_id' => $user->id, 'balance' => $balance]);
        StoreSetting::factory()->create(['origin_area_id' => 'origin-area', 'couriers' => 'jne']);

        return [$user, $book, $address];
    }

    private function fakeRates(): void
    {
        config(['services.biteship.key' => 'test-key']);
        Http::fake(['api.biteship.com/*' => Http::response(['success' => true, 'pricing' => [[
            'courier_code' => 'jne', 'courier_service_code' => 'REG',
            'courier_service_name' => 'Reguler', 'price' => 10000, 'duration' => '2-3 hari',
        ]]], 200)]);
    }
}
