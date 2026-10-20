<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Services\Admin\BiteshipShipmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BiteshipWebhookController extends Controller
{
    public function __invoke(Request $request, BiteshipShipmentService $service): JsonResponse
    {
        $secret = config('services.biteship.webhook_secret');
        if (blank($secret) || ! hash_equals((string) $secret, (string) $request->header('X-Biteship-Webhook-Secret', ''))) {
            abort(401);
        }
        $data = $request->input('data', $request->all());
        if (! is_array($data)) {
            return response()->json(['message' => 'Payload tidak valid.'], 422);
        }
        $event = $data['event'] ?? $request->input('event');
        if (! in_array($event, ['order.status', 'order.waybill_id'], true)) {
            return response()->json(['success' => true, 'ignored' => true]);
        }
        $providerId = $data['order_id'] ?? $data['id'] ?? null;
        if (! is_string($providerId) || trim($providerId) === '' || strlen($providerId) > 150
            || (isset($data['status']) && (! is_string($data['status']) || trim($data['status']) === '' || strlen($data['status']) > 100))) {
            return response()->json(['message' => 'Order atau status Biteship tidak valid.'], 422);
        }
        $shipment = Shipment::query()->where('biteship_order_id', $providerId)->firstOrFail();
        try {
            $service->synchronize($shipment);
        } catch (ValidationException) {
            return response()->json(['message' => 'Sinkronisasi Biteship belum berhasil. Kirim ulang webhook.'], 503);
        }

        return response()->json(['success' => true]);
    }
}
