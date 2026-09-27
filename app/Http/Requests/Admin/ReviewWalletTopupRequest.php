<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewWalletTopupRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'credited_amount' => ['required_if:status,approved', 'prohibited_if:status,rejected', 'integer', 'min:1', 'max:9999999999999'],
            'admin_note' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
        ];
    }
}
