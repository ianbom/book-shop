<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'slug'])]
class Category extends Model
{
    use HasFactory, SoftDeletes;

    /** @return BelongsToMany<Book, $this, BookCategory> */
    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_categories')
            ->using(BookCategory::class)
            ->withTimestamps();
    }
}
