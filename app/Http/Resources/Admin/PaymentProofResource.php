<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PaymentProofResource extends JsonResource
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
            'image_url' => Storage::disk('public')->url($this->image_path),
            'payment_amount' => $this->payment_amount,
            'paid_at' => $this->paid_at?->toISOString(),
            'note' => $this->note,
            'uploaded_by' => $this->whenLoaded('uploadedBy', fn () => [
                'id' => $this->uploadedBy?->id,
                'name' => $this->uploadedBy?->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
