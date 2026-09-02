<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_email' => $this->customer_email,
            'customer_address' => $this->customer_address,
            'customer_note' => $this->customer_note,
            'book_id' => $this->book_id,
            'book_title' => $this->book_title,
            'book_isbn' => $this->book_isbn,
            'book_author' => $this->book_author,
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'subtotal' => $this->subtotal,
            'shipping_cost' => $this->shipping_cost,
            'total' => $this->total,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'created_at' => $this->created_at?->toISOString(),
            'book' => $this->whenLoaded('book', fn () => [
                'id' => $this->book?->id,
                'slug' => $this->book?->slug,
            ]),
            'payment_proofs' => PaymentProofResource::collection($this->whenLoaded('paymentProofs')),
            'status_histories' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'stock_movements' => BookStockMovementResource::collection($this->whenLoaded('stockMovements')),
        ];
    }
}
