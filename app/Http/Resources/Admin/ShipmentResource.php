<?php

namespace App\Http\Resources\Admin;

use App\Models\Shipment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Shipment */
class ShipmentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shipment_code' => $this->shipment_code,
            'order' => $this->whenLoaded('order', fn () => [
                'order_code' => $this->order?->order_code,
                'customer_name' => $this->order?->user?->name,
            ]),
            'courier_company' => $this->courier_company,
            'courier_type' => $this->courier_type,
            'courier_service_name' => $this->courier_service_name,
            'delivery_type' => (string) $this->getRawOriginal('delivery_type'),
            'price' => $this->price,
            'tracking_id' => $this->tracking_id,
            'waybill_id' => $this->waybill_id,
            'status' => (string) $this->getRawOriginal('status'),
            'created_at' => $this->getRawOriginal('created_at') === null
                ? null
                : Carbon::parse((string) $this->getRawOriginal('created_at'))->toISOString(),
        ];
    }
}
