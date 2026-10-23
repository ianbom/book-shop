<?php

namespace Tests\Feature\Customer;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_order_endpoint_is_unavailable_to_guests_and_customers(): void
    {
        $book = Book::factory()->create(['stock' => 5]);
        $customer = User::factory()->create();
        $wallet = $customer->wallet()->create(['balance' => 500000]);
        $payload = [
            'book_id' => $book->id, 'quantity' => 1, 'customer_name' => 'Customer',
            'customer_phone' => '081234567890', 'customer_address' => 'Jalan Buku 1',
        ];

        $this->post('/orders', $payload)->assertNotFound();
        $this->actingAs($customer)->post('/orders', $payload)->assertNotFound();

        $this->assertSame(5, $book->fresh()->stock);
        $this->assertSame('500000.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('book_stock_movements', 0);
    }
}
