<?php

namespace App\Models;

use App\Enums\BookSaleType;
use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property BookSaleType $sale_type
 * @property Carbon|null $preorder_estimated_date
 */
#[Fillable(['title', 'slug', 'isbn', 'sku', 'author', 'description', 'price', 'shipping_category', 'weight', 'height', 'length', 'width', 'stock', 'sale_type', 'preorder_estimated_date', 'preorder_note', 'is_active'])]
class Book extends Model
{
    /** @use HasFactory<BookFactory> */
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'shipping_category' => 'others',
        'stock' => 0,
        'sale_type' => 'ready_stock',
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'weight' => 'integer',
            'height' => 'decimal:2',
            'length' => 'decimal:2',
            'width' => 'decimal:2',
            'stock' => 'integer',
            'sale_type' => BookSaleType::class,
            'preorder_estimated_date' => 'date',
            'is_active' => 'boolean',
            'deleted_at' => 'datetime',
        ];
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

    /**
     * @param  Builder<Book>  $query
     * @param  array<string>|string|null  $slug
     */
    public function scopeInCategory(Builder $query, array|string|null $slug): void
    {
        $slugs = is_array($slug) ? array_values(array_filter($slug)) : ($slug !== null && $slug !== '' ? array_values(array_filter(explode(',', $slug))) : []);
        $query->when($slugs !== [], fn (Builder $query) => $query->whereHas('categories', fn (Builder $query) => $query->whereIn('slug', $slugs)));
    }

    /** @return HasMany<BookImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(BookImage::class);
    }

    /** @return BelongsToMany<Category, $this, BookCategory> */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'book_categories')->using(BookCategory::class)->withTimestamps();
    }

    /** @return HasMany<OrderItem, $this> */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasMany<CartItem, $this> */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /** @return HasMany<BookStockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(BookStockMovement::class);
    }
}
