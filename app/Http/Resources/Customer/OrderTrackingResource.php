<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderTrackingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_code' => $this->order_code,
            'book_title' => $this->book_title,
            'book_author' => $this->book_author,
            'book_isbn' => $this->book_isbn,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'subtotal' => $this->subtotal,
            'shipping_cost' => $this->shipping_cost,
            'total' => $this->total,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'status_histories' => $this->whenLoaded('statusHistories', fn () => $this->statusHistories
                ->map(fn ($history) => [
                    'status' => $history->status->value,
                    'note' => $history->note,
                    'created_at' => $history->created_at?->toISOString(),
                ])
                ->values()
                ->all()),
        ];
    }
}
