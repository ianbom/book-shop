<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class SaveAddressRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:100'],
            'destination_contact_name' => ['required', 'string', 'max:150'],
            'destination_contact_phone' => ['required', 'string', 'max:30'],
            'destination_contact_email' => ['required', 'email', 'max:150'],
            'destination_postal_code' => ['required', 'regex:/^[0-9]{5}$/'],
            'destination_area_id' => ['required', 'string', 'max:150'],
            'subdistrict_name' => ['required', 'string', 'max:150'],
            'destination_address' => ['required', 'string', 'max:2000'],
            'destination_note' => ['nullable', 'string', 'max:1000'],
            'destination_latitude' => ['required', 'numeric', 'between:-90,90'],
            'destination_longitude' => ['required', 'numeric', 'between:-180,180'],
        ];
    }
}
