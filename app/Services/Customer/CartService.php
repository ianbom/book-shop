<?php

namespace App\Services\Customer;

use App\Models\Book;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function update(User $user, int $cartItemId, int $quantity): void
    {
        DB::transaction(function () use ($user, $cartItemId, $quantity): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $item = $user->cart()->firstOrFail()->items()->whereKey($cartItemId)->lockForUpdate()->firstOrFail();
            $book = Book::query()->active()->whereKey($item->book_id)->lockForUpdate()->first();

            if (! $book || $quantity > $book->stock) {
                throw ValidationException::withMessages(['quantity' => 'Buku tidak tersedia atau stok tidak mencukupi.']);
            }

            $item->update(['quantity' => $quantity]);
        });
    }

    public function remove(User $user, int $cartItemId): void
    {
        DB::transaction(function () use ($user, $cartItemId): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $user->cart()->firstOrFail()->items()->whereKey($cartItemId)->firstOrFail()->delete();
        });
    }

    public function add(User $user, int $bookId): void
    {
        DB::transaction(function () use ($user, $bookId): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $book = Book::query()->active()->whereKey($bookId)->lockForUpdate()->first();

            if (! $book) {
                throw ValidationException::withMessages(['book_id' => 'Buku tidak tersedia.']);
            }

            $cart = $user->cart()->firstOrCreate([]);
            $item = $cart->items()->where('book_id', $bookId)->lockForUpdate()->first();
            $quantity = ($item?->quantity ?? 0) + 1;

            if ($quantity > $book->stock) {
                throw ValidationException::withMessages(['book_id' => 'Stok buku tidak mencukupi.']);
            }

            if ($item) {
                $item->update(['quantity' => $quantity]);
            } else {
                $cart->items()->create(['book_id' => $bookId, 'quantity' => 1]);
            }
        });
    }
}
