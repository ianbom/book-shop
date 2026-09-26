<?php

namespace App\Http\Resources\Admin;

use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Voucher */
class VoucherResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $now = now();
        $startsAt = $this->getRawOriginal('starts_at');
        $endsAt = $this->getRawOriginal('ends_at');
        $startsAt = $startsAt === null ? null : Carbon::parse((string) $startsAt);
        $endsAt = $endsAt === null ? null : Carbon::parse((string) $endsAt);

        $status = match (true) {
            ! $this->is_active => 'inactive',
            $startsAt?->gt($now) => 'scheduled',
            $endsAt?->lt($now) => 'expired',
            default => 'active',
        };

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => (string) $this->getRawOriginal('type'),
            'value' => $this->value,
            'usage_limit' => $this->usage_limit,
            'usages_count' => $this->usages_count,
            'starts_at' => $startsAt?->toISOString(),
            'ends_at' => $endsAt?->toISOString(),
            'status' => $status,
            'created_at' => $this->getRawOriginal('created_at') === null
                ? null
                : Carbon::parse((string) $this->getRawOriginal('created_at'))->toISOString(),
        ];
    }
}
