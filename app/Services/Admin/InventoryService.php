<?php

namespace App\Services\Admin;

use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function adjust(Book $book, StockMovementType $type, int $quantity, ?string $note, User $admin): BookStockMovement
    {
        if (! in_array($type, [StockMovementType::AdjustmentIn, StockMovementType::AdjustmentOut], true)) {
            throw ValidationException::withMessages(['type' => 'Tipe penyesuaian stok tidak valid.']);
        }

        return $this->apply($book->id, $type, $type === StockMovementType::AdjustmentOut ? -$quantity : $quantity, $note, $admin);
    }

    public function restoreForCancellation(Order $order, User $admin): BookStockMovement
    {
        return $this->apply($order->book_id, StockMovementType::Cancellation, $order->quantity, 'Pengembalian stok karena order dibatalkan.', $admin, $order);
    }

    public function recordInitial(Book $book, int $quantity, User $admin): ?BookStockMovement
    {
        if ($quantity === 0) {
            return null;
        }

        return BookStockMovement::create([
            'book_id' => $book->id,
            'changed_by' => $admin->id,
            'type' => StockMovementType::Initial,
            'quantity' => $quantity,
            'stock_before' => 0,
            'stock_after' => $quantity,
        ]);
    }

    private function apply(int $bookId, StockMovementType $type, int $delta, ?string $note, User $admin, ?Order $order = null): BookStockMovement
    {
        return DB::transaction(function () use ($bookId, $type, $delta, $note, $admin, $order): BookStockMovement {
            $book = Book::withTrashed()->lockForUpdate()->findOrFail($bookId);
            $before = $book->stock;
            $after = $before + $delta;

            if ($after < 0) {
                throw ValidationException::withMessages(['quantity' => 'Stok tidak mencukupi untuk penyesuaian ini.']);
            }

            $book->update(['stock' => $after]);

            return BookStockMovement::create([
                'book_id' => $book->id,
                'order_id' => $order?->id,
                'changed_by' => $admin->id,
                'type' => $type,
                'quantity' => $delta,
                'stock_before' => $before,
                'stock_after' => $after,
                'note' => $note,
            ]);
        });
    }
}
