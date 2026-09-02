<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['order_code', 'customer_name', 'customer_phone', 'customer_email', 'customer_address', 'customer_note', 'book_id', 'book_title', 'book_isbn', 'book_author', 'unit_price', 'quantity', 'subtotal', 'shipping_cost', 'total', 'status', 'payment_status'])]
class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'shipping_cost' => 0,
        'status' => OrderStatus::Pending->value,
        'payment_status' => PaymentStatus::Unpaid->value,
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'quantity' => 'integer',
            'subtotal' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'total' => 'decimal:2',
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
        ];
    }

    /** @return BelongsTo<Book, $this> */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /** @return HasMany<PaymentProof, $this> */
    public function paymentProofs(): HasMany
    {
        return $this->hasMany(PaymentProof::class);
    }

    /** @return HasMany<OrderStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    /** @return HasMany<BookStockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(BookStockMovement::class);
    }

    /** @param Builder<Order> $query */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        $query->when($search, fn (Builder $query, string $search) => $query->where(function (Builder $query) use ($search): void {
            $query->where('order_code', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%")
                ->orWhere('customer_phone', 'like', "%{$search}%")
                ->orWhere('customer_email', 'like', "%{$search}%")
                ->orWhere('book_title', 'like', "%{$search}%");
        }));
    }

    /** @param Builder<Order> $query */
    public function scopeStatus(Builder $query, ?OrderStatus $status): void
    {
        $query->when($status, fn (Builder $query, OrderStatus $status) => $query->where('status', $status));
    }

    /** @param Builder<Order> $query */
    public function scopePaymentStatus(Builder $query, ?PaymentStatus $status): void
    {
        $query->when($status, fn (Builder $query, PaymentStatus $status) => $query->where('payment_status', $status));
    }
}
