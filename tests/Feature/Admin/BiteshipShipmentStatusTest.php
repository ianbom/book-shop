<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class BiteshipShipmentStatusTest extends TestCase
{
    use RefreshDatabase;

    private const STATUSES = ['confirmed', 'scheduled', 'allocated', 'picking_up', 'picked', 'cancelled', 'on_hold', 'in_transit', 'dropping_off', 'return_in_transit', 'returned', 'rejected', 'disposed', 'courier_not_found', 'delivered'];

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.biteship.key' => 'test-key', 'services.biteship.webhook_secret' => 'secret', 'inertia.ssr.enabled' => false]);
        Http::preventStrayRequests();
    }

    public function test_every_provider_status_is_saved_and_visible_to_admin(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $responses = Http::sequence();
        Http::fake(['api.biteship.com/v1/orders/*' => $responses]);
        foreach (self::STATUSES as $status) {
            $shipment = $this->shipment($status);
            $responses->push($this->snapshot($shipment, $status));
            $this->webhook($shipment, $status)->assertOk();
            $this->assertSame($status, $shipment->fresh()->status->value);
            $this->assertSame($status, $shipment->fresh()->biteship_status);
            $this->assertSame(1, $shipment->statusHistories()->where('provider_status', $status)->count());
            $this->actingAs($admin)->get(route('admin.orders.show', $shipment->order))->assertOk();
            $this->actingAs($admin)->get(route('admin.shipments.index', ['status' => $status]))->assertOk();
        }
    }

    public function test_hold_recovery_and_return_flow_do_not_refund_or_restore_stock(): void
    {
        $shipment = $this->shipment();
        $responses = Http::sequence();
        Http::fake(['api.biteship.com/v1/orders/*' => $responses]);
        foreach (['picked', 'on_hold', 'in_transit', 'dropping_off', 'rejected', 'return_in_transit', 'returned'] as $status) {
            $responses->push($this->snapshot($shipment, $status));
            $this->webhook($shipment, $status)->assertOk();
            $this->assertSame($status, $shipment->fresh()->status->value);
        }
        $this->assertSame('shipping', $shipment->order->fresh()->status->value);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('book_stock_movements', 0);
    }

    public function test_snapshot_wins_over_late_webhook_and_deduplicates_history(): void
    {
        $shipment = $this->shipment();
        $snapshot = $this->snapshot($shipment, 'in_transit');
        $snapshot['courier']['history'] = [
            ['status' => 'confirmed', 'note' => 'Dikonfirmasi', 'updated_at' => '2026-10-19T09:00:00+07:00'],
            ['status' => 'in_transit', 'note' => 'Dalam perjalanan', 'updated_at' => '2026-10-19T10:00:00+07:00'],
        ];
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($snapshot)]);
        $this->webhook($shipment, 'confirmed')->assertOk();
        $count = $shipment->statusHistories()->count();
        $this->webhook($shipment, 'picking_up')->assertOk();
        $this->assertSame('in_transit', $shipment->fresh()->status->value);
        $this->assertSame('in_transit', $shipment->fresh()->biteship_status);
        $this->assertSame('CURRENT-WB', $shipment->fresh()->waybill_id);
        $this->assertSame($count, $shipment->statusHistories()->count());
        $this->assertDatabaseHas('shipment_status_histories', ['description' => 'Dalam perjalanan', 'occurred_at' => '2026-10-19 03:00:00']);
    }

    public function test_unknown_status_is_preserved_without_completing_order(): void
    {
        $shipment = $this->shipment();
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($this->snapshot($shipment, 'future_status'))]);
        $this->webhook($shipment, 'future_status')->assertOk();
        $this->assertSame('pending', $shipment->fresh()->status->value);
        $this->assertSame('future_status', $shipment->fresh()->biteship_status);
        $this->assertDatabaseHas('shipment_status_histories', ['provider_status' => 'future_status']);
        $this->assertSame('shipping', $shipment->order->fresh()->status->value);
    }

    public function test_provider_failure_is_retryable_and_changes_nothing(): void
    {
        $shipment = $this->shipment();
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response(['success' => false], 503)]);
        $this->webhook($shipment, 'delivered')->assertStatus(503);
        $this->assertSame('pending', $shipment->fresh()->status->value);
        $this->assertNull($shipment->fresh()->biteship_status);
        $this->assertSame(0, $shipment->statusHistories()->count());
    }

    public function test_manual_override_requires_reason_and_is_replaced_by_sync(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $shipment = $this->shipment();
        $url = route('admin.orders.shipments.status', [$shipment->order, $shipment]);
        $this->actingAs($admin)->patch($url, ['status' => 'delivered'])->assertSessionHasErrors('description');
        $this->actingAs($admin)->patch($url, ['status' => 'delivered', 'description' => 'Konfirmasi sementara'])->assertSessionHasNoErrors();
        $this->assertSame('delivered', $shipment->fresh()->status->value);
        $this->assertNull($shipment->fresh()->biteship_status);
        $this->assertSame('shipping', $shipment->order->fresh()->status->value);
        $this->assertSame($admin->id, $shipment->statusHistories()->latest('id')->first()->raw_payload['actor_id']);
        Http::assertNothingSent();
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($this->snapshot($shipment, 'on_hold'))]);
        $this->actingAs($admin)->post(route('admin.orders.shipments.sync', [$shipment->order, $shipment]))->assertSessionHasNoErrors();
        $this->assertSame('on_hold', $shipment->fresh()->status->value);
        $this->assertSame(2, $shipment->statusHistories()->count());
    }

    public function test_completion_requires_all_provider_deliveries_and_is_idempotent(): void
    {
        $shipment = $this->shipment();
        $second = $shipment->order->shipments()->create(['shipment_code' => 'SECOND', 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000, 'biteship_order_id' => 'second']);
        Http::fake([
            'api.biteship.com/v1/orders/provider-main' => Http::response($this->snapshot($shipment, 'delivered')),
            'api.biteship.com/v1/orders/second' => Http::response($this->snapshot($second, 'delivered')),
        ]);
        $this->webhook($shipment, 'delivered')->assertOk();
        $this->assertSame('shipping', $shipment->order->fresh()->status->value);
        $this->webhook($second, 'delivered')->assertOk();
        $this->webhook($second, 'delivered')->assertOk();
        $this->assertSame('completed', $shipment->order->fresh()->status->value);
        $this->assertSame(1, $shipment->order->statusHistories()->where('status', 'completed')->count());
    }

    public function test_sync_requires_admin_and_shipment_belongs_to_order(): void
    {
        $shipment = $this->shipment();
        $other = $this->shipment('other');
        $url = '/admin/orders/'.$shipment->order_id.'/shipments/'.$shipment->id.'/sync';
        $this->post($url)->assertRedirect();
        $this->actingAs($shipment->order->user)->post($url)->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]))
            ->post('/admin/orders/'.$other->order_id.'/shipments/'.$shipment->id.'/sync')->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_waybill_event_accepts_wrapped_payload_and_uses_verified_metadata(): void
    {
        $shipment = $this->shipment();
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($this->snapshot($shipment, 'picked'))]);
        $this->withHeader('X-Biteship-Webhook-Secret', 'secret')->postJson(route('webhooks.biteship'), [
            'event' => 'order.waybill_id', 'data' => ['order_id' => $shipment->biteship_order_id, 'courier_waybill_id' => 'UNVERIFIED'],
        ])->assertOk();
        $this->assertSame('picked', $shipment->fresh()->status->value);
        $this->assertSame('CURRENT-WB', $shipment->fresh()->waybill_id);
    }

    public function test_invalid_payload_and_wrong_secret_do_not_call_provider(): void
    {
        $shipment = $this->shipment();
        $url = route('webhooks.biteship');
        $this->postJson($url, ['event' => 'order.status', 'order_id' => $shipment->biteship_order_id])->assertUnauthorized();
        $this->withHeader('X-Biteship-Webhook-Secret', 'secret')->postJson($url, ['event' => 'order.status', 'order_id' => ['invalid']])->assertUnprocessable();
        $this->postJson($url, ['data' => 'invalid'])->assertUnprocessable();
        $this->postJson($url, ['event' => 'order.price', 'order_id' => $shipment->biteship_order_id, 'price' => 20000])->assertOk();
        $this->postJson($url, ['event' => 'order.status', 'order_id' => 'missing'])->assertNotFound();
        Http::assertNothingSent();
        $this->assertSame('10000.00', $shipment->fresh()->price);
    }

    public function test_timeout_rolls_back_without_trusting_webhook(): void
    {
        $shipment = $this->shipment();
        Http::fake(['api.biteship.com/v1/orders/*' => Http::failedConnection()]);
        $this->webhook($shipment, 'delivered')->assertStatus(503);
        $this->assertSame('pending', $shipment->fresh()->status->value);
        $this->assertDatabaseCount('shipment_status_histories', 0);
    }

    public function test_provider_snapshot_with_wrong_order_id_is_rejected(): void
    {
        $shipment = $this->shipment();
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response(['success' => true, 'id' => 'another-order', 'status' => 'delivered'])]);
        $this->webhook($shipment, 'delivered')->assertStatus(503);
        $this->assertSame('shipping', $shipment->order->fresh()->status->value);
        $this->assertNull($shipment->fresh()->biteship_status);
    }

    public function test_failed_legacy_shipment_can_recover_when_courier_becomes_available(): void
    {
        $shipment = $this->shipment();
        $shipment->update(['status' => 'failed', 'biteship_status' => 'courier_not_found']);
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($this->snapshot($shipment, 'allocated'))]);
        $this->webhook($shipment, 'allocated')->assertOk();
        $this->assertSame('allocated', $shipment->fresh()->status->value);
    }

    public function test_closed_order_is_not_reopened_by_return_update(): void
    {
        $shipment = $this->shipment();
        $shipment->order->update(['status' => 'completed']);
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($this->snapshot($shipment, 'returned'))]);
        $this->webhook($shipment, 'returned')->assertOk();
        $this->assertSame('returned', $shipment->fresh()->status->value);
        $this->assertSame('completed', $shipment->order->fresh()->status->value);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_admin_response_contains_audit_source_without_raw_provider_payload(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $shipment = $this->shipment();
        $this->actingAs($admin)->patch(route('admin.orders.shipments.status', [$shipment->order, $shipment]), ['status' => 'on_hold', 'description' => 'Periksa kurir'])->assertSessionHasNoErrors();
        $this->get(route('admin.orders.show', $shipment->order))->assertInertia(fn ($page) => $page
            ->where('order.shipments.0.status_source', 'admin')
            ->where('order.shipments.0.status_histories.0.changed_by', $admin->name)
            ->missing('order.shipments.0.status_histories.0.raw_payload')
            ->missing('order.shipments.0.response_payload'));
    }

    public function test_status_migration_refuses_lossy_rollback(): void
    {
        $shipment = $this->shipment();
        $shipment->update(['status' => 'returned']);
        $migration = require database_path('migrations/2026_10_19_000001_expand_biteship_shipment_statuses.php');
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Rollback ditolak');
        $migration->down();
    }

    public function test_sync_marks_unchanged_legacy_state_as_provider_verified_once(): void
    {
        $shipment = $this->shipment();
        $shipment->update(['status' => 'in_transit', 'biteship_status' => 'in_transit', 'tracking_id' => 'CURRENT-TRACK', 'waybill_id' => 'CURRENT-WB', 'courier_link' => 'https://example.com/track']);
        $shipment->statusHistories()->create(['status' => 'in_transit', 'provider_status' => 'in_transit']);
        Http::fake(['api.biteship.com/v1/orders/*' => Http::response($this->snapshot($shipment, 'in_transit'))]);
        $this->webhook($shipment, 'in_transit')->assertOk();
        $this->webhook($shipment, 'in_transit')->assertOk();
        $this->assertSame(2, $shipment->statusHistories()->count());
        $this->assertSame('biteship', $shipment->statusHistories()->latest('id')->first()->raw_payload['source']);
    }

    private function shipment(string $suffix = 'main'): Shipment
    {
        $user = User::factory()->create(['role' => UserRole::Customer]);
        $order = Order::create(['order_code' => 'ORDER-'.$suffix, 'user_id' => $user->id, 'subtotal' => 100000, 'total' => 110000, 'wallet_amount' => 110000, 'payment_status' => 'paid', 'status' => 'shipping']);

        return $order->shipments()->create(['shipment_code' => 'SHP-'.$suffix, 'courier_company' => 'jne', 'courier_type' => 'reg', 'price' => 10000, 'biteship_order_id' => 'provider-'.$suffix]);
    }

    private function snapshot(Shipment $shipment, string $status): array
    {
        return ['success' => true, 'id' => $shipment->biteship_order_id, 'status' => $status, 'courier' => ['waybill_id' => 'CURRENT-WB', 'tracking_id' => 'CURRENT-TRACK', 'link' => 'https://example.com/track']];
    }

    private function webhook(Shipment $shipment, string $status): TestResponse
    {
        return $this->withHeader('X-Biteship-Webhook-Secret', 'secret')->postJson(route('webhooks.biteship'), ['event' => 'order.status', 'order_id' => $shipment->biteship_order_id, 'status' => $status, 'courier_waybill_id' => 'STALE-WB']);
    }
}
