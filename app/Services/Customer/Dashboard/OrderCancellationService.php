<?php

namespace App\Services\Customer\Dashboard;

use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Models\Order;
use App\Models\User;
use App\Services\Admin\OrderStatusService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderCancellationService
{
    public function __construct(private readonly OrderStatusService $statusService) {}

    public function cancel(Order $order, User $customer): Order
    {
        return DB::transaction(function () use ($order, $customer): Order {
            $order = Order::query()->where('user_id', $customer->id)->lockForUpdate()->findOrFail($order->id);

            if (! in_array($order->status, [OrderStatus::Pending, OrderStatus::WaitingPreorder], true)) {
                throw ValidationException::withMessages(['status' => 'Pesanan hanya dapat dibatalkan sebelum diproses.']);
            }

            $shipments = $order->shipments()->lockForUpdate()->get();
            if ($shipments->contains(fn ($shipment) => $shipment->status !== ShipmentStatus::Pending
                || $shipment->biteship_order_id !== null || $shipment->tracking_id !== null
                || $shipment->waybill_id !== null || $shipment->courier_link !== null
                || $shipment->biteship_status !== null)) {
                throw ValidationException::withMessages(['status' => 'Pengiriman telah diproses. Hubungi admin untuk membatalkan pesanan.']);
            }

            $this->statusService->update($order, OrderStatus::Cancelled, 'Dibatalkan oleh customer.', $customer);

            foreach ($shipments as $shipment) {
                $shipment->update(['status' => ShipmentStatus::Cancelled]);
                $shipment->statusHistories()->create([
                    'status' => ShipmentStatus::Cancelled,
                    'description' => 'Pesanan dibatalkan oleh customer.',
                    'occurred_at' => now(),
                ]);
            }

            return $order->refresh();
        }, 3);
    }
}
