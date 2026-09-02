<?php

namespace App\Http\Requests\Admin\Books;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('books', 'slug')],
            'isbn' => ['nullable', 'string', 'max:50'],
            'author' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'initial_stock' => ['required', 'integer', 'min:0'],
            'category_ids' => ['array'],
            'category_ids.*' => ['integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'is_active' => ['required', 'boolean'],
            'images' => ['array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'image_alt_texts' => ['array'],
            'image_alt_texts.*' => ['nullable', 'string', 'max:255'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
