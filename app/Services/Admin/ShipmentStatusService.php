<?php

namespace App\Services\Admin;

use App\Enums\ShipmentStatus;
use App\Models\Shipment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShipmentStatusService
{
    /** @var array<string, array<int, ShipmentStatus>> */
    private const TRANSITIONS = [
        'pending' => [ShipmentStatus::Booked, ShipmentStatus::Cancelled, ShipmentStatus::Failed],
        'booked' => [ShipmentStatus::Pickup, ShipmentStatus::Cancelled, ShipmentStatus::Failed],
        'pickup' => [ShipmentStatus::InTransit, ShipmentStatus::Failed],
        'in_transit' => [ShipmentStatus::Delivered, ShipmentStatus::Failed],
    ];

    // ponytail: Status lokal saja; sinkronkan webhook Biteship setelah booking kurir tersedia.
    public function update(Shipment $shipment, ShipmentStatus $nextStatus, ?string $description): Shipment
    {
        return DB::transaction(function () use ($shipment, $nextStatus, $description): Shipment {
            $shipment = Shipment::query()->lockForUpdate()->findOrFail($shipment->id);
            if ($shipment->biteship_order_id === null) {
                throw ValidationException::withMessages(['status' => 'Buat order pengiriman di Biteship sebelum mengubah status ini.']);
            }
            if (! in_array($nextStatus, self::TRANSITIONS[$shipment->status->value] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'Transisi status pengiriman tidak valid.']);
            }

            $shipment->update(['status' => $nextStatus]);
            $shipment->statusHistories()->create([
                'status' => $nextStatus,
                'description' => $description,
                'occurred_at' => now(),
            ]);

            return $shipment->refresh();
        });
    }
}
