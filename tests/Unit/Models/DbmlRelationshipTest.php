<?php

namespace Tests\Unit\Models;

use App\Models;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Tests\TestCase;

class DbmlRelationshipTest extends TestCase
{
    public function test_all_dbml_relationships_use_the_expected_type_and_foreign_key(): void
    {
        foreach ([
            Models\User::class => [
                'addresses' => [HasMany::class, 'user_id'],
                'wallet' => [HasOne::class, 'user_id'],
                'walletTopups' => [HasMany::class, 'user_id'],
                'reviewedWalletTopups' => [HasMany::class, 'reviewed_by'],
                'createdWalletTransactions' => [HasMany::class, 'created_by'],
                'cart' => [HasOne::class, 'user_id'],
                'createdVouchers' => [HasMany::class, 'created_by'],
                'orders' => [HasMany::class, 'user_id'],
                'voucherUsages' => [HasMany::class, 'user_id'],
                'orderStatusHistories' => [HasMany::class, 'changed_by'],
                'bookStockMovements' => [HasMany::class, 'changed_by'],
            ],
            Models\Book::class => [
                'images' => [HasMany::class, 'book_id'],
                'categories' => [BelongsToMany::class, 'book_id'],
                'orderItems' => [HasMany::class, 'book_id'],
                'cartItems' => [HasMany::class, 'book_id'],
                'stockMovements' => [HasMany::class, 'book_id'],
            ],
            Models\Category::class => [
                'books' => [BelongsToMany::class, 'category_id'],
            ],
            Models\BookImage::class => [
                'book' => [BelongsTo::class, 'book_id'],
            ],
            Models\BookCategory::class => [
                'book' => [BelongsTo::class, 'book_id'],
                'category' => [BelongsTo::class, 'category_id'],
            ],
            Models\UserAddress::class => [
                'user' => [BelongsTo::class, 'user_id'],
                'orders' => [HasMany::class, 'address_id'],
                'shippingAddressSnapshots' => [HasMany::class, 'source_address_id'],
            ],
            Models\Wallet::class => [
                'user' => [BelongsTo::class, 'user_id'],
                'transactions' => [HasMany::class, 'wallet_id'],
            ],
            Models\WalletTopup::class => [
                'user' => [BelongsTo::class, 'user_id'],
                'reviewer' => [BelongsTo::class, 'reviewed_by'],
                'transactions' => [HasMany::class, 'topup_id'],
            ],
            Models\WalletTransaction::class => [
                'wallet' => [BelongsTo::class, 'wallet_id'],
                'topup' => [BelongsTo::class, 'topup_id'],
                'order' => [BelongsTo::class, 'order_id'],
                'creator' => [BelongsTo::class, 'created_by'],
            ],
            Models\Cart::class => [
                'user' => [BelongsTo::class, 'user_id'],
                'items' => [HasMany::class, 'cart_id'],
            ],
            Models\CartItem::class => [
                'cart' => [BelongsTo::class, 'cart_id'],
                'book' => [BelongsTo::class, 'book_id'],
            ],
            Models\Voucher::class => [
                'creator' => [BelongsTo::class, 'created_by'],
                'orders' => [HasMany::class, 'voucher_id'],
                'usages' => [HasMany::class, 'voucher_id'],
            ],
            Models\Order::class => [
                'user' => [BelongsTo::class, 'user_id'],
                'address' => [BelongsTo::class, 'address_id'],
                'voucher' => [BelongsTo::class, 'voucher_id'],
                'items' => [HasMany::class, 'order_id'],
                'shippingAddress' => [HasOne::class, 'order_id'],
                'voucherUsage' => [HasOne::class, 'order_id'],
                'walletTransactions' => [HasMany::class, 'order_id'],
                'statusHistories' => [HasMany::class, 'order_id'],
                'shipments' => [HasMany::class, 'order_id'],
                'stockMovements' => [HasMany::class, 'order_id'],
            ],
            Models\OrderItem::class => [
                'order' => [BelongsTo::class, 'order_id'],
                'book' => [BelongsTo::class, 'book_id'],
                'shipmentItems' => [HasMany::class, 'order_item_id'],
                'stockMovements' => [HasMany::class, 'order_item_id'],
            ],
            Models\OrderShippingAddress::class => [
                'order' => [BelongsTo::class, 'order_id'],
                'sourceAddress' => [BelongsTo::class, 'source_address_id'],
            ],
            Models\VoucherUsage::class => [
                'voucher' => [BelongsTo::class, 'voucher_id'],
                'user' => [BelongsTo::class, 'user_id'],
                'order' => [BelongsTo::class, 'order_id'],
            ],
            Models\OrderStatusHistory::class => [
                'order' => [BelongsTo::class, 'order_id'],
                'changedBy' => [BelongsTo::class, 'changed_by'],
            ],
            Models\Shipment::class => [
                'order' => [BelongsTo::class, 'order_id'],
                'items' => [HasMany::class, 'shipment_id'],
                'statusHistories' => [HasMany::class, 'shipment_id'],
            ],
            Models\ShipmentItem::class => [
                'shipment' => [BelongsTo::class, 'shipment_id'],
                'orderItem' => [BelongsTo::class, 'order_item_id'],
            ],
            Models\ShipmentStatusHistory::class => [
                'shipment' => [BelongsTo::class, 'shipment_id'],
            ],
            Models\BookStockMovement::class => [
                'book' => [BelongsTo::class, 'book_id'],
                'order' => [BelongsTo::class, 'order_id'],
                'orderItem' => [BelongsTo::class, 'order_item_id'],
                'changedBy' => [BelongsTo::class, 'changed_by'],
            ],
        ] as $modelClass => $methods) {
            $model = new $modelClass;

            foreach ($methods as $method => [$relationType, $foreignKey]) {
                $relation = $model->{$method}();
                $this->assertInstanceOf($relationType, $relation, "{$modelClass}::{$method}");
                if (! $relation instanceof BelongsToMany) {
                    $this->assertSame($foreignKey, $relation->getForeignKeyName(), "{$modelClass}::{$method}");
                }
            }
        }
    }

    public function test_book_category_pivot_uses_its_own_incrementing_key(): void
    {
        $pivot = new Models\BookCategory;

        $this->assertTrue($pivot->getIncrementing());
        $this->assertTrue($pivot->usesTimestamps());
        $this->assertSame('book_categories', $pivot->getTable());
    }
}
