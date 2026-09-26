<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'label', 'destination_contact_name', 'destination_contact_phone', 'destination_contact_email', 'destination_address', 'destination_note', 'destination_postal_code', 'destination_area_id', 'destination_location_id', 'destination_latitude', 'destination_longitude', 'province_name', 'city_name', 'district_name', 'subdistrict_name', 'is_default'])]
class UserAddress extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'destination_latitude' => 'decimal:7',
            'destination_longitude' => 'decimal:7',
            'is_default' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'address_id');
    }

    /** @return HasMany<OrderShippingAddress, $this> */
    public function shippingAddressSnapshots(): HasMany
    {
        return $this->hasMany(OrderShippingAddress::class, 'source_address_id');
    }
}
