<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Http\Middleware\EnsureAdminRole;
use App\Models\Order;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_admin_route_requires_admin_role(): void
    {
        foreach (Route::getRoutes() as $route) {
            if (str_starts_with((string) $route->getName(), 'admin.') === false) {
                continue;
            }

            $this->assertContains(EnsureAdminRole::class, $route->gatherMiddleware(), $route->getName());
        }

        $this->get(route('admin.customers.index'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get(route('admin.customers.index'))->assertForbidden();
        $this->actingAs(User::factory()->create())->post(route('admin.categories.store'))->assertForbidden();
    }

    public function test_customer_login_redirects_to_storefront_and_admin_login_stays_in_admin(): void
    {
        $customer = User::factory()->create(['email' => 'customer@example.com']);
        $this->get(route('admin.customers.index'))->assertRedirect(route('login'));
        $this->post(route('login.store'), [
            'email' => $customer->email,
            'password' => 'password',
        ])->assertRedirect(route('home'));

        $this->get(route('login'))->assertRedirect(route('home'));

        auth()->logout();
        $admin = User::factory()->create(['email' => 'admin@example.com']);
        $admin->forceFill(['role' => UserRole::Admin])->save();

        $this->post(route('login.store'), [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard', absolute: false));

        $this->get(route('login'))->assertRedirect(route('admin.dashboard'));
    }

    public function test_customer_index_searches_filters_sorts_and_excludes_admins(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => UserRole::Admin])->save();
        $verified = User::factory()->create([
            'name' => 'Rani Customer',
            'email' => 'rani@example.com',
            'phone' => '0812345678',
        ]);
        $verified->forceFill(['created_at' => '2026-09-20 10:00:00'])->save();
        Wallet::create(['user_id' => $verified->id, 'balance' => 150000]);
        Order::create([
            'order_code' => 'ORD-RANI-1',
            'user_id' => $verified->id,
            'subtotal' => 50000,
            'total' => 50000,
            'wallet_amount' => 50000,
        ]);
        Order::create([
            'order_code' => 'ORD-RANI-2',
            'user_id' => $verified->id,
            'subtotal' => 75000,
            'total' => 75000,
            'wallet_amount' => 75000,
        ]);

        $unverified = User::factory()->unverified()->create([
            'name' => 'Bima Customer',
            'email' => 'bima@example.com',
            'phone' => '0898765432',
        ]);
        $unverified->forceFill(['created_at' => '2026-09-21 10:00:00'])->save();

        $response = $this->actingAs($admin)->get(route('admin.customers.index', [
            'search' => '0812345678',
            'verification_status' => 'verified',
            'date_from' => '2026-09-20',
            'date_to' => '2026-09-20',
        ]));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/customers/index')
            ->has('customers.data', 1)
            ->where('customers.data.0.id', $verified->id)
            ->where('customers.data.0.orders_count', 2)
            ->where('customers.data.0.wallet_balance', '150000.00')
            ->where('filters.verification_status', 'verified'));

        foreach (['Rani', 'rani@example.com'] as $search) {
            $this->actingAs($admin)->get(route('admin.customers.index', ['search' => $search]))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('customers.data', 1)
                    ->where('customers.data.0.id', $verified->id));
        }

        $this->actingAs($admin)->get(route('admin.customers.index', [
            'verification_status' => 'unverified',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('customers.data', 1)
            ->where('customers.data.0.id', $unverified->id));

        $this->actingAs($admin)->get(route('admin.customers.index', ['sort' => 'orders_count', 'sort_direction' => 'desc']))
            ->assertInertia(fn (Assert $page) => $page->where('customers.data.0.id', $verified->id));
        $this->actingAs($admin)->get(route('admin.customers.index', ['sort' => 'wallet_balance', 'sort_direction' => 'asc']))
            ->assertInertia(fn (Assert $page) => $page->where('customers.data.0.id', $unverified->id));

        $this->actingAs($admin)->get(route('admin.customers.index', ['sort' => 'drop table']))
            ->assertSessionHasErrors('sort');
        $this->actingAs($admin)->get(route('admin.customers.index', ['date_from' => '2026-09-22', 'date_to' => '2026-09-21']))
            ->assertSessionHasErrors('date_to');
    }
}
