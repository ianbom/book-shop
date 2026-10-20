<?php

namespace App\Http\Resources\Admin;

use App\Models\PreOrderCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PreOrderCode */
class PreOrderCodeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'books_count' => $this->whenCounted('books'),
        ];
    }
}
