<?php

namespace App\Models;

use App\Enums\BookSaleType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['order_code', 'user_id', 'address_id', 'voucher_id', 'subtotal', 'voucher_discount', 'shipping_cost', 'total', 'wallet_amount', 'status', 'payment_status', 'customer_note', 'source', 'import_group_key', 'import_metadata', 'shipping_selected_at'])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $attributes = [
        'voucher_discount' => 0,
        'shipping_cost' => 0,
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'voucher_discount' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'total' => 'decimal:2',
            'wallet_amount' => 'decimal:2',
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'import_metadata' => 'array',
            'shipping_selected_at' => 'datetime',
        ];
    }

    /** @param Builder<Order> $query */
    public function scopeSearch(Builder $query, ?string $search): void
    {
        $query->when($search, fn (Builder $query, string $search) => $query->where(function (Builder $query) use ($search): void {
            $query->where('order_code', 'like', "%{$search}%")
                ->orWhereHas('user', fn (Builder $user) => $user->where('name', 'like', "%{$search}%"))
                ->orWhereHas('items', fn (Builder $items) => $items->where('name', 'like', "%{$search}%"));
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

    /** @param Builder<Order> $query */
    public function scopePreOrderCode(Builder $query, ?string $code): void
    {
        $query->when(filled($code), fn ($orders) => $orders->whereHas('items', fn ($items) => $items
            ->where('sale_type', BookSaleType::Preorder)
            ->where(fn ($match) => $match->where('pre_order_code', 'like', '%'.$code.'%')
                ->orWhere(fn ($legacy) => $legacy->whereNull('pre_order_code')
                    ->whereHas('order', fn ($order) => $order->where('source', 'website'))
                    ->whereIn('book_id', Book::withTrashed()->select('id')->whereHas('preOrderCode', fn ($codes) => $codes->where('code', 'like', '%'.$code.'%')))))));
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<UserAddress, $this> */
    public function address(): BelongsTo
    {
        return $this->belongsTo(UserAddress::class, 'address_id');
    }

    /** @return BelongsTo<Voucher, $this> */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasOne<OrderShippingAddress, $this> */
    public function shippingAddress(): HasOne
    {
        return $this->hasOne(OrderShippingAddress::class);
    }

    /** @return HasOne<VoucherUsage, $this> */
    public function voucherUsage(): HasOne
    {
        return $this->hasOne(VoucherUsage::class);
    }

    /** @return HasMany<WalletTransaction, $this> */
    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /** @return HasMany<OrderStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    /** @return HasMany<Shipment, $this> */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function isImported(): bool
    {
        return $this->source === 'imported';
    }

    public function isArchivedImport(): bool
    {
        return $this->isImported() && in_array($this->import_metadata['original_status'] ?? null, ['delivered', 'shipping', 'completed', 'cancelled'], true);
    }

    /** @return HasMany<OrderPaymentSubmission, $this> */
    public function paymentSubmissions(): HasMany
    {
        return $this->hasMany(OrderPaymentSubmission::class);
    }

    /** @return HasMany<BookStockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(BookStockMovement::class);
    }
}
