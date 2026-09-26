<?php

namespace App\Http\Resources\Admin;

use App\Models\WalletTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WalletTransaction */
class WalletTransactionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->whenLoaded('wallet', fn () => [
                'name' => $this->wallet?->user?->name,
                'email' => $this->wallet?->user?->email,
            ]),
            'order_code' => $this->whenLoaded('order', fn () => $this->order?->order_code),
            'topup_code' => $this->whenLoaded('topup', fn () => $this->topup?->topup_code),
            'type' => (string) $this->getRawOriginal('type'),
            'direction' => (string) $this->getRawOriginal('direction'),
            'amount' => $this->amount,
            'balance_before' => $this->balance_before,
            'balance_after' => $this->balance_after,
            'note' => $this->note,
            'created_at' => $this->getRawOriginal('created_at') === null
                ? null
                : Carbon::parse((string) $this->getRawOriginal('created_at'))->toISOString(),
        ];
    }
}
