<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer'],
            'courier_company' => ['required', 'string', 'max:100'],
            'courier_type' => ['required', 'string', 'max:100'],
            'shipping_cost' => ['required', 'numeric', 'min:0'],
            'voucher_id' => ['nullable', 'integer'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
