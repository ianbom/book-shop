<?php

namespace App\Http\Requests\Admin\PreOrderCodes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePreOrderCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('code'))) {
            $this->merge(['code' => trim($this->input('code'))]);
        }
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:100', Rule::unique('pre_order_codes', 'code')->ignore($this->route('preOrderCode'))],
        ];
    }
}
