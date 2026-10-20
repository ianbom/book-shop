<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Models\Order;
use App\Models\Shipment;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class BiteshipShipmentService
{
    public function synchronize(Shipment $shipment): Shipment
    {
        return DB::transaction(function () use ($shipment): Shipment {
            $order = Order::query()->lockForUpdate()->findOrFail($shipment->order_id);
            $shipment = Shipment::query()->lockForUpdate()->findOrFail($shipment->id);
            if (blank($shipment->biteship_order_id)) {
                throw ValidationException::withMessages(['shipping' => 'Shipment belum terhubung ke Biteship.']);
            }
            $this->apply($shipment, $this->retrieve($shipment->biteship_order_id));
            if ($order->getRawOriginal('status') === OrderStatus::Shipping->value
                && ! $order->shipments()->where(fn ($query) => $query->whereNull('biteship_status')->orWhere('biteship_status', '!=', 'delivered'))->exists()) {
                $order->update(['status' => OrderStatus::Completed]);
                $order->statusHistories()->create(['status' => OrderStatus::Completed, 'note' => 'Seluruh pengiriman dikonfirmasi terkirim oleh Biteship.']);
            }

            return $shipment->refresh();
        });
    }

    /** @return array<string, mixed> */
    public function retrieve(string $providerId): array
    {
        $key = config('services.biteship.key');
        if (blank($key)) {
            throw ValidationException::withMessages(['shipping' => 'Kunci API Biteship belum dikonfigurasi.']);
        }
        try {
            $response = Http::acceptJson()->withHeaders(['Authorization' => $key])
                ->connectTimeout(5)->timeout(15)->get('https://api.biteship.com/v1/orders/'.rawurlencode($providerId));
        } catch (ConnectionException) {
            throw ValidationException::withMessages(['shipping' => 'Biteship tidak merespons. Coba sinkronisasi kembali.']);
        }
        $data = $response->json();
        if (! $response->successful() || ! is_array($data) || ($data['success'] ?? null) !== true
            || ($data['id'] ?? null) !== $providerId || ! is_string($data['status'] ?? null)
            || trim($data['status']) === '' || strlen($data['status']) > 100) {
            throw ValidationException::withMessages(['shipping' => 'Status Biteship belum dapat diverifikasi. Coba sinkronisasi kembali.']);
        }

        return $data;
    }

    /** @param array<string, mixed> $data */
    public function apply(Shipment $shipment, array $data): void
    {
        $providerStatus = $data['status'] ?? null;
        if (! is_string($providerStatus) || trim($providerStatus) === '' || strlen($providerStatus) > 100) {
            throw ValidationException::withMessages(['shipping' => 'Status pada respons Biteship tidak valid.']);
        }
        $status = ShipmentStatus::tryFrom($providerStatus) ?? ShipmentStatus::from($shipment->getRawOriginal('status'));
        $latest = $shipment->statusHistories()->latest('id')->first();
        $latestSource = data_get($latest?->getAttribute('raw_payload'), 'source');
        $manual = $latestSource === 'admin';
        $updates = ['status' => $status, 'biteship_status' => $providerStatus, 'response_payload' => $data];
        foreach (['tracking_id' => 150, 'waybill_id' => 150, 'link' => 500] as $field => $limit) {
            $value = data_get($data, 'courier.'.$field);
            if (is_string($value) && trim($value) !== '' && strlen($value) <= $limit
                && ($field !== 'link' || (filter_var($value, FILTER_VALIDATE_URL) && in_array(parse_url($value, PHP_URL_SCHEME), ['https', 'http'], true)))) {
                $updates[$field === 'link' ? 'courier_link' : $field] = $value;
            }
        }
        $shipment->fill($updates);
        $changed = $shipment->isDirty(['status', 'biteship_status', 'tracking_id', 'waybill_id', 'courier_link']) || $latestSource !== 'biteship';
        $shipment->save();

        $importedCurrent = false;
        $history = data_get($data, 'courier.history', []);
        foreach (is_array($history) ? $history : [] as $event) {
            if (! is_array($event) || ! is_string($event['status'] ?? null) || trim($event['status']) === '' || strlen($event['status']) > 100) {
                continue;
            }
            try {
                $date = is_string($event['updated_at'] ?? null) ? CarbonImmutable::parse($event['updated_at'])->utc() : null;
            } catch (\Exception) {
                $date = null;
            }
            $note = is_string($event['note'] ?? null) ? mb_substr($event['note'], 0, 10000) : null;
            $fingerprint = hash('sha256', json_encode([$event['status'], $date?->toIso8601String(), $note], JSON_THROW_ON_ERROR));
            if ($shipment->statusHistories()->where('raw_payload->fingerprint', $fingerprint)->exists()) {
                continue;
            }
            $shipment->statusHistories()->create([
                'status' => ShipmentStatus::tryFrom($event['status']) ?? $status,
                'provider_status' => $event['status'], 'description' => $note, 'occurred_at' => $date,
                'raw_payload' => ['source' => 'biteship', 'fingerprint' => $fingerprint, 'event' => $event],
            ]);
            $importedCurrent = $importedCurrent || $event['status'] === $providerStatus;
        }
        if ($changed && (! $importedCurrent || $manual)) {
            $shipment->statusHistories()->create([
                'status' => $status, 'provider_status' => $providerStatus,
                'description' => 'Status dan tracking diverifikasi melalui Biteship.', 'occurred_at' => now(),
                'raw_payload' => ['source' => 'biteship', 'snapshot' => $data],
            ]);
        }
    }
}
