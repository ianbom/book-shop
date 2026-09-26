<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'source_address_id', 'destination_contact_name', 'destination_contact_phone', 'destination_contact_email', 'destination_address', 'destination_note', 'destination_postal_code', 'destination_area_id', 'destination_location_id', 'destination_latitude', 'destination_longitude', 'province_name', 'city_name', 'district_name', 'subdistrict_name', 'created_at'])]
class OrderShippingAddress extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'destination_latitude' => 'decimal:7',
            'destination_longitude' => 'decimal:7',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<UserAddress, $this> */
    public function sourceAddress(): BelongsTo
    {
        return $this->belongsTo(UserAddress::class, 'source_address_id');
    }
}
