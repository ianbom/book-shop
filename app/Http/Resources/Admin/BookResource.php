<?php

namespace App\Http\Resources\Admin;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Book */
class BookResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'isbn' => $this->isbn,
            'sku' => $this->sku,
            'author' => $this->author,
            'description' => $this->description,
            'price' => $this->price,
            'shipping_category' => $this->shipping_category,
            'weight' => $this->weight,
            'height' => $this->height,
            'length' => $this->length,
            'width' => $this->width,
            'stock' => $this->stock,
            'sale_type' => $this->sale_type->value,
            'preorder_estimated_date' => $this->preorder_estimated_date?->format('Y-m-d'),
            'preorder_note' => $this->preorder_note,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'categories' => $this->whenLoaded('categories', fn () => $this->categories
                ->map(fn ($category) => (new CategoryResource($category))->resolve($request))
                ->values()
                ->all()),
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => Storage::disk('public')->url($image->image_path),
                'alt_text' => $image->alt_text,
                'sort_order' => $image->sort_order,
                'is_primary' => $image->is_primary,
            ])->values()),
            'stock_movements' => $this->whenLoaded('stockMovements', fn () => $this->stockMovements
                ->map(fn ($movement) => (new BookStockMovementResource($movement))->resolve($request))
                ->values()
                ->all()),
            'primary_image_url' => $this->whenLoaded('images', fn () => ($this->images->firstWhere('is_primary') ?? $this->images->first()) ? Storage::disk('public')->url(($this->images->firstWhere('is_primary') ?? $this->images->first())->image_path) : null),
        ];
    }
}
