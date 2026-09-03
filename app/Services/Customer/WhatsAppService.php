<?php

namespace App\Services\Customer;

use App\Models\StoreSetting;
use Illuminate\Validation\ValidationException;

class WhatsAppService
{
    public function storeNumber(): ?string
    {
        return $this->normalize((string) StoreSetting::query()->value('whatsapp_number'));
    }

    public function storeNumberOrFail(): string
    {
        return $this->storeNumber() ?? throw ValidationException::withMessages([
            'order' => 'Nomor WhatsApp toko belum tersedia.',
        ]);
    }

    public function url(string $number, string $message): string
    {
        return "https://wa.me/{$number}?text=".rawurlencode($message);
    }

    private function normalize(string $number): ?string
    {
        $normalized = preg_replace('/\D+/', '', $number);
        $normalized = str_starts_with($normalized, '0')
            ? '62'.substr($normalized, 1)
            : ltrim($normalized, '+');

        return preg_match('/^62\d{8,14}$/', $normalized) ? $normalized : null;
    }
}
