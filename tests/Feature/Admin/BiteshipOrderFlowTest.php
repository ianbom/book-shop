<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BiteshipOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_processing_cannot_be_cancelled_and_packing_books_only_once(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $order = $this->order();
        $shipment = $order->shipments()->create(['shipment_code' => 'SHP-BOOK', 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000]);
        $item = $order->items()->create(['name' => 'Buku', 'value' => 100000, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'ready_stock']);
        $shipment->items()->create(['order_item_id' => $item->id, 'quantity' => 1]);
        $order->shippingAddress()->create(['destination_contact_name' => 'Penerima', 'destination_contact_phone' => '08123456789', 'destination_address' => 'Jalan Tujuan', 'destination_postal_code' => '12345', 'destination_area_id' => 'IDNP1']);
        StoreSetting::factory()->create(['origin_contact_name' => 'Toko', 'origin_contact_phone' => '08121111111', 'origin_address' => 'Jalan Toko', 'origin_postal_code' => '54321', 'origin_area_id' => 'IDNP2']);
        config(['services.biteship.key' => 'test-key']);
        Http::fake(['api.biteship.com/v1/orders' => Http::response(['success' => true, 'id' => 'provider-1', 'status' => 'confirmed', 'courier' => ['tracking_id' => 'track-1', 'waybill_id' => 'WB-BOOK']], 200)]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'processing'])->assertRedirect();
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'cancelled'])->assertSessionHasErrors('status');
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'packing'])->assertRedirect();
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'shipping'])->assertRedirect();
        $this->assertSame(OrderStatus::Shipping, $order->fresh()->status);
        $this->assertSame('provider-1', $shipment->fresh()->biteship_order_id);
        $this->assertSame('track-1', $shipment->fresh()->tracking_id);
        $this->assertSame('WB-BOOK', $shipment->fresh()->waybill_id);
        Http::assertSentCount(1);
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'shipping'])->assertSessionHasErrors('status');
        Http::assertSentCount(1);
    }

    public function test_booking_failure_keeps_packing_for_retry(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $order = $this->order(['status' => OrderStatus::Packing]);
        $order->shipments()->create(['shipment_code' => 'SHP-FAIL', 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000]);
        config(['services.biteship.key' => 'test-key']);
        Http::fake(['api.biteship.com/v1/orders' => Http::response(['success' => false], 500)]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'shipping'])->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Packing, $order->fresh()->status);
        $this->assertNull($order->shipments()->first()->biteship_order_id);
    }

    public function test_duplicate_reference_recovers_existing_biteship_order(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $order = $this->order(['status' => OrderStatus::Packing]);
        $shipment = $order->shipments()->create(['shipment_code' => 'SHP-RETRY', 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000]);
        $item = $order->items()->create(['name' => 'Buku', 'value' => 100000, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100000, 'sale_type' => 'ready_stock']);
        $shipment->items()->create(['order_item_id' => $item->id, 'quantity' => 1]);
        $order->shippingAddress()->create(['destination_contact_name' => 'Penerima', 'destination_contact_phone' => '08123456789', 'destination_address' => 'Jalan Tujuan', 'destination_postal_code' => '12345']);
        StoreSetting::factory()->create();
        config(['services.biteship.key' => 'test-key']);
        Http::fake(['api.biteship.com/v1/orders' => Http::response(['success' => false, 'code' => 40002060, 'details' => ['order_id' => 'existing-1', 'reference_id' => 'SHP-RETRY', 'waybill_id' => 'WB-2']], 400)]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'shipping'])->assertRedirect();
        $this->assertSame('existing-1', $shipment->fresh()->biteship_order_id);
        $this->assertSame('WB-2', $shipment->fresh()->waybill_id);
        $this->assertSame(OrderStatus::Shipping, $order->fresh()->status);
    }

    public function test_webhook_updates_shipment_and_completes_order_idempotently(): void
    {
        config(['services.biteship.webhook_secret' => 'secret']);
        $order = $this->order(['status' => OrderStatus::Shipping]);
        $shipment = $order->shipments()->create(['shipment_code' => 'SHP-WEB', 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000, 'biteship_order_id' => 'provider-1', 'status' => 'in_transit']);
        $payload = ['event' => 'order.status', 'order_id' => 'provider-1', 'status' => 'delivered', 'courier_waybill_id' => 'WB-1', 'courier_tracking_id' => 'TRACK-1'];

        $this->postJson(route('webhooks.biteship'), $payload)->assertUnauthorized();
        $this->withHeader('X-Biteship-Webhook-Secret', 'secret')->postJson(route('webhooks.biteship'), $payload)->assertOk();
        $this->assertSame('delivered', $shipment->fresh()->status->value);
        $this->assertSame('WB-1', $shipment->fresh()->waybill_id);
        $this->assertSame('TRACK-1', $shipment->fresh()->tracking_id);
        $this->assertSame(OrderStatus::Completed, $order->fresh()->status);
        $this->withHeader('X-Biteship-Webhook-Secret', 'secret')->postJson(route('webhooks.biteship'), $payload)->assertOk();
        $this->assertSame(1, $shipment->statusHistories()->where('status', 'delivered')->count());
        $this->assertSame(1, $order->statusHistories()->where('status', 'completed')->count());
    }

    public function test_manual_shipment_progress_requires_existing_biteship_booking(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $order = $this->order(['status' => OrderStatus::Packing]);
        $shipment = $order->shipments()->create(['shipment_code' => 'SHP-MANUAL', 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000]);

        $url = route('admin.orders.shipments.status', [$order, $shipment]);
        $this->actingAs($admin)->patch($url, ['status' => 'booked'])->assertSessionHasErrors('status');
        $this->assertSame('pending', $shipment->fresh()->status->value);
        $this->actingAs($admin)->patch($url, ['status' => 'cancelled'])->assertSessionHasErrors('status');
        $shipment->update(['status' => 'cancelled']);
        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => 'shipping'])->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Packing, $order->fresh()->status);
    }

    private function order(array $attributes = []): Order
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        return Order::create([...['order_code' => 'ORD-BOOK', 'user_id' => $customer->id, 'subtotal' => 100000, 'total' => 110000, 'wallet_amount' => 110000, 'payment_status' => 'paid'], ...$attributes]);
    }
}
