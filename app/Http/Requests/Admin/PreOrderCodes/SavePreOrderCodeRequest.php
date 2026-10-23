<?php

namespace App\Http\Requests\Admin\PreOrderCodes;

use App\Models\PreOrderCode;
use App\Support\BookReferenceName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SavePreOrderCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! is_string($this->input('code'))) {
                return;
            }
            $key = BookReferenceName::key($this->input('code'));
            $code = $this->route('preOrderCode');
            $id = $code instanceof PreOrderCode ? $code->getKey() : $code;
            if ($key === '' || mb_strlen($key) > 150 || PreOrderCode::withTrashed()->where('normalized_key', $key)
                ->when($id, fn ($query, $id) => $query->whereKeyNot($id))->exists()) {
                $validator->errors()->add('code', 'Kode preorder sudah digunakan (termasuk variasi kapital, spasi, dan pemisah) atau tidak valid.');
            }
        }];
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
