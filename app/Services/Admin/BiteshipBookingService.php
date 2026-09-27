<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\Shipment;
use App\Models\StoreSetting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class BiteshipBookingService
{
    public function book(Order $order, Shipment $shipment): void
    {
        if ($shipment->biteship_order_id !== null) {
            return;
        }
        if ($shipment->status->value !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Status shipment bukan pending; booking Biteship dibatalkan.']);
        }

        $setting = StoreSetting::query()->first();
        $address = $order->shippingAddress;
        if (! $setting || ! $address || blank($setting->origin_address) || blank($setting->origin_contact_name)
            || blank($setting->origin_contact_phone) || blank($address->destination_address)
            || blank($address->destination_contact_name) || blank($address->destination_contact_phone)
            || blank($shipment->courier_company) || blank($shipment->courier_type)
            || blank($setting->origin_area_id ?: $setting->origin_postal_code)
            || blank($address->destination_area_id ?: $address->destination_postal_code)) {
            throw ValidationException::withMessages(['status' => 'Alamat toko, penerima, atau layanan kurir belum lengkap.']);
        }

        $items = $shipment->items()->with('orderItem')->get()->map(function ($shipmentItem): array {
            $item = $shipmentItem->orderItem;
            if (! $item || $item->weight < 1 || $shipmentItem->quantity < 1) {
                throw ValidationException::withMessages(['status' => 'Item pengiriman belum lengkap.']);
            }

            return array_filter([
                'name' => $item->name, 'description' => $item->description,
                'category' => $item->category ?: 'others', 'sku' => $item->sku,
                'value' => (int) round((float) $item->value),
                'quantity' => $shipmentItem->quantity, 'weight' => $item->weight,
                'height' => $item->height, 'length' => $item->length, 'width' => $item->width,
            ], fn ($value) => $value !== null);
        })->all();
        if ($items === []) {
            throw ValidationException::withMessages(['status' => 'Item pengiriman belum tersedia.']);
        }

        $key = config('services.biteship.key');
        if (blank($key)) {
            throw ValidationException::withMessages(['status' => 'Kunci API Biteship belum dikonfigurasi.']);
        }

        $payload = array_filter([
            'reference_id' => $shipment->shipment_code,
            'shipper_contact_name' => $setting->shipper_contact_name ?: $setting->origin_contact_name,
            'shipper_contact_phone' => $setting->shipper_contact_phone ?: $setting->origin_contact_phone,
            'shipper_contact_email' => $setting->shipper_contact_email ?: $setting->origin_contact_email,
            'shipper_organization' => $setting->shipper_organization ?: $setting->store_name,
            'origin_contact_name' => $setting->origin_contact_name,
            'origin_contact_phone' => $setting->origin_contact_phone,
            'origin_contact_email' => $setting->origin_contact_email,
            'origin_address' => $setting->origin_address,
            'origin_note' => $setting->origin_note,
            'origin_postal_code' => $setting->origin_area_id ? null : (int) $setting->origin_postal_code,
            'origin_area_id' => $setting->origin_area_id ?: null,
            'origin_location_id' => $setting->origin_location_id,
            'origin_coordinate' => $setting->origin_latitude !== null && $setting->origin_longitude !== null
                ? ['latitude' => (float) $setting->origin_latitude, 'longitude' => (float) $setting->origin_longitude] : null,
            'destination_contact_name' => $address->destination_contact_name,
            'destination_contact_phone' => $address->destination_contact_phone,
            'destination_contact_email' => $address->destination_contact_email,
            'destination_address' => $address->destination_address,
            'destination_note' => $address->destination_note,
            'destination_postal_code' => $address->destination_area_id ? null : (int) $address->destination_postal_code,
            'destination_area_id' => $address->destination_area_id ?: null,
            'destination_location_id' => $address->destination_location_id,
            'destination_coordinate' => $address->destination_latitude !== null && $address->destination_longitude !== null
                ? ['latitude' => (float) $address->destination_latitude, 'longitude' => (float) $address->destination_longitude] : null,
            'courier_company' => $shipment->courier_company,
            'courier_type' => $shipment->courier_type,
            'delivery_type' => $shipment->delivery_type->value,
            'order_note' => $order->customer_note,
            'items' => $items,
        ], fn ($value) => $value !== null && $value !== '');

        try {
            $response = Http::acceptJson()->withHeaders(['Authorization' => $key])
                ->connectTimeout(5)->timeout(20)->post('https://api.biteship.com/v1/orders', $payload);
        } catch (ConnectionException) {
            throw ValidationException::withMessages(['status' => 'Biteship tidak merespons. Periksa status booking sebelum mencoba ulang.']);
        }

        $duplicate = $response->json('code') === 40002060
            && $response->json('details.reference_id') === $shipment->shipment_code
            && filled($response->json('details.order_id'));
        if (! $duplicate && (! $response->successful() || $response->json('success') !== true || blank($response->json('id')))) {
            throw ValidationException::withMessages(['status' => 'Biteship gagal membuat pengiriman. Periksa data alamat dan coba lagi.']);
        }

        $shipment->update([
            'biteship_order_id' => (string) ($duplicate ? $response->json('details.order_id') : $response->json('id')),
            'tracking_id' => $response->json('courier.tracking_id'),
            'waybill_id' => $duplicate ? $response->json('details.waybill_id') : $response->json('courier.waybill_id'),
            'courier_link' => $response->json('courier.link'),
            'biteship_status' => $duplicate ? 'confirmed' : $response->json('status'),
            'response_payload' => $response->json(),
            'status' => 'booked',
        ]);
        $shipment->statusHistories()->create([
            'status' => 'booked', 'provider_status' => $duplicate ? 'confirmed' : $response->json('status'),
            'description' => 'Order pengiriman dibuat di Biteship.', 'occurred_at' => now(),
        ]);
    }
}
