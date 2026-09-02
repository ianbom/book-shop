<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderStatusHistoryResource extends JsonResource
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
            'status' => $this->status->value,
            'note' => $this->note,
            'changed_by' => $this->whenLoaded('changedBy', fn () => [
                'id' => $this->changedBy?->id,
                'name' => $this->changedBy?->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
