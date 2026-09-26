<?php

namespace App\Models;

use Database\Factories\StoreSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['store_name', 'whatsapp_number', 'email', 'phone', 'address', 'couriers', 'shipper_contact_name', 'shipper_contact_phone', 'shipper_contact_email', 'shipper_organization', 'origin_contact_name', 'origin_contact_phone', 'origin_contact_email', 'origin_address', 'origin_note', 'origin_postal_code', 'origin_area_id', 'origin_location_id', 'origin_latitude', 'origin_longitude'])]
class StoreSetting extends Model
{
    /** @use HasFactory<StoreSettingFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'origin_latitude' => 'decimal:7',
            'origin_longitude' => 'decimal:7',
        ];
    }
}
