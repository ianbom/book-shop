<?php

namespace App\Http\Requests\Admin\Books;

use App\Enums\BookSaleType;
use App\Models\Book;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookRequest extends FormRequest
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
        $codeExists = Rule::exists('pre_order_codes', 'id');
        $book = $this->route('book');
        if (! $book instanceof Book || (int) $this->input('pre_order_code_id') !== $book->pre_order_code_id) {
            $codeExists->whereNull('deleted_at');
        }

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('books', 'slug')->ignore($this->route('book'))],
            'isbn' => ['nullable', 'string', 'max:50'],
            'sku' => ['nullable', 'string', 'max:100'],
            'author' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999999.99', 'decimal:0,2'],
            'weight' => ['required', 'integer', 'min:1', 'max:2147483647'],
            'height' => ['nullable', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'length' => ['nullable', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'width' => ['nullable', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'sale_type' => ['required', Rule::enum(BookSaleType::class)],
            'pre_order_code_id' => ['required_if:sale_type,preorder', 'prohibited_unless:sale_type,preorder', 'nullable', 'integer', $codeExists],
            'preorder_estimated_date' => ['required_if:sale_type,preorder', 'nullable', 'date'],
            'preorder_note' => ['nullable', 'string'],
            'category_ids' => ['array'],
            'category_ids.*' => ['integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
