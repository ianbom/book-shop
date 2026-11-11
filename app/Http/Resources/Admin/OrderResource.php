<?php

namespace App\Http\Resources\Admin;

use App\Services\Customer\OrderSettlementService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $item = $this->items->first();
        $image = $item?->book?->images->firstWhere('is_primary') ?? $item?->book?->images->first();

        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'source' => $this->source,
            'pending_review' => (bool) $this->getAttribute('pending_review'),
            'shipping_selected' => ! $this->isImported() || $this->shipping_selected_at !== null,
            'archived_import' => $this->isArchivedImport(),
            'settlement_summary' => $this->isImported() ? app(OrderSettlementService::class)->summary($this->resource) : null,
            'customer_name' => $this->user?->name,
            'customer_email' => $this->user?->email,
            'book_title' => $item?->name ?? 'Buku',
            'quantity' => $this->items->sum('quantity'),
            'primary_image_url' => $image ? Storage::disk('public')->url($image->image_path) : null,
            'subtotal' => $this->subtotal,
            'shipping_cost' => $this->shipping_cost,
            'total' => $this->total,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'shipment_status' => $this->shipments->first()?->getRawOriginal('status'),
            'eta' => $this->getAttribute('preorder_estimated_date')?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
