<?php

namespace App\Models;

use App\Enums\ShipmentDeliveryType;
use App\Enums\ShipmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['order_id', 'shipment_code', 'courier_company', 'courier_type', 'delivery_type', 'courier_service_name', 'price', 'duration', 'rate_response', 'biteship_order_id', 'tracking_id', 'waybill_id', 'courier_link', 'biteship_status', 'response_payload', 'status'])]
class Shipment extends Model
{
    protected $attributes = [
        'delivery_type' => 'now',
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'delivery_type' => ShipmentDeliveryType::class,
            'price' => 'decimal:2',
            'rate_response' => 'array',
            'response_payload' => 'array',
            'status' => ShipmentStatus::class,
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return HasMany<ShipmentItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ShipmentItem::class);
    }

    /** @return HasMany<ShipmentStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(ShipmentStatusHistory::class);
    }
}
