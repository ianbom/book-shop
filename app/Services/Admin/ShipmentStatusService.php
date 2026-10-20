<?php

namespace App\Services\Admin;

use App\Enums\ShipmentStatus;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShipmentStatusService
{
    public function update(Shipment $shipment, ShipmentStatus $nextStatus, string $description, User $admin): Shipment
    {
        return DB::transaction(function () use ($shipment, $nextStatus, $description, $admin): Shipment {
            Order::query()->lockForUpdate()->findOrFail($shipment->order_id);
            $shipment = Shipment::query()->lockForUpdate()->findOrFail($shipment->id);
            if ($shipment->biteship_order_id === null) {
                throw ValidationException::withMessages(['status' => 'Buat order pengiriman di Biteship sebelum mengubah status ini.']);
            }
            if ($nextStatus === ShipmentStatus::Pending || $nextStatus->value === $shipment->getRawOriginal('status')) {
                throw ValidationException::withMessages(['status' => 'Pilih status pengiriman yang berbeda, bukan pending.']);
            }

            $shipment->update(['status' => $nextStatus]);
            $shipment->statusHistories()->create([
                'status' => $nextStatus,
                'description' => $description,
                'occurred_at' => now(),
                'raw_payload' => ['source' => 'admin', 'actor_id' => $admin->id, 'actor_name' => $admin->name],
            ]);

            return $shipment->refresh();
        });
    }
}
