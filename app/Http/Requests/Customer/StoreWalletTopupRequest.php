<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreWalletTopupRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'requested_amount' => ['required', 'integer', 'min:1', 'max:9999999999999'],
            'proof_image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
