<?php

namespace App\Http\Requests\Admin\Categories;

use App\Models\Category;
use App\Support\BookReferenceName;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! is_string($this->input('name'))) {
                return;
            }
            $key = BookReferenceName::key($this->input('name'));
            $category = $this->route('category');
            $id = $category instanceof Category ? $category->getKey() : $category;
            if ($key === '' || mb_strlen($key) > 150 || Category::withTrashed()->where('normalized_key', $key)
                ->when($id, fn ($query, $id) => $query->whereKeyNot($id))->exists()) {
                $validator->errors()->add('name', 'Nama kategori sudah digunakan (termasuk variasi kapital, spasi, dan pemisah) atau tidak valid.');
            }
        }];
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:180', Rule::unique('categories', 'slug')],
        ];
    }
}
