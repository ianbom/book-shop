<?php

namespace App\Http\Requests\Settings;

use Illuminate\Validation\Rule;

class RequiredPasswordUpdateRequest extends PasswordUpdateRequest
{
    public function authorize(): bool
    {
        return $this->user()?->must_change_password === true;
    }

    public function rules(): array
    {
        $rules = parent::rules();
        $rules['password'] = [...$this->passwordRules(), 'different:current_password', Rule::notIn(['customer123'])];

        return $rules;
    }
}
