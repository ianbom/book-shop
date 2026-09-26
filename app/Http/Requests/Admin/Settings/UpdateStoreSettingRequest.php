<?php

namespace App\Http\Requests\Admin\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStoreSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'store_name' => ['required', 'string', 'max:150'],
            'whatsapp_number' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s]+$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s]+$/'],
            'address' => ['nullable', 'string', 'max:5000'],
            'couriers' => ['required', 'string', 'max:5000', 'regex:/^[a-zA-Z0-9_-]+(?:\s*,\s*[a-zA-Z0-9_-]+)*$/'],
            'shipper_contact_name' => ['nullable', 'string', 'max:150'],
            'shipper_contact_phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s]+$/'],
            'shipper_contact_email' => ['nullable', 'email', 'max:150'],
            'shipper_organization' => ['nullable', 'string', 'max:150'],
            'origin_contact_name' => ['required', 'string', 'max:150'],
            'origin_contact_phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]+$/'],
            'origin_contact_email' => ['nullable', 'email', 'max:150'],
            'origin_address' => ['required', 'string', 'max:5000'],
            'origin_note' => ['nullable', 'string', 'max:5000'],
            'origin_postal_code' => ['nullable', 'string', 'max:10'],
            'origin_area_id' => ['nullable', 'string', 'max:150'],
            'origin_location_id' => ['nullable', 'string', 'max:150'],
            'origin_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'origin_longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasLatitude = $this->filled('origin_latitude');
            $hasLongitude = $this->filled('origin_longitude');

            if ($hasLatitude !== $hasLongitude) {
                $validator->errors()->add(
                    $hasLatitude ? 'origin_longitude' : 'origin_latitude',
                    'Koordinat lintang dan bujur harus diisi berpasangan.',
                );
            }

            if (! $this->filled('origin_postal_code')
                && ! $this->filled('origin_area_id')
                && ! ($hasLatitude && $hasLongitude)) {
                $validator->errors()->add(
                    'origin_postal_code',
                    'Isi kode pos, ID area, atau koordinat lintang dan bujur.',
                );
            }
        });
    }
}
