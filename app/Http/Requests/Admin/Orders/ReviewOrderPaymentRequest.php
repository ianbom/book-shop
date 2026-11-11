<?php

namespace App\Http\Requests\Admin\Orders;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;

class ReviewOrderPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->value === 'admin';
    }

    /** @return array<string, list<string|In>> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:2000'],
        ];
    }
}
