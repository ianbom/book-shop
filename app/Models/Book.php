<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['title', 'slug', 'isbn', 'author', 'description', 'price', 'stock', 'is_active'])]
class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'stock' => 0,
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<BookImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(BookImage::class);
    }

    /** @return BelongsToMany<Category, $this, BookCategory> */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'book_categories')
            ->using(BookCategory::class)
            ->withTimestamps();
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<BookStockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(BookStockMovement::class);
    }

    /** @param Builder<Book> $query */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        $query->when($search, fn (Builder $query, string $search) => $query->where(function (Builder $query) use ($search): void {
            $query->where('title', 'like', "%{$search}%")
                ->orWhere('author', 'like', "%{$search}%")
                ->orWhere('isbn', 'like', "%{$search}%");
        }));
    }

    /** @param Builder<Book> $query */
    public function scopeActive(Builder $query, ?bool $active = true): void
    {
        $query->when($active !== null, fn (Builder $query) => $query->where('is_active', $active));
    }
}
