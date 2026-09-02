<?php

namespace App\Services\Admin;

use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategoryService
{
    public function delete(Category $category): void
    {
        DB::transaction(function () use ($category): void {
            $category->books()->detach();
            $category->delete();
        });
    }
}
