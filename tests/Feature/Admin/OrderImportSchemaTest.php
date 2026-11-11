<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\OrderPaymentSubmission;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('defaults existing orders to website and allows absent historical author', function () {
    $order = Order::factory()->create()->refresh();
    $book = Book::factory()->create(['author' => null]);
    expect($order->source)->toBe('website')
        ->and($order->shipping_selected_at)->toBeNull()
        ->and($order->user->must_change_password)->toBeFalse()
        ->and($book->author)->toBeNull()
        ->and(Schema::hasColumns('order_items', ['pre_order_code', 'line_discount', 'historical_dp', 'historical_paid', 'import_row_key', 'import_row_number']))->toBeTrue();
});

it('enforces one pending submission per order but retains reviewed history', function () {
    $order = Order::factory()->create();
    $data = ['order_id' => $order->id, 'uploaded_by' => $order->user_id, 'amount' => '85000.00', 'proof_path' => 'private/proof.png', 'status' => 'pending', 'pending_slot' => 1, 'bank_account_snapshot' => [], 'billing_fingerprint' => str_repeat('a', 64)];
    $first = OrderPaymentSubmission::create([...$data, 'submission_key' => (string) Str::uuid()]);
    $first->update(['status' => 'rejected', 'pending_slot' => null]);
    OrderPaymentSubmission::create([...$data, 'submission_key' => (string) Str::uuid()]);
    expect($order->paymentSubmissions()->count())->toBe(2);
    expect(fn () => OrderPaymentSubmission::create([...$data, 'submission_key' => (string) Str::uuid()]))->toThrow(QueryException::class);
});

it('rejects inconsistent payment status and pending slots', function (string $status, ?int $slot) {
    $order = Order::factory()->create();
    expect(fn () => OrderPaymentSubmission::create([
        'order_id' => $order->id, 'uploaded_by' => $order->user_id, 'submission_key' => (string) Str::uuid(),
        'amount' => '1.00', 'proof_path' => 'proof.png', 'status' => $status, 'pending_slot' => $slot,
        'bank_account_snapshot' => [], 'billing_fingerprint' => str_repeat('a', 64),
    ]))->toThrow(QueryException::class);
})->with([['pending', null], ['pending', 2], ['approved', 1], ['rejected', 1]]);

it('prevents changing a pending slot without reviewing the submission', function () {
    $order = Order::factory()->create();
    $submission = OrderPaymentSubmission::create([
        'order_id' => $order->id, 'uploaded_by' => $order->user_id, 'submission_key' => (string) Str::uuid(),
        'amount' => '1.00', 'proof_path' => 'proof.png', 'bank_account_snapshot' => [], 'billing_fingerprint' => str_repeat('a', 64),
    ]);
    expect(fn () => $submission->update(['pending_slot' => null]))->toThrow(QueryException::class);
});

it('keeps forced password state outside mass assignable profile fields', function () {
    $user = User::factory()->create();
    expect($user->isFillable('must_change_password'))->toBeFalse();
    $user->forceFill(['must_change_password' => true])->save();
    expect($user->refresh()->must_change_password)->toBeTrue();
});
