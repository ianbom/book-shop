<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'store_name' => $this->store_name,
            'whatsapp_number' => $this->whatsapp_number,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'couriers' => $this->couriers,
            'shipper_contact_name' => $this->shipper_contact_name,
            'shipper_contact_phone' => $this->shipper_contact_phone,
            'shipper_contact_email' => $this->shipper_contact_email,
            'shipper_organization' => $this->shipper_organization,
            'origin_contact_name' => $this->origin_contact_name,
            'origin_contact_phone' => $this->origin_contact_phone,
            'origin_contact_email' => $this->origin_contact_email,
            'origin_address' => $this->origin_address,
            'origin_note' => $this->origin_note,
            'origin_postal_code' => $this->origin_postal_code,
            'origin_area_id' => $this->origin_area_id,
            'origin_location_id' => $this->origin_location_id,
            'origin_latitude' => $this->origin_latitude,
            'origin_longitude' => $this->origin_longitude,
        ];
    }
}
