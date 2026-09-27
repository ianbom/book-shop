<?php

namespace App\Http\Requests\Customer;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Customer;
    }

    public function rules(): array
    {
        return ['book_id' => ['required', 'integer', 'exists:books,id']];
    }
}
