<?php

namespace Tests\Feature\Customer;

use App\Enums\TopupStatus;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTopup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class WalletTopupTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallet_page_lists_all_store_bank_accounts_or_an_empty_list(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->get(route('customer.dashboard.wallets.index'))
            ->assertInertia(fn (Assert $page) => $page->where('bankAccounts', []));

        $setting = StoreSetting::factory()->create();
        $this->get(route('customer.dashboard.wallets.index'))
            ->assertInertia(fn (Assert $page) => $page->where('bankAccounts', []));

        $accounts = [
            ['bank_name' => 'BCA', 'account_holder' => 'Toko Buku', 'account_number' => '0012345678'],
            ['bank_name' => 'Mandiri', 'account_holder' => 'Wonder Book', 'account_number' => '0087654321'],
        ];
        $setting->update(['bank_accounts' => $accounts]);

        $this->get(route('customer.dashboard.wallets.index'))
            ->assertInertia(fn (Assert $page) => $page->where('bankAccounts', $accounts));
    }

    public function test_customer_can_submit_proof_without_adding_balance_before_approval(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create(['role' => 'customer']);
        $wallet = Wallet::query()->create(['user_id' => $customer->id, 'balance' => 15000]);
        $proof = UploadedFile::fake()->image('receipt.jpg');

        $this->actingAs($customer)->post(route('customer.dashboard.wallets.topups.store'), [
            'requested_amount' => '50000',
            'proof_image' => $proof,
        ])->assertRedirect(route('customer.dashboard.wallets.index'));

        $topup = WalletTopup::query()->firstOrFail();
        $this->assertSame($customer->id, $topup->user_id);
        $this->assertSame('50000.00', $topup->requested_amount);
        $this->assertSame(TopupStatus::Pending, $topup->status);
        $this->assertNull($topup->credited_amount);
        $this->assertMatchesRegularExpression('/^TOP-[0-9A-HJKMNP-TV-Z]{26}$/', $topup->topup_code);
        Storage::disk('local')->assertExists($topup->proof_image_path);
        Storage::disk('public')->assertMissing($topup->proof_image_path);
        $this->assertSame('15000.00', $wallet->fresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 0);

        $this->get(route('customer.dashboard.wallets.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('topups.data', 1)
                ->where('topups.data.0.topup_code', $topup->topup_code)
                ->where('topups.data.0.status', 'pending')
                ->where('balance', '15000.00'));
    }

    public function test_only_owner_sees_topup_request(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $other = User::factory()->create(['role' => 'customer']);
        WalletTopup::query()->create([
            'user_id' => $other->id,
            'topup_code' => 'TOP-OTHER',
            'requested_amount' => 20000,
            'proof_image_path' => 'topups/other.jpg',
        ]);

        $this->actingAs($customer)->get(route('customer.dashboard.wallets.index'))
            ->assertInertia(fn (Assert $page) => $page->has('topups.data', 0));
    }

    public function test_invalid_amount_or_proof_cannot_create_topup(): void
    {
        Storage::fake('local');
        $this->actingAs(User::factory()->create(['role' => 'customer']))
            ->post(route('customer.dashboard.wallets.topups.store'), [
                'requested_amount' => 0,
            ])->assertSessionHasErrors(['requested_amount', 'proof_image']);
        $this->post(route('customer.dashboard.wallets.topups.store'), [
            'requested_amount' => '1000.50',
            'proof_image' => UploadedFile::fake()->create('receipt.pdf', 50, 'application/pdf'),
        ])->assertSessionHasErrors(['requested_amount', 'proof_image']);
        $this->post(route('customer.dashboard.wallets.topups.store'), [
            'requested_amount' => 50000,
            'proof_image' => UploadedFile::fake()->image('large.png')->size(5121),
        ])->assertSessionHasErrors('proof_image');

        $this->assertDatabaseCount('wallet_topups', 0);
        $this->assertSame([], Storage::disk('local')->files('topups'));
    }

    public function test_guests_and_admins_cannot_submit_customer_topups(): void
    {
        Storage::fake('local');
        $payload = ['requested_amount' => 20000, 'proof_image' => UploadedFile::fake()->image('proof.jpg')];
        $this->post(route('customer.dashboard.wallets.topups.store'), $payload)->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post(route('customer.dashboard.wallets.topups.store'), $payload)->assertForbidden();

        $this->assertDatabaseCount('wallet_topups', 0);
        $this->assertSame([], Storage::disk('local')->files('topups'));
    }

    public function test_database_failure_deletes_uploaded_proof(): void
    {
        Storage::fake('local');
        WalletTopup::creating(function (): void {
            throw new RuntimeException('Simulated database failure.');
        });
        $this->withoutExceptionHandling();

        try {
            $this->actingAs(User::factory()->create(['role' => 'customer']))
                ->post(route('customer.dashboard.wallets.topups.store'), [
                    'requested_amount' => 20000,
                    'proof_image' => UploadedFile::fake()->image('receipt.png'),
                ]);
            $this->fail('Expected top-up creation to fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Simulated database failure.', $exception->getMessage());
        }

        $this->assertDatabaseCount('wallet_topups', 0);
        $this->assertSame([], Storage::disk('local')->files('topups'));
    }
}
