<?php

namespace App\Models;

use App\Enums\BookSaleType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['order_id', 'book_id', 'name', 'description', 'category', 'sku', 'value', 'quantity', 'weight', 'height', 'length', 'width', 'isbn', 'author', 'subtotal', 'sale_type', 'preorder_estimated_date', 'preorder_ready_at'])]
class OrderItem extends Model
{
    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'quantity' => 'integer',
            'weight' => 'integer',
            'height' => 'decimal:2',
            'length' => 'decimal:2',
            'width' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'sale_type' => BookSaleType::class,
            'preorder_estimated_date' => 'date',
            'preorder_ready_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Book, $this> */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /** @return HasMany<ShipmentItem, $this> */
    public function shipmentItems(): HasMany
    {
        return $this->hasMany(ShipmentItem::class);
    }

    /** @return HasMany<BookStockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(BookStockMovement::class);
    }
}
