<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\PreOrderCode;
use App\Models\User;
use App\Services\Customer\Dashboard\OrderListService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('filters PO snapshots independently of changed master data and disables imported cancellation', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $admin = User::factory()->create(['role' => 'admin']);
    $code = PreOrderCode::query()->create(['code' => 'MASTER-NEW']);
    $book = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
    $imported = Order::factory()->create(['user_id' => $customer->id, 'source' => 'imported', 'import_metadata' => ['original_status' => 'pending']]);
    $imported->items()->create(['book_id' => $book->id, 'name' => 'Snapshot', 'sale_type' => 'preorder', 'pre_order_code' => 'SNAPSHOT-OLD', 'quantity' => 1, 'value' => '100', 'subtotal' => '100', 'weight' => 100]);
    $legacy = Order::factory()->create(['user_id' => $customer->id]);
    $legacy->items()->create(['book_id' => $book->id, 'name' => 'Website', 'sale_type' => 'preorder', 'quantity' => 1, 'value' => '100', 'subtotal' => '100', 'weight' => 100]);
    $service = app(OrderListService::class);
    $snapshot = $service->paginate($customer, ['pre_order_code' => 'SNAPSHOT-OLD']);
    expect($snapshot['total'])->toBe(1)->and($snapshot['data'][0]['id'])->toBe($imported->id)->and($snapshot['data'][0]['can_cancel'])->toBeFalse()->and($snapshot['data'][0]['source'])->toBe('imported');
    $master = $service->paginate($customer, ['pre_order_code' => 'MASTER-NEW']);
    expect($master['total'])->toBe(1)->and($master['data'][0]['id'])->toBe($legacy->id);
    $this->actingAs($admin)->get('/admin/orders?pre_order_code=SNAPSHOT-OLD')->assertOk()->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $imported->id));
    $this->get('/admin/orders?pre_order_code=MASTER-NEW')->assertOk()->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $legacy->id));
    $this->get('/admin/orders?source=website')->assertOk()->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $legacy->id)->where('filters.source', 'website'));
    $this->get('/admin/orders?source=imported')->assertOk()->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $imported->id));
    $this->get('/admin/orders?source=invalid')->assertSessionHasErrors('source');
});
