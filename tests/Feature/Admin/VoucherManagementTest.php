<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VoucherManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_edit_voucher_with_all_fields(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.vouchers.store'), $this->voucher())
            ->assertRedirect()->assertSessionHasNoErrors();

        $voucher = Voucher::query()->firstOrFail();
        $this->assertSame($admin->id, $voucher->created_by);
        $this->assertSame('20000.00', $voucher->max_discount);
        $this->actingAs($admin)->get(route('admin.vouchers.index'))
            ->assertInertia(fn (Assert $page) => $page->where('vouchers.data.0.description', 'Promo toko')
                ->where('vouchers.data.0.per_user_limit', 2));

        $this->patch(route('admin.vouchers.update', $voucher), [...$this->voucher(), 'name' => 'Promo Baru', 'is_active' => false])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Promo Baru', $voucher->fresh()->name);
        $this->assertFalse($voucher->fresh()->is_active);
        $this->assertSame($admin->id, $voucher->fresh()->created_by);
    }

    public function test_invalid_voucher_is_rejected(): void
    {
        $admin = $this->admin();
        Voucher::create([...$this->voucher(), 'created_by' => $admin->id]);
        $this->actingAs($admin)->post(route('admin.vouchers.store'), $this->voucher())
            ->assertSessionHasErrors('code');
        $this->post(route('admin.vouchers.store'), [...$this->voucher(), 'code' => 'LAIN', 'value' => 101,
            'starts_at' => '2026-10-02T10:00', 'ends_at' => '2026-10-01T10:00'])
            ->assertSessionHasErrors(['value', 'ends_at']);
        $this->assertDatabaseCount('vouchers', 1);
    }

    public function test_admin_can_clear_optional_voucher_limits_and_dates(): void
    {
        $admin = $this->admin();
        $voucher = Voucher::create([...$this->voucher(), 'created_by' => $admin->id]);

        $this->actingAs($admin)->patch(route('admin.vouchers.update', $voucher), [
            ...$this->voucher(),
            'type' => 'fixed', 'value' => 15000, 'max_discount' => '',
            'usage_limit' => '', 'starts_at' => '', 'ends_at' => '',
        ])->assertSessionHasNoErrors();

        $voucher->refresh();
        $this->assertSame('fixed', $voucher->type->value);
        $this->assertNull($voucher->max_discount);
        $this->assertNull($voucher->usage_limit);
        $this->assertNull($voucher->starts_at);
        $this->assertNull($voucher->ends_at);
    }

    public function test_customer_cannot_create_or_edit_voucher(): void
    {
        $voucher = Voucher::create([...$this->voucher(), 'created_by' => $this->admin()->id]);
        $this->actingAs(User::factory()->create());
        $this->post(route('admin.vouchers.store'), $this->voucher())->assertForbidden();
        $this->patch(route('admin.vouchers.update', $voucher), $this->voucher())->assertForbidden();
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => UserRole::Admin])->save();

        return $admin;
    }

    private function voucher(): array
    {
        return [
            'code' => 'PROMO20', 'name' => 'Promo', 'description' => 'Promo toko',
            'type' => 'percentage', 'value' => 20, 'max_discount' => 20000,
            'min_order_amount' => 100000, 'usage_limit' => 50, 'per_user_limit' => 2,
            'starts_at' => '2026-10-01T10:00', 'ends_at' => '2026-10-31T10:00', 'is_active' => true,
        ];
    }
}
