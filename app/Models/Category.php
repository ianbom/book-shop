<?php

namespace App\Models;

use App\Support\BookReferenceName;
use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'slug'])]
class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::saving(function (Category $category): void {
            $category->name = BookReferenceName::display($category->name);
            $category->setAttribute('normalized_key', BookReferenceName::key($category->name));
        });
    }

    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
        ];
    }

    /** @return BelongsToMany<Book, $this, BookCategory> */
    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_categories')->using(BookCategory::class)->withTimestamps();
    }
}
