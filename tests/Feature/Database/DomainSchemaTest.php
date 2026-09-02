<?php

namespace Tests\Feature\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DomainSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_tables_and_soft_delete_columns_exist(): void
    {
        foreach ([
            'store_settings',
            'categories',
            'books',
            'book_images',
            'book_categories',
            'orders',
            'payment_proofs',
            'order_status_histories',
            'book_stock_movements',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing table: {$table}");
        }

        foreach ([
            'users',
            'store_settings',
            'categories',
            'books',
            'book_images',
            'orders',
            'payment_proofs',
            'order_status_histories',
            'book_stock_movements',
        ] as $table) {
            $this->assertTrue(Schema::hasColumn($table, 'deleted_at'), "Missing deleted_at: {$table}");
        }

        $this->assertFalse(Schema::hasColumn('book_categories', 'deleted_at'));
    }
}
