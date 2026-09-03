<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BookResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $primaryImage = $this->images->firstWhere('is_primary') ?? $this->images->first();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'isbn' => $this->isbn,
            'author' => $this->author,
            'description' => $this->description,
            'price' => $this->price,
            'stock' => $this->stock,
            'categories' => $this->categories
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ])
                ->values()
                ->all(),
            'images' => $this->images
                ->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => Storage::disk('public')->url($image->image_path),
                    'alt_text' => $image->alt_text,
                    'sort_order' => $image->sort_order,
                    'is_primary' => $image->is_primary,
                ])
                ->values()
                ->all(),
            'primary_image' => $primaryImage ? [
                'id' => $primaryImage->id,
                'url' => Storage::disk('public')->url($primaryImage->image_path),
                'alt_text' => $primaryImage->alt_text,
            ] : null,
        ];
    }
}
