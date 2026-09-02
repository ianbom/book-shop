<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function update(Order $order, OrderStatus $nextStatus, ?string $note, User $admin): Order
    {
        return DB::transaction(function () use ($order, $nextStatus, $note, $admin): Order {
            $order = Order::lockForUpdate()->findOrFail($order->id);
            $currentStatus = $order->status;

            if ($currentStatus === $nextStatus) {
                throw ValidationException::withMessages(['status' => 'Status order tidak berubah.']);
            }

            if (! in_array($nextStatus, $this->transitions()[$currentStatus->value] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'Transisi status order tidak valid.']);
            }

            $order->update(['status' => $nextStatus]);
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => $nextStatus,
                'changed_by' => $admin->id,
                'note' => $note,
            ]);

            if ($nextStatus === OrderStatus::Cancelled) {
                $alreadyRestored = BookStockMovement::query()
                    ->where('order_id', $order->id)
                    ->where('type', StockMovementType::Cancellation)
                    ->exists();

                if ($alreadyRestored) {
                    throw ValidationException::withMessages(['status' => 'Stok order ini sudah pernah dikembalikan.']);
                }

                $this->inventory->restoreForCancellation($order, $admin);
            }

            return $order->refresh();
        });
    }

    /** @return array<string, array<int, OrderStatus>> */
    private function transitions(): array
    {
        return [
            OrderStatus::Pending->value => [OrderStatus::Packing, OrderStatus::Cancelled],
            OrderStatus::Packing->value => [OrderStatus::Shipping, OrderStatus::Cancelled],
            OrderStatus::Shipping->value => [OrderStatus::Completed],
        ];
    }
}
