<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BiteshipWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $secret = config('services.biteship.webhook_secret');
        if (blank($secret) || ! hash_equals((string) $secret, (string) $request->header('X-Biteship-Webhook-Secret', ''))) {
            abort(401);
        }

        $data = $request->input('data', $request->all());
        if (! is_array($data)) {
            return response()->json(['message' => 'Payload tidak valid.'], 422);
        }
        if (! in_array($data['event'] ?? null, ['order.status', 'order.waybill_id'], true)) {
            return response()->json(['success' => true, 'ignored' => true]);
        }
        $providerId = $data['order_id'] ?? $data['id'] ?? null;
        $providerStatus = $data['status'] ?? null;
        if (! is_string($providerId) || ! is_string($providerStatus) || strlen($providerId) > 150 || strlen($providerStatus) > 100) {
            return response()->json(['message' => 'Order atau status Biteship tidak valid.'], 422);
        }

        $shipment = Shipment::query()->where('biteship_order_id', $providerId)->first();
        if (! $shipment) {
            return response()->json(['message' => 'Shipment tidak ditemukan.'], 404);
        }

        DB::transaction(function () use ($shipment, $data, $providerStatus, $providerId): void {
            $order = Order::query()->lockForUpdate()->findOrFail($shipment->order_id);
            $shipment = Shipment::query()->lockForUpdate()->findOrFail($shipment->id);
            if ($shipment->biteship_order_id !== $providerId) {
                return;
            }

            $status = match ($providerStatus) {
                'confirmed', 'allocated', 'scheduled', 'booked' => ShipmentStatus::Booked,
                'picking_up', 'pickup' => ShipmentStatus::Pickup,
                'picked', 'dropping_off', 'in_transit' => ShipmentStatus::InTransit,
                'delivered' => ShipmentStatus::Delivered,
                'cancelled' => ShipmentStatus::Cancelled,
                'failed', 'rejected', 'courier_not_found', 'return_in_transit', 'returned', 'disposed' => ShipmentStatus::Failed,
                default => null,
            };
            $updates = ['biteship_status' => $providerStatus];
            foreach (['courier_tracking_id' => 'tracking_id', 'courier_waybill_id' => 'waybill_id', 'courier_link' => 'courier_link'] as $source => $field) {
                if (isset($data[$source]) && is_string($data[$source])) {
                    $updates[$field] = $data[$source];
                }
            }

            $progress = [ShipmentStatus::Pending->value, ShipmentStatus::Booked->value, ShipmentStatus::Pickup->value, ShipmentStatus::InTransit->value, ShipmentStatus::Delivered->value];
            $canAdvance = $status !== null && ! in_array($shipment->status, [ShipmentStatus::Cancelled, ShipmentStatus::Failed, ShipmentStatus::Delivered], true)
                && ($status === ShipmentStatus::Failed || $status === ShipmentStatus::Cancelled
                    || array_search($status->value, $progress, true) > array_search($shipment->status->value, $progress, true));
            if ($canAdvance) {
                $updates['status'] = $status;
            }
            $shipment->update($updates);
            if ($canAdvance) {
                $shipment->statusHistories()->create([
                    'status' => $status, 'provider_status' => $providerStatus,
                    'description' => 'Status diterima dari Biteship.', 'occurred_at' => now(),
                    'raw_payload' => $data,
                ]);
            }
            if ($order->status === OrderStatus::Shipping && $order->shipments()->where('status', '!=', ShipmentStatus::Delivered)->doesntExist()) {
                $order->update(['status' => OrderStatus::Completed]);
                $order->statusHistories()->create(['status' => OrderStatus::Completed, 'note' => 'Seluruh pengiriman diterima melalui webhook Biteship.']);
            }
        });

        return response()->json(['success' => true]);
    }
}
