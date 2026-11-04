<?php

use App\Models\Order;
use App\Models\Shipment;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\Admin\OrderPaymentReviewService;
use App\Services\Customer\Dashboard\OrderCancellationService;
use App\Services\Customer\OrderSettlementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function settlementOrder(): array
{
    $user = User::factory()->create(['role' => 'customer']);
    $order = Order::factory()->create(['user_id' => $user->id, 'source' => 'imported', 'import_metadata' => ['original_status' => 'waiting_preorder'], 'status' => 'waiting_preorder', 'subtotal' => '155000.00', 'total' => '155000.00']);
    $order->items()->createMany([
        ['name' => 'Buku Pertama', 'category' => 'others', 'value' => '60000', 'quantity' => 2, 'weight' => 300, 'subtotal' => '110000', 'line_discount' => '10000', 'historical_dp' => '50000', 'historical_paid' => '80000', 'sale_type' => 'preorder', 'pre_order_code' => 'PO-01'],
        ['name' => 'Buku Kedua', 'category' => 'others', 'value' => '50000', 'quantity' => 1, 'weight' => 500, 'subtotal' => '45000', 'line_discount' => '5000', 'historical_dp' => '20000', 'historical_paid' => '10000', 'sale_type' => 'preorder', 'pre_order_code' => 'PO-02'],
    ]);
    $order->shippingAddress()->create(['destination_contact_name' => 'Customer', 'destination_contact_phone' => null, 'destination_address' => 'Alamat lama', 'destination_postal_code' => '01234']);
    $address = $user->addresses()->create(['label' => 'Rumah', 'destination_contact_name' => 'Customer', 'destination_contact_phone' => '+6281234567890', 'destination_contact_email' => 'customer@example.com', 'destination_address' => 'Alamat lengkap', 'destination_postal_code' => '01234', 'destination_area_id' => 'destination-area', 'subdistrict_name' => 'Desa', 'destination_latitude' => '-6.2', 'destination_longitude' => '106.8']);
    StoreSetting::factory()->create(['origin_area_id' => 'origin-area', 'bank_accounts' => [['bank_name' => 'Bank Contoh', 'account_number' => '001234', 'account_holder' => 'Toko']]]);
    config(['services.biteship.key' => 'test-key']);
    Http::preventStrayRequests();
    Http::fake(['api.biteship.com/v1/rates/couriers' => Http::response(['success' => true, 'pricing' => [['courier_code' => 'jne', 'courier_service_code' => 'REG', 'courier_service_name' => 'Regular', 'price' => 20000, 'duration' => '2-3 hari']]])]);
    Storage::fake('local');

    return [$order, $user, $address];
}

function settlementShipping($address): array
{
    return ['address_id' => $address->id, 'courier_company' => 'jne', 'courier_type' => 'REG', 'shipping_cost' => '20000.00'];
}

it('settles processing from no address snapshot using remaining books plus shipping', function () {
    [$order, $user, $address] = settlementOrder();
    $order->update(['status' => 'processing', 'import_metadata' => ['original_status' => 'processing']]);
    $order->shippingAddress()->delete();
    $service = app(OrderSettlementService::class);
    $service->selectShipping($order->fresh(), $user, settlementShipping($address));
    expect($order->fresh()->shippingAddress->source_address_id)->toBe($address->id)
        ->and($service->summary($order->fresh())['outstanding'])->toBe('85000.00');
    expect(fn () => $service->selectShipping($order->fresh(), $user, settlementShipping($address)))->toThrow(ValidationException::class);
    $submission = $service->submit($order->fresh(), $user, ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0], UploadedFile::fake()->image('proof.png'));
    app(OrderPaymentReviewService::class)->review($submission, User::factory()->create(['role' => 'admin']), ['status' => 'approved']);
    expect($order->fresh()->payment_status->value)->toBe('paid')
        ->and($service->summary($order->fresh())['outstanding'])->toBe('0.00');
});

it('rejects direct customer mutations of fully paid import archives', function (string $status) {
    [$order, $user, $address] = settlementOrder();
    $order->update(['status' => $status === 'delivered' ? 'shipping' : 'completed', 'payment_status' => 'paid', 'import_metadata' => ['original_status' => $status]]);
    foreach ($order->items as $item) {
        $item->update(['historical_paid' => $item->subtotal]);
    }
    $saved = $order->fresh()->getAttributes();
    $snapshot = $order->shippingAddress()->firstOrFail()->getAttributes();
    $service = app(OrderSettlementService::class);
    expect(fn () => $service->rates($order, $address))->toThrow(ValidationException::class);
    $this->withoutVite()->actingAs($user)->get('/customer/dashboard/orders/'.$order->id)->assertOk();
    $this->post('/customer/dashboard/orders/'.$order->id.'/settlement/shipping', settlementShipping($address))->assertSessionHasErrors('settlement');
    expect(fn () => $service->submit($order, $user, ['submission_key' => (string) Str::uuid(), 'amount' => '1.00', 'bank_account_index' => 0], UploadedFile::fake()->image('proof.png')))->toThrow(ValidationException::class);
    expect(fn () => app(OrderCancellationService::class)->cancel($order, $user))->toThrow(ValidationException::class);
    expect($order->fresh()->getAttributes())->toBe($saved)
        ->and($order->shippingAddress()->firstOrFail()->getAttributes())->toBe($snapshot)
        ->and(Storage::disk('local')->allFiles())->toBeEmpty();
    Http::assertNothingSent();
    $this->assertDatabaseCount('order_payment_submissions', 0);
    $this->assertDatabaseCount('shipments', 0);
})->with(['delivered', 'completed']);

it('derives LAWAS totals and snapshot rates without cart or master data', function () {
    [$order, , $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    expect($service->summary($order))->toMatchArray(['subtotal' => '155000.00', 'historical_dp' => '70000.00', 'historical_paid' => '90000.00', 'approved_paid' => '0.00', 'outstanding_books' => '65000.00', 'outstanding' => '65000.00', 'weight' => 1100, 'shipping_selected' => false]);
    expect($service->rates($order, $address)[0]['price'])->toBe('20000.00');
    Http::assertSent(fn ($request) => count($request['items']) === 2 && $request['items'][0]['name'] === 'Buku Pertama' && $request['items'][0]['quantity'] === 2 && $request['items'][0]['weight'] === 300 && ! array_key_exists('height', $request['items'][0]));
    expect(Order::count())->toBe(1);
    $this->assertDatabaseCount('shipments', 0);
});

it('selects verified shipping and submits the full balance privately exactly once', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    $service->selectShipping($order, $user, settlementShipping($address));
    expect($service->summary($order->fresh()))->toMatchArray(['shipping_cost' => '20000.00', 'outstanding' => '85000.00', 'shipping_selected' => true]);
    expect($order->fresh()->total)->toBe('175000.00')->and($order->shipments()->firstOrFail()->items()->sum('quantity'))->toBe(3);
    $proof = UploadedFile::fake()->image('proof.png');
    $data = ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0];
    $submission = $service->submit($order, $user, $data, $proof);
    expect($submission->amount)->toBe('85000.00')->and($submission->status)->toBe('pending')->and($submission->pending_slot)->toBe(1)->and($submission->bank_account_snapshot['account_number'])->toBe('001234');
    Storage::disk('local')->assertExists($submission->proof_path);
    expect($service->submit($order, $user, $data, $proof)->id)->toBe($submission->id);
    expect($order->fresh()->payment_status->value)->toBe('unpaid');
    $this->assertDatabaseCount('order_payment_submissions', 1);
    $this->assertDatabaseCount('wallet_transactions', 0);
    $this->assertDatabaseCount('book_stock_movements', 0);
    expect(Storage::disk('local')->allFiles())->toHaveCount(1);
});

it('completes LAWAS approval without changing PO readiness and allows rejected resubmission', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    $admin = User::factory()->create(['role' => 'admin']);
    $service->selectShipping($order, $user, settlementShipping($address));
    $first = $service->submit($order, $user, ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0], UploadedFile::fake()->image('first.png'));
    app(OrderPaymentReviewService::class)->review($first, $admin, ['status' => 'rejected', 'reason' => 'Bukti belum jelas.']);
    expect(fn () => $service->selectShipping($order->fresh(), $user, settlementShipping($address)))->toThrow(ValidationException::class);
    $second = $service->submit($order->fresh(), $user, ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0], UploadedFile::fake()->image('second.png'));
    app(OrderPaymentReviewService::class)->review($second, $admin, ['status' => 'approved']);
    expect($service->summary($order->fresh()))->toMatchArray(['historical_paid' => '90000.00', 'approved_paid' => '85000.00', 'total' => '175000.00', 'outstanding' => '0.00']);
    expect($order->fresh()->payment_status->value)->toBe('paid')->and($order->fresh()->status->value)->toBe('waiting_preorder');
    expect($order->items()->whereNotNull('preorder_ready_at')->exists())->toBeFalse();
    expect(Storage::disk('local')->allFiles())->toHaveCount(2);
    $this->assertDatabaseCount('wallet_transactions', 0);
    $this->assertDatabaseCount('book_stock_movements', 0);
});

it('locks the first shipping choice against direct changes', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    $service->selectShipping($order, $user, settlementShipping($address));
    $saved = $order->fresh()->getAttributes();
    $snapshot = $order->shippingAddress()->firstOrFail()->getAttributes();
    $shipment = $order->shipments()->firstOrFail();
    $other = $user->addresses()->create([...$address->only(['destination_contact_name', 'destination_contact_phone', 'destination_contact_email', 'destination_address', 'destination_postal_code', 'destination_area_id', 'subdistrict_name', 'destination_latitude', 'destination_longitude']), 'label' => 'Kantor']);
    $this->actingAs($user)->post('/customer/dashboard/orders/'.$order->id.'/settlement/shipping', [...settlementShipping($other), 'courier_type' => 'OTHER', 'shipping_cost' => '1.00'])->assertSessionHasErrors('settlement');
    expect(fn () => $service->rates($order, $address))->toThrow(ValidationException::class);
    expect($order->fresh()->getAttributes())->toBe($saved)->and($order->shippingAddress()->firstOrFail()->getAttributes())->toBe($snapshot);
    expect($order->shipments()->count())->toBe(1)->and($shipment->statusHistories()->count())->toBe(1);
});

it('rolls back the shipping claim when a later write fails', function () {
    [$order, $user, $address] = settlementOrder();
    $snapshot = $order->shippingAddress()->firstOrFail()->getAttributes();
    Shipment::creating(fn () => throw new RuntimeException('test rollback'));
    try {
        expect(fn () => app(OrderSettlementService::class)->selectShipping($order, $user, settlementShipping($address)))->toThrow(RuntimeException::class);
    } finally {
        Shipment::flushEventListeners();
    }
    expect($order->fresh()->shipping_selected_at)->toBeNull()->and($order->shippingAddress()->firstOrFail()->getAttributes())->toBe($snapshot);
    $this->assertDatabaseCount('shipments', 0);
});

it('keeps shipping locked when the saved rate changes before payment', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    $service->selectShipping($order, $user, settlementShipping($address));
    Http::swap(new Factory);
    Http::preventStrayRequests();
    Http::fake(['api.biteship.com/v1/rates/couriers' => Http::response(['success' => true, 'pricing' => [['courier_code' => 'jne', 'courier_service_code' => 'REG', 'price' => 25000]]])]);
    try {
        $service->submit($order, $user, ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0], UploadedFile::fake()->image('proof.png'));
        $this->fail('Tarif berubah seharusnya ditolak.');
    } catch (ValidationException $exception) {
        expect($exception->errors()['settlement'][0])->toContain('Hubungi admin');
    }
    expect($order->fresh()->shipping_selected_at)->not->toBeNull();
    $this->assertDatabaseCount('order_payment_submissions', 0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
});

it('rejects invalid snapshot dimensions before requesting rates', function () {
    [$order, , $address] = settlementOrder();
    $order->items()->firstOrFail()->update(['height' => '-1']);
    expect(fn () => app(OrderSettlementService::class)->rates($order, $address))->toThrow(ValidationException::class);
    Http::assertNothingSent();
});

it('locks shipping while pending and rejects partial amounts or reused keys with changed proof', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    $service->selectShipping($order, $user, settlementShipping($address));
    $data = ['submission_key' => (string) Str::uuid(), 'amount' => '84000.00', 'bank_account_index' => 0];
    expect(fn () => $service->submit($order, $user, $data, UploadedFile::fake()->image('proof.png')))->toThrow(ValidationException::class);
    $data['amount'] = '85000.00';
    $service->submit($order, $user, $data, UploadedFile::fake()->image('proof.png'));
    expect(fn () => $service->selectShipping($order, $user, settlementShipping($address)))->toThrow(ValidationException::class);
    expect(fn () => $service->submit($order, $user, $data, UploadedFile::fake()->image('changed.png', 20, 20)))->toThrow(ValidationException::class);
    expect(Storage::disk('local')->allFiles())->toHaveCount(1);
});

it('rejects foreign owners archived imports and forged shipping prices', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    expect(fn () => $service->selectShipping($order, User::factory()->create(), settlementShipping($address)))->toThrow(HttpException::class);
    expect(fn () => $service->selectShipping($order, $user, [...settlementShipping($address), 'shipping_cost' => '1']))->toThrow(ValidationException::class);
    $order->update(['import_metadata' => ['original_status' => 'shipping']]);
    expect(fn () => $service->rates($order->fresh(), $address))->toThrow(ValidationException::class);
    $this->assertDatabaseCount('shipments', 0);
});

it('exposes private settlement totals and history without storage paths', function () {
    [$order, $user, $address] = settlementOrder();
    $service = app(OrderSettlementService::class);
    $service->selectShipping($order, $user, settlementShipping($address));
    $submission = $service->submit($order, $user, ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0], UploadedFile::fake()->image('proof.png'));
    $this->actingAs($user)->get('/customer/dashboard/orders/'.$order->id)->assertOk()->assertInertia(fn ($page) => $page
        ->where('order.source', 'imported')->where('order.settlement.summary.outstanding', '85000.00')
        ->where('order.settlement.locked', true)->where('order.settlement.submissions.0.id', $submission->id)
        ->missing('order.settlement.submissions.0.proof_path')->missing('order.import_metadata')
        ->has('settlement_addresses', 1)->has('settlement_banks', 1));
});

it('exposes settlement endpoints only to the order owner', function () {
    [$order, $user, $address] = settlementOrder();
    $base = '/customer/dashboard/orders/'.$order->id.'/settlement';
    $this->actingAs(User::factory()->create(['role' => 'customer']))->getJson($base.'/rates?address_id='.$address->id)->assertNotFound();
    Http::assertNothingSent();
    $this->actingAs($user)->getJson($base.'/rates?address_id='.$address->id)->assertOk()->assertJsonPath('rates.0.price', '20000.00');
    $this->post($base.'/shipping', settlementShipping($address))->assertRedirect();
    $this->post($base.'/submissions', ['submission_key' => (string) Str::uuid(), 'amount' => '85000.00', 'bank_account_index' => 0, 'proof' => UploadedFile::fake()->image('proof.png')])->assertRedirect();
    expect($order->paymentSubmissions()->count())->toBe(1);
});

it('revalidates item and address changes made during the provider request', function () {
    [$order, $user, $address] = settlementOrder();
    Http::fake(function () use ($order) {
        $order->items()->firstOrFail()->update(['weight' => 900]);

        return Http::response(['success' => true, 'pricing' => [['courier_code' => 'jne', 'courier_service_code' => 'REG', 'price' => 20000]]]);
    });
    expect(fn () => app(OrderSettlementService::class)->selectShipping($order, $user, settlementShipping($address)))->toThrow(ValidationException::class);
    $this->assertDatabaseCount('shipments', 0);
    expect($order->fresh()->shipping_selected_at)->toBeNull();
});
