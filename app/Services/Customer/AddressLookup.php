<?php

namespace App\Services\Customer;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;

class AddressLookup
{
    /** @return array<int, array{id: string, postal_code: string, province: string, city: string, district: string}> */
    public function areas(string $postalCode): array
    {
        $key = config('services.biteship.key');
        if (! $key) {
            throw new RuntimeException('Layanan pencarian alamat belum dikonfigurasi.');
        }

        return Cache::remember("biteship:areas:{$postalCode}", 3600, function () use ($postalCode, $key): array {
            try {
                $response = Http::acceptJson()->withHeaders(['Authorization' => $key])
                    ->timeout(8)->get('https://api.biteship.com/v1/maps/areas', [
                        'countries' => 'ID', 'input' => $postalCode, 'type' => 'single',
                    ]);
            } catch (ConnectionException $exception) {
                throw new RuntimeException('Layanan pencarian alamat tidak tersedia.', previous: $exception);
            }

            if (! $response->successful() || $response->json('success') !== true || ! is_array($response->json('areas'))) {
                throw new RuntimeException('Layanan pencarian alamat tidak tersedia.');
            }

            return collect($response->json('areas'))
                ->filter(fn ($area) => is_array($area)
                    && (string) ($area['postal_code'] ?? '') === $postalCode
                    && ! empty($area['id'])
                    && ! empty($area['administrative_division_level_1_name'])
                    && ! empty($area['administrative_division_level_2_name'])
                    && ! empty($area['administrative_division_level_3_name']))
                ->map(fn (array $area) => [
                    'id' => (string) $area['id'],
                    'postal_code' => $postalCode,
                    'province' => (string) ($area['administrative_division_level_1_name'] ?? ''),
                    'city' => (string) ($area['administrative_division_level_2_name'] ?? ''),
                    'district' => (string) ($area['administrative_division_level_3_name'] ?? ''),
                ])
                ->unique('id')->values()->all();
        });
    }

    /** @return array{latitude: float, longitude: float}|null */
    public function mapCenter(string $postalCode): ?array
    {
        $userAgent = config('services.nominatim.user_agent');
        if (! $userAgent) {
            throw new RuntimeException('Layanan peta belum dikonfigurasi.');
        }

        $result = Cache::remember("nominatim:postal:{$postalCode}", 604800, function () use ($postalCode, $userAgent): array {
            return Cache::lock('nominatim:global-lock', 12)->block(3, function () use ($postalCode, $userAgent): array {
                $response = RateLimiter::attempt('nominatim:global', 1, function () use ($postalCode, $userAgent) {
                    try {
                        return Http::acceptJson()->withHeaders(['User-Agent' => $userAgent])
                            ->timeout(8)->get('https://nominatim.openstreetmap.org/search', [
                                'format' => 'jsonv2', 'countrycodes' => 'id',
                                'postalcode' => $postalCode, 'limit' => 1,
                            ]);
                    } catch (ConnectionException $exception) {
                        throw new RuntimeException('Pencarian titik peta tidak tersedia.', previous: $exception);
                    }
                }, 1);

                if ($response === false) {
                    throw new RuntimeException('Pencarian titik peta sedang sibuk.');
                }
                if (! $response->successful() || ! is_array($response->json())) {
                    throw new RuntimeException('Pencarian titik peta tidak tersedia.');
                }

                $location = $response->json()[0] ?? null;

                return is_array($location)
                    && is_numeric($location['lat'] ?? null)
                    && is_numeric($location['lon'] ?? null)
                    && abs((float) $location['lat']) <= 90
                    && abs((float) $location['lon']) <= 180
                    ? ['latitude' => (float) $location['lat'], 'longitude' => (float) $location['lon']]
                    : [];
            });
        });

        return $result ?: null;
    }
}
