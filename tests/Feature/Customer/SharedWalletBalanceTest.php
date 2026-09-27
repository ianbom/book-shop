<?php

namespace Tests\Feature\Customer;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SharedWalletBalanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_receives_the_latest_wallet_balance_as_shared_data(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $wallet = Wallet::create(['user_id' => $customer->id, 'balance' => 64000]);

        $this->actingAs($customer)->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->where('walletBalance', '64000.00'));

        $wallet->update(['balance' => 87500]);
        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->where('walletBalance', '87500.00'));
    }

    public function test_customer_without_wallet_receives_zero_balance(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']))
            ->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->where('walletBalance', '0.00'));
    }

    public function test_admin_does_not_receive_a_wallet_balance(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->where('walletBalance', null));
    }
}
