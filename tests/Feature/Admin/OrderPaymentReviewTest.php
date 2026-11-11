<?php

use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\Admin\BiteshipBookingService;
use App\Services\Admin\BiteshipShipmentService;
use App\Services\Admin\OrderPaymentReviewService;
use App\Services\Admin\OrderStatusService;
use App\Services\Admin\ShipmentStatusService;
use App\Services\Customer\Dashboard\OrderCancellationService;
use App\Services\Customer\OrderSettlementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function reviewSubmission(): array
{
    $user = User::factory()->create(['role' => 'customer']);
    $admin = User::factory()->create(['role' => 'admin']);
    $order = Order::factory()->create(['user_id' => $user->id, 'source' => 'imported', 'import_metadata' => ['original_status' => 'pending'], 'subtotal' => '110000', 'shipping_cost' => '20000', 'total' => '130000', 'shipping_selected_at' => now()]);
    $order->items()->create(['name' => 'Buku', 'sale_type' => 'preorder', 'value' => '60000', 'quantity' => 2, 'weight' => 300, 'subtotal' => '110000', 'line_discount' => '10000', 'historical_paid' => '80000', 'historical_dp' => '50000']);
    $order->shippingAddress()->create(['destination_contact_name' => 'Customer', 'destination_contact_phone' => '+6281234567890', 'destination_address' => 'Alamat', 'destination_postal_code' => '01234']);
    $order->shipments()->create(['shipment_code' => 'SHP-REVIEW', 'courier_company' => 'jne', 'courier_type' => 'REG', 'price' => '20000']);
    $submission = $order->paymentSubmissions()->create(['uploaded_by' => $user->id, 'submission_key' => (string) Str::uuid(), 'amount' => '50000', 'proof_path' => 'order-payments/example.png', 'status' => 'pending', 'pending_slot' => 1, 'bank_account_snapshot' => ['bank_name' => 'Bank', 'account_number' => '001234', 'account_holder' => 'Toko'], 'billing_fingerprint' => app(OrderSettlementService::class)->fingerprint($order->fresh())]);
    Http::preventStrayRequests();

    return [$submission, $admin, $order, $user];
}

it('approves the locked balance once without provider wallet stock or readiness mutations', function () {
    [$submission, $admin, $order] = reviewSubmission();
    $service = app(OrderPaymentReviewService::class);
    $service->review($submission, $admin, ['status' => 'approved']);
    $service->review($submission, $admin, ['status' => 'approved']);
    expect($submission->fresh()->status)->toBe('approved')->and($submission->fresh()->pending_slot)->toBeNull()
        ->and($submission->fresh()->reviewed_by)->toBe($admin->id)->and($order->fresh()->payment_status->value)->toBe('paid')
        ->and($order->fresh()->status->value)->toBe('pending')->and(app(OrderSettlementService::class)->summary($order->fresh())['outstanding'])->toBe('0.00');
    expect(fn () => $service->review($submission, $admin, ['status' => 'rejected', 'reason' => 'Changed']))->toThrow(ValidationException::class);
    $this->assertDatabaseCount('wallet_transactions', 0);
    $this->assertDatabaseCount('book_stock_movements', 0);
    $this->assertDatabaseCount('order_status_histories', 1);
    Http::assertNothingSent();
});

it('requires a rejection reason and preserves rejected history', function () {
    [$submission, $admin, $order] = reviewSubmission();
    $service = app(OrderPaymentReviewService::class);
    expect(fn () => $service->review($submission, $admin, ['status' => 'rejected']))->toThrow(ValidationException::class);
    $service->review($submission, $admin, ['status' => 'rejected', 'reason' => 'Nominal bukti tidak sesuai.']);
    expect($submission->fresh()->reason)->toBe('Nominal bukti tidak sesuai.')->and($submission->fresh()->proof_path)->toBe('order-payments/example.png')->and($submission->fresh()->pending_slot)->toBeNull()->and($order->fresh()->payment_status->value)->toBe('unpaid');
});

it('rejects tampered billing and partial submitted amounts', function (string $field) {
    [$submission, $admin, $order] = reviewSubmission();
    if ($field === 'amount') {
        $submission->update(['amount' => '49999']);
    }
    if ($field === 'shipping') {
        $order->update(['shipping_cost' => '21000']);
    }
    if ($field === 'item') {
        $order->items()->firstOrFail()->update(['quantity' => 3]);
    }
    expect(fn () => app(OrderPaymentReviewService::class)->review($submission->fresh(), $admin, ['status' => 'approved']))->toThrow(ValidationException::class);
    expect($submission->fresh()->status)->toBe('pending')->and($order->fresh()->payment_status->value)->toBe('unpaid');
})->with(['amount', 'shipping', 'item']);

it('denies customer reviews and archived orders', function () {
    [$submission, $admin, $order, $user] = reviewSubmission();
    expect(fn () => app(OrderPaymentReviewService::class)->review($submission, $user, ['status' => 'approved']))->toThrow(HttpException::class);
    $order->update(['import_metadata' => ['original_status' => 'completed']]);
    expect(fn () => app(OrderPaymentReviewService::class)->review($submission, $admin, ['status' => 'approved']))->toThrow(ValidationException::class);
});

it('serves private proofs only to the owner or admin and forces PDF download', function () {
    [$submission, $admin, , $user] = reviewSubmission();
    Storage::fake('local');
    $proof = UploadedFile::fake()->image('proof.png');
    Storage::disk('local')->put($submission->proof_path, file_get_contents($proof->getRealPath()));
    $url = '/order-payments/'.$submission->id.'/proof';
    $this->actingAs($user)->get($url)->assertOk()->assertHeader('Cache-Control', 'no-store, private')->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Content-Type', 'image/png');
    $this->actingAs(User::factory()->create(['role' => 'customer']))->get($url)->assertNotFound();
    $submission->update(['proof_path' => 'order-payments/example.pdf']);
    Storage::disk('local')->put($submission->proof_path, "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
    $this->actingAs($admin)->get($url)->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertDownload('transfer-'.$submission->id.'.pdf');
});

it('shows settlement review data on the admin order detail', function () {
    [$submission, $admin, $order] = reviewSubmission();
    $this->actingAs($admin)->get('/admin/orders?review=pending')->assertOk()->assertInertia(fn ($page) => $page
        ->has('orders.data', 1)->where('orders.data.0.id', $order->id)->where('orders.data.0.pending_review', true));
    $this->get('/admin/orders/'.$order->id)->assertOk()->assertInertia(fn ($page) => $page
        ->where('order.source', 'imported')->where('order.settlement.summary.outstanding', '50000.00')
        ->where('order.settlement.submissions.0.id', $submission->id)->missing('order.settlement.submissions.0.proof_path'));
});

it('removes the dead public-storage proof upload and deletion shortcuts', function () {
    expect(Route::has('admin.orders.payment-proofs.store'))->toBeFalse()
        ->and(Route::has('admin.orders.payment-proofs.destroy'))->toBeFalse();
});

it('authorizes admin review HTTP requests and validates rejection reasons', function () {
    [$submission, $admin, , $user] = reviewSubmission();
    $url = '/admin/order-payments/'.$submission->id;
    $this->actingAs($user)->patch($url, ['status' => 'approved'])->assertForbidden();
    $this->actingAs($admin)->patch($url, ['status' => 'rejected'])->assertSessionHasErrors('reason');
    $this->actingAs($admin)->patch($url, ['status' => 'approved'])->assertRedirect();
    expect($submission->fresh()->status)->toBe('approved');
});

it('blocks manual imported shipping charges and archived shipment mutation paths', function () {
    [$submission, $admin, $order] = reviewSubmission();
    $this->actingAs($admin)->patch('/admin/orders/'.$order->id.'/shipping-cost', ['shipping_cost' => '1000'])->assertSessionHasErrors('shipping_cost');
    $shipment = $order->shipments()->firstOrFail();
    $shipment->update(['biteship_order_id' => 'historical-provider-id']);
    $order->update(['import_metadata' => ['original_status' => 'shipping']]);
    expect(fn () => app(BiteshipBookingService::class)->book($order->fresh(), $shipment->fresh()))->toThrow(ValidationException::class);
    expect(fn () => app(BiteshipShipmentService::class)->synchronize($shipment))->toThrow(ValidationException::class);
    expect(fn () => app(ShipmentStatusService::class)->update($shipment, ShipmentStatus::Delivered, 'Delivered', $admin))->toThrow(ValidationException::class);
    expect(fn () => app(BiteshipShipmentService::class)->apply($shipment->fresh(), ['status' => 'delivered']))->toThrow(ValidationException::class);
    expect($shipment->fresh()->status->value)->toBe('pending');
    Http::assertNothingSent();
});

it('fulfills an approved active import through booking and delivery without becoming an archive', function () {
    [$submission, $admin, $order] = reviewSubmission();
    $shipment = $order->shipments()->firstOrFail();
    $shipment->items()->create(['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 2]);
    StoreSetting::factory()->create();
    config(['services.biteship.key' => 'test-key']);
    Http::fake([
        'api.biteship.com/v1/orders' => Http::response(['success' => true, 'id' => 'import-provider', 'status' => 'confirmed']),
        'api.biteship.com/v1/orders/import-provider' => Http::response(['success' => true, 'id' => 'import-provider', 'status' => 'delivered', 'courier' => ['waybill_id' => 'IMPORT-WB']]),
    ]);
    app(OrderPaymentReviewService::class)->review($submission, $admin, ['status' => 'approved']);
    foreach ([OrderStatus::Processing, OrderStatus::Packing, OrderStatus::Shipping] as $status) {
        app(OrderStatusService::class)->update($order->fresh(), $status, null, $admin);
    }
    expect($order->fresh()->status)->toBe(OrderStatus::Shipping)
        ->and($order->fresh()->isArchivedImport())->toBeFalse()
        ->and($shipment->fresh()->biteship_order_id)->toBe('import-provider');
    app(BiteshipBookingService::class)->book($order->fresh(), $shipment->fresh());
    Http::assertSentCount(1);
    app(BiteshipShipmentService::class)->synchronize($shipment->fresh());
    app(BiteshipShipmentService::class)->synchronize($shipment->fresh());
    expect($order->fresh()->status)->toBe(OrderStatus::Completed)
        ->and($order->fresh()->isArchivedImport())->toBeFalse()
        ->and($shipment->fresh()->waybill_id)->toBe('IMPORT-WB')
        ->and($order->statusHistories()->where('status', 'completed')->count())->toBe(1)
        ->and($shipment->statusHistories()->where('status', 'delivered')->count())->toBe(1);
    $this->assertDatabaseCount('wallet_transactions', 0);
    $this->assertDatabaseCount('book_stock_movements', 0);
    Http::assertSentCount(3);
});

it('blocks imported cancellation and fulfillment before approved settlement', function () {
    [, $admin, $order, $user] = reviewSubmission();
    expect(fn () => app(OrderStatusService::class)->update($order, OrderStatus::Cancelled, null, $admin))->toThrow(ValidationException::class);
    expect(fn () => app(OrderCancellationService::class)->cancel($order, $user))->toThrow(ValidationException::class);
    expect(fn () => app(OrderStatusService::class)->update($order, OrderStatus::Processing, null, $admin))->toThrow(ValidationException::class);
    expect($order->fresh()->status->value)->toBe('pending');
    $this->assertDatabaseCount('book_stock_movements', 0);
});
