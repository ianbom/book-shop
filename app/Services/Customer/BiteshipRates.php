<?php

namespace App\Services\Customer;

use App\Models\StoreSetting;
use App\Models\UserAddress;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class BiteshipRates
{
    public function payload(StoreSetting $setting, UserAddress $address, Collection $items): array
    {
        $origin = $setting->origin_area_id ? ['origin_area_id' => $setting->origin_area_id]
            : ['origin_postal_code' => $setting->origin_postal_code];
        $destination = $address->destination_area_id ? ['destination_area_id' => $address->destination_area_id]
            : ['destination_postal_code' => $address->destination_postal_code];

        if (! array_filter($origin) || ! array_filter($destination) || blank($setting->couriers)) {
            throw ValidationException::withMessages(['shipping' => 'Lokasi atau kurir pengiriman belum lengkap.']);
        }

        return [...$origin, ...$destination, 'couriers' => $setting->couriers,
            'items' => $items->map(function ($item): array {
                $book = $item->book;

                return array_filter([
                    'name' => $book?->title,
                    'description' => $book?->description,
                    'category' => $book?->shipping_category ?? 'others',
                    'sku' => $book?->sku,
                    'value' => (int) round((float) $book?->price),
                    'quantity' => $item->quantity,
                    'weight' => $book?->weight,
                    'height' => $book?->height,
                    'length' => $book?->length,
                    'width' => $book?->width,
                ], fn ($value) => $value !== null);
            })->values()->all(),
        ];
    }

    public function get(array $payload): array
    {
        $key = config('services.biteship.key');
        if (blank($key)) {
            throw ValidationException::withMessages(['shipping' => 'Kunci API Biteship belum dikonfigurasi.']);
        }

        try {
            $response = Http::acceptJson()->withHeaders(['Authorization' => $key])
                ->connectTimeout(5)->timeout(12)->post('https://api.biteship.com/v1/rates/couriers', $payload);
        } catch (ConnectionException) {
            throw ValidationException::withMessages(['shipping' => 'Tarif pengiriman tidak tersedia. Coba lagi.']);
        }

        if (! $response->successful() || $response->json('success') !== true || ! is_array($response->json('pricing'))) {
            throw ValidationException::withMessages(['shipping' => 'Tarif pengiriman tidak tersedia. Periksa alamat dan coba lagi.']);
        }

        return collect($response->json('pricing'))
            ->filter(fn ($rate) => is_array($rate) && filled($rate['courier_code'] ?? null)
                && filled($rate['courier_service_code'] ?? null) && is_numeric($rate['price'] ?? null)
                && (float) $rate['price'] >= 0)
            ->map(fn (array $rate): array => [
                'courier_company' => (string) $rate['courier_code'],
                'courier_type' => (string) $rate['courier_service_code'],
                'courier_service_name' => (string) ($rate['courier_service_name'] ?? $rate['courier_service_code']),
                'price' => number_format((float) $rate['price'], 2, '.', ''),
                'duration' => $rate['duration'] ?? null,
                'rate_response' => $rate,
            ])->values()->all();
    }
}
