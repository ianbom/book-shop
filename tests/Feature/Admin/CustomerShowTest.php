<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_detail_access_scope_and_pagination(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => UserRole::Admin])->save();
        $customer = User::factory()->create();
        $other = User::factory()->create();
        Wallet::create(['user_id' => $customer->id, 'balance' => 125000]);
        UserAddress::create(['user_id' => $customer->id, 'label' => 'Rumah', 'destination_contact_name' => 'Penerima', 'destination_contact_phone' => '08123456789', 'destination_address' => 'Jalan A'])->delete();
        foreach (range(1, 11) as $number) {
            Order::create(['user_id' => $customer->id, 'order_code' => "ORD-{$number}", 'subtotal' => 100, 'total' => 100, 'wallet_amount' => 100]);
        }
        Order::create(['user_id' => $other->id, 'order_code' => 'ORD-OTHER', 'subtotal' => 100, 'total' => 100, 'wallet_amount' => 100]);

        $this->get(route('admin.customers.show', $customer))->assertRedirect(route('login'));
        $this->actingAs($customer)->get(route('admin.customers.show', $customer))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.customers.show', $admin))->assertNotFound();

        $response = $this->actingAs($admin)->get(route('admin.customers.show', [$customer, 'orders_page' => 2]));
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/customers/show')
            ->where('customer.id', $customer->id)
            ->where('customer.wallet_balance', '125000.00')
            ->missing('customer.password')
            ->missing('customer.two_factor_secret')
            ->has('addresses.data', 1)
            ->where('addresses.data.0.deleted', true)
            ->has('orders.data', 1)
            ->where('orders.meta.current_page', 2)
            ->where('orders.meta.total', 11)
            ->where('addresses.meta.current_page', 1)
            ->has('topups.data', 0)
            ->has('transactions.data', 0)
            ->has('vouchers.data', 0)
            ->has('cartItems.data', 0));
        $this->assertStringNotContainsString('ORD-OTHER', $response->getContent());
    }
}
