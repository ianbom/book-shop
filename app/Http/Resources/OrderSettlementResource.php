<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Services\Customer\OrderSettlementService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderSettlementResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'archived' => $this->isArchivedImport(),
            'locked' => $this->isArchivedImport() || ! in_array($this->status->value, ['pending', 'waiting_preorder', 'processing', 'packing'], true)
                || $this->payment_status->value === 'paid' || $this->paymentSubmissions()->whereIn('status', ['pending', 'approved'])->exists(),
            'summary' => app(OrderSettlementService::class)->summary($this->resource),
            'submissions' => $this->paymentSubmissions()->latest('id')->get()->map(fn ($submission) => [
                'id' => $submission->id, 'amount' => $submission->amount, 'status' => $submission->status,
                'reason' => $submission->reason, 'bank_account' => $submission->bank_account_snapshot,
                'proof_url' => route('order-payments.proof', $submission),
                'created_at' => $submission->created_at?->toISOString(), 'reviewed_at' => $submission->reviewed_at?->toISOString(),
            ]),
        ];
    }
}
