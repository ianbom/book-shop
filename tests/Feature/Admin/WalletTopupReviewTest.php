<?php

namespace Tests\Feature\Admin;

use App\Enums\TopupStatus;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class WalletTopupReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_credits_the_actual_amount_and_customer_sees_the_note(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $wallet = Wallet::create(['user_id' => $customer->id, 'balance' => 15000]);
        $topup = $this->topup($customer);

        $this->actingAs($admin)->patch(route('admin.top-ups.review', $topup), [
            'status' => 'approved',
            'credited_amount' => 98000,
            'admin_note' => 'Dana diterima Rp98.000.',
        ])->assertRedirect();

        $topup->refresh();
        $this->assertSame(TopupStatus::Approved, $topup->status);
        $this->assertSame('98000.00', $topup->credited_amount);
        $this->assertSame($admin->id, $topup->reviewed_by);
        $this->assertNotNull($topup->reviewed_at);
        $this->assertSame('Dana diterima Rp98.000.', $topup->admin_note);
        $this->assertSame('113000.00', $wallet->fresh()->balance);
        $transaction = WalletTransaction::query()->sole();
        $this->assertSame($wallet->id, $transaction->wallet_id);
        $this->assertSame($topup->id, $transaction->topup_id);
        $this->assertSame($admin->id, $transaction->created_by);
        $this->assertSame(WalletTransactionType::TopupCredit, $transaction->type);
        $this->assertSame(WalletTransactionDirection::Credit, $transaction->direction);
        $this->assertSame('98000.00', $transaction->amount);
        $this->assertSame('15000.00', $transaction->balance_before);
        $this->assertSame('113000.00', $transaction->balance_after);
        $this->assertSame('Dana diterima Rp98.000.', $transaction->note);

        $this->actingAs($customer)->get(route('customer.dashboard.wallets.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('balance', '113000.00')
                ->where('topups.data.0.credited_amount', '98000.00')
                ->where('topups.data.0.admin_note', 'Dana diterima Rp98.000.'));
    }

    public function test_rejection_requires_a_note_and_does_not_credit_wallet(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $wallet = Wallet::create(['user_id' => $customer->id, 'balance' => 15000]);
        $topup = $this->topup($customer);

        $this->actingAs($admin)->patch(route('admin.top-ups.review', $topup), [
            'status' => 'rejected',
        ])->assertSessionHasErrors('admin_note');

        $this->patch(route('admin.top-ups.review', $topup), [
            'status' => 'rejected',
            'admin_note' => 'Bukti transfer tidak cocok.',
        ])->assertRedirect();

        $this->assertSame(TopupStatus::Rejected, $topup->fresh()->status);
        $this->assertNull($topup->fresh()->credited_amount);
        $this->assertSame('Bukti transfer tidak cocok.', $topup->fresh()->admin_note);
        $this->assertSame('15000.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_only_pending_requests_can_be_reviewed_once(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $topup = $this->topup($customer);
        $url = route('admin.top-ups.review', $topup);

        $this->actingAs($admin)->patch($url, ['status' => 'approved', 'credited_amount' => 125000])->assertRedirect();
        $this->patch($url, ['status' => 'approved', 'credited_amount' => 125000])->assertSessionHasErrors('status');
        $this->patch($url, ['status' => 'rejected', 'admin_note' => 'Ubah lagi'])->assertSessionHasErrors('status');

        $this->assertSame('125000.00', $topup->fresh()->credited_amount);
        $this->assertSame('125000.00', $customer->wallet->balance);
        $this->assertDatabaseCount('wallet_transactions', 1);
    }

    public function test_invalid_amount_and_status_are_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $topup = $this->topup(User::factory()->create(['role' => 'customer']));
        $url = route('admin.top-ups.review', $topup);

        foreach ([null, 0, -1, '98000.50', 10000000000000] as $amount) {
            $this->actingAs($admin)->patch($url, ['status' => 'approved', 'credited_amount' => $amount])
                ->assertSessionHasErrors('credited_amount');
        }
        $this->patch($url, ['status' => 'pending', 'credited_amount' => 1000])->assertSessionHasErrors('status');
        $this->assertSame(TopupStatus::Pending, $topup->fresh()->status);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_proof_is_private_and_only_admin_can_review(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('topups/proof.jpg', 'private-image');
        $topup = $this->topup(User::factory()->create(['role' => 'customer']));
        $proofUrl = route('admin.top-ups.proof', $topup);
        $reviewUrl = route('admin.top-ups.review', $topup);
        $payload = ['status' => 'approved', 'credited_amount' => 100000];

        $this->get($proofUrl)->assertRedirect(route('login'));
        $this->patch($reviewUrl, $payload)->assertRedirect(route('login'));
        $this->actingAs($topup->user)->get($proofUrl)->assertForbidden();
        $this->patch($reviewUrl, $payload)->assertForbidden();
        $proofResponse = $this->actingAs(User::factory()->create(['role' => 'admin']))->get($proofUrl);
        $proofResponse->assertOk();
        $this->assertSame('private-image', $proofResponse->streamedContent());
        $this->get(route('admin.top-ups.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topups.data.0.proof_url', $proofUrl)
                ->missing('topups.data.0.proof_image_path'));
    }

    public function test_ledger_failure_rolls_back_approval_and_balance(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $topup = $this->topup($customer);
        WalletTransaction::creating(function (): void {
            throw new RuntimeException('Ledger unavailable.');
        });
        $this->withoutExceptionHandling();

        try {
            $this->actingAs(User::factory()->create(['role' => 'admin']))
                ->patch(route('admin.top-ups.review', $topup), ['status' => 'approved', 'credited_amount' => 98000]);
            $this->fail('Expected ledger to fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Ledger unavailable.', $exception->getMessage());
        }

        $this->assertSame(TopupStatus::Pending, $topup->fresh()->status);
        $this->assertNull($customer->wallet);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_credit_that_exceeds_the_wallet_limit_is_rejected_without_changes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $wallet = Wallet::create(['user_id' => $customer->id, 'balance' => 9999999999999]);
        $topup = $this->topup($customer);

        $this->actingAs($admin)->patch(route('admin.top-ups.review', $topup), [
            'status' => 'approved',
            'credited_amount' => 1,
        ])->assertSessionHasErrors('credited_amount');

        $this->assertSame(TopupStatus::Pending, $topup->fresh()->status);
        $this->assertSame('9999999999999.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    private function topup(User $customer): WalletTopup
    {
        return WalletTopup::create([
            'user_id' => $customer->id,
            'topup_code' => 'TOP-TEST-'.$customer->id,
            'requested_amount' => 100000,
            'proof_image_path' => 'topups/proof.jpg',
        ]);
    }
}
