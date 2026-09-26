<?php

namespace App\Http\Resources\Admin;

use App\Models\WalletTopup;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WalletTopup */
class WalletTopupResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'topup_code' => $this->topup_code,
            'user' => $this->whenLoaded('user', fn () => [
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ]),
            'requested_amount' => $this->requested_amount,
            'credited_amount' => $this->credited_amount,
            'status' => (string) $this->getRawOriginal('status'),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewed_at' => $this->getRawOriginal('reviewed_at') === null
                ? null
                : Carbon::parse((string) $this->getRawOriginal('reviewed_at'))->toISOString(),
            'created_at' => $this->getRawOriginal('created_at') === null
                ? null
                : Carbon::parse((string) $this->getRawOriginal('created_at'))->toISOString(),
        ];
    }
}
