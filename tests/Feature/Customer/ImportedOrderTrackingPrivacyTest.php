<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('keeps imported settlement and account data out of public tracking', function () {
    Http::preventStrayRequests();
    $customer = User::factory()->create(['role' => 'customer', 'email' => 'private-tracking@example.com', 'must_change_password' => true]);
    $order = Order::factory()->create([
        'user_id' => $customer->id, 'source' => 'imported', 'order_code' => 'PRIVATE-IMPORT',
        'import_metadata' => ['original_status' => 'pending', 'address' => 'Private imported address'],
    ]);
    $order->items()->create([
        'name' => 'Historical book', 'sale_type' => 'preorder', 'quantity' => 1,
        'value' => '100.00', 'subtotal' => '100.00', 'weight' => 100,
        'historical_dp' => '30.00', 'historical_paid' => '20.00',
    ]);
    $order->paymentSubmissions()->create([
        'uploaded_by' => $customer->id, 'submission_key' => (string) Str::uuid(),
        'amount' => '80.00', 'proof_path' => 'order-payments/private-proof.png',
        'status' => 'rejected', 'pending_slot' => null, 'reason' => 'Private rejection explanation',
        'bank_account_snapshot' => ['bank_name' => 'Private bank', 'account_number' => '987654321', 'account_holder' => 'Private holder'],
        'billing_fingerprint' => str_repeat('a', 64),
    ]);

    $this->get('/track-order/PRIVATE-IMPORT')->assertOk()->assertInertia(function ($page) {
        $page->where('order.order_code', 'PRIVATE-IMPORT');
        $order = $page->toArray()['props']['order'];
        expect(array_keys($order))->toEqualCanonicalizing([
            'order_code', 'book_title', 'book_author', 'book_isbn', 'quantity', 'unit_price',
            'subtotal', 'shipping_cost', 'total', 'status', 'payment_status', 'status_histories', 'whatsapp_url',
        ]);
        $payload = json_encode($order, JSON_THROW_ON_ERROR);
        foreach (['private-tracking@example.com', 'Private imported address', 'private-proof', 'Private rejection explanation', '987654321', 'customer123'] as $private) {
            expect($payload)->not->toContain($private);
        }
    });
    Http::assertNothingSent();
});
