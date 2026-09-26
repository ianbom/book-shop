<?php

namespace Tests\Feature\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DomainSchemaTest extends TestCase
{
    use RefreshDatabase;

    private const DOMAIN_TABLES = [
        'users', 'store_settings', 'user_addresses', 'categories', 'books',
        'book_images', 'book_categories', 'wallets', 'wallet_topups',
        'wallet_transactions', 'carts', 'cart_items', 'vouchers', 'orders',
        'order_items', 'order_shipping_addresses', 'voucher_usages',
        'order_status_histories', 'shipments', 'shipment_items',
        'shipment_status_histories', 'book_stock_movements',
    ];

    public function test_dbml_domain_tables_exist(): void
    {
        foreach (self::DOMAIN_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing table: {$table}");
        }

        foreach (['users', 'user_addresses', 'categories', 'books', 'vouchers'] as $table) {
            $this->assertTrue(Schema::hasColumn($table, 'deleted_at'), "Missing deleted_at: {$table}");
        }

        $this->assertFalse(Schema::hasColumn('book_categories', 'deleted_at'));
        $this->assertTrue(Schema::hasColumn('store_settings', 'store_name'));
        $this->assertFalse(Schema::hasTable('payment_proofs'));
    }

    public function test_every_domain_table_has_its_own_create_migration(): void
    {
        foreach (self::DOMAIN_TABLES as $table) {
            $this->assertCount(1, glob(database_path("migrations/*_create_{$table}_table.php")), $table);
        }
    }

    public function test_dbml_unique_keys_and_references_exist(): void
    {
        foreach ([
            'categories' => ['slug'],
            'books' => ['slug'],
            'book_categories' => ['book_id', 'category_id'],
            'wallets' => ['user_id'],
            'wallet_topups' => ['topup_code'],
            'carts' => ['user_id'],
            'cart_items' => ['cart_id', 'book_id'],
            'vouchers' => ['code'],
            'orders' => ['order_code'],
            'order_shipping_addresses' => ['order_id'],
            'voucher_usages' => ['order_id'],
            'shipments' => ['shipment_code'],
            'shipment_items' => ['shipment_id', 'order_item_id'],
        ] as $table => $columns) {
            $this->assertTrue(collect(Schema::getIndexes($table))
                ->contains(fn (array $index): bool => $index['unique'] && $index['columns'] === $columns), $table);
        }

        foreach (['wallet_transactions' => 'wallets', 'order_items' => 'orders', 'shipment_items' => 'shipments'] as $table => $parent) {
            $this->assertContains($parent, array_column(Schema::getForeignKeys($table), 'foreign_table'));
        }
    }

    public function test_required_foreign_keys_do_not_set_null_on_delete(): void
    {
        foreach (self::DOMAIN_TABLES as $table) {
            $columns = collect(Schema::getColumns($table))->keyBy('name');

            foreach (Schema::getForeignKeys($table) as $foreignKey) {
                foreach ($foreignKey['columns'] as $column) {
                    if (! $columns[$column]['nullable']) {
                        $this->assertNotSame('set null', strtolower($foreignKey['on_delete']), "{$table}.{$column}");
                    }
                }
            }
        }
    }
}
