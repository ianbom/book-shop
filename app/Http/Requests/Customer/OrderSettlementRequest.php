<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class OrderSettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'customer';
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        if ($this->routeIs('*.settlement.submissions')) {
            return [
                'submission_key' => ['required', 'uuid'],
                'amount' => ['required', 'string'],
                'bank_account_index' => ['required', 'integer', 'min:0'],
                'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'extensions:jpg,jpeg,png,pdf', 'max:5120'],
            ];
        }

        return [
            'address_id' => ['required', 'integer'],
            ...($this->routeIs('*.settlement.shipping') ? [
                'courier_company' => ['required', 'string', 'max:100'],
                'courier_type' => ['required', 'string', 'max:100'],
                'shipping_cost' => ['required', 'string'],
            ] : []),
        ];
    }
}
