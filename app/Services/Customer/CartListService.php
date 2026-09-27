<?php

namespace App\Services\Customer;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class CartListService
{
    public function get(User $user): array
    {
        $cart = $user->cart()->with([
            'items' => fn ($query) => $query->orderBy('id'),
            'items.book.images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
        ])->first();

        $items = [];
        $totalCents = 0;

        foreach ($cart?->items ?? [] as $item) {
            $book = $item->book;
            $image = $book?->images->firstWhere('is_primary') ?? $book?->images->first();
            $lineCents = $book ? (int) round((float) $book->price * 100) * $item->quantity : 0;
            $totalCents += $lineCents;

            $items[] = [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'line_subtotal' => $this->money($lineCents),
                'book' => $book ? [
                    'id' => $book->id,
                    'title' => $book->title,
                    'author' => $book->author,
                    'slug' => $book->slug,
                    'price' => $book->price,
                    'stock' => $book->stock,
                    'is_active' => $book->is_active,
                    'primary_image' => $image ? [
                        'url' => Storage::disk('public')->url($image->image_path),
                        'alt_text' => $image->alt_text,
                    ] : null,
                ] : null,
            ];
        }

        return [
            'items' => $items,
            'subtotal' => $this->money($totalCents),
            'total' => $this->money($totalCents),
        ];
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
