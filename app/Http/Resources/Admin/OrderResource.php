<?php

namespace App\Http\Resources\Admin;

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
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
