<?php

namespace Tests\Feature\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\StoreSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_a_stock_safe_order_and_redirect_to_whatsapp(): void
    {
        StoreSetting::factory()->create(['whatsapp_number' => '0812-3456-7890']);
        $book = Book::factory()->create([
            'title' => 'Atomic Habits',
            'author' => 'James Clear',
            'isbn' => '9780735211292',
            'price' => 125000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $response = $this->withHeader('X-Inertia', 'true')->post(route('orders.store'), $this->payload($book, 3));

        $response->assertStatus(409)
            ->assertHeader('X-Inertia-Location');

        $order = Order::firstOrFail();
        $this->assertMatchesRegularExpression('/^BK-[A-Z0-9]{8}$/', $order->order_code);
        $this->assertSame('Atomic Habits', $order->book_title);
        $this->assertSame('James Clear', $order->book_author);
        $this->assertSame('9780735211292', $order->book_isbn);
        $this->assertSame('125000.00', $order->unit_price);
        $this->assertSame('375000.00', $order->subtotal);
        $this->assertSame('375000.00', $order->total);
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame(PaymentStatus::Unpaid, $order->payment_status);
        $this->assertSame(2, $book->fresh()->stock);
        $this->assertDatabaseHas('book_stock_movements', [
            'book_id' => $book->id,
            'order_id' => $order->id,
            'type' => StockMovementType::Order->value,
            'quantity' => -3,
            'stock_before' => 5,
            'stock_after' => 2,
            'changed_by' => null,
        ]);
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'status' => OrderStatus::Pending->value,
            'changed_by' => null,
        ]);
        $this->assertSame(1, BookStockMovement::count());
        $this->assertSame(1, OrderStatusHistory::count());

        $location = $response->headers->get('X-Inertia-Location');
        $this->assertStringStartsWith('https://wa.me/6281234567890?text=', $location);
        $this->assertStringContainsString($order->order_code, urldecode((string) parse_url((string) $location, PHP_URL_QUERY)));
    }

    public function test_customer_cannot_order_when_stock_is_insufficient_or_book_is_inactive(): void
    {
        StoreSetting::factory()->create();
        $book = Book::factory()->create(['stock' => 2]);

        $this->post(route('orders.store'), $this->payload($book, 3))
            ->assertSessionHasErrors('quantity');

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(2, $book->fresh()->stock);

        $book->update(['is_active' => false]);
        $this->post(route('orders.store'), $this->payload($book, 1))
            ->assertSessionHasErrors('book_id');

        $this->assertDatabaseCount('orders', 0);
    }

    /** @return array<string, mixed> */
    private function payload(Book $book, int $quantity): array
    {
        return [
            'book_id' => $book->id,
            'quantity' => $quantity,
            'customer_name' => 'Ian',
            'customer_phone' => '0812 1234 5678',
            'customer_email' => 'ian@example.com',
            'customer_address' => 'Jl. Buku Nomor 1, Jakarta',
            'customer_note' => 'Tolong dibungkus rapi.',
        ];
    }
}
