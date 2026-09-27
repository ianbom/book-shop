<?php

namespace App\Http\Requests\Admin\Vouchers;

use App\Enums\VoucherType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('vouchers', 'code')->ignore($this->route('voucher'))],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::enum(VoucherType::class)],
            'value' => ['required', 'numeric', 'gt:0', 'decimal:0,2', ...($this->input('type') === 'percentage' ? ['lte:100'] : [])],
            'max_discount' => ['nullable', 'numeric', 'gt:0', 'decimal:0,2'],
            'min_order_amount' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['required', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', ...($this->filled('starts_at') ? ['after_or_equal:starts_at'] : [])],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
