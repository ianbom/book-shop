<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'phone', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, SoftDeletes, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /** @return HasMany<UserAddress, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(UserAddress::class);
    }

    /** @return HasOne<Wallet, $this> */
    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    /** @return HasMany<WalletTopup, $this> */
    public function walletTopups(): HasMany
    {
        return $this->hasMany(WalletTopup::class);
    }

    /** @return HasMany<WalletTopup, $this> */
    public function reviewedWalletTopups(): HasMany
    {
        return $this->hasMany(WalletTopup::class, 'reviewed_by');
    }

    /** @return HasMany<WalletTransaction, $this> */
    public function createdWalletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'created_by');
    }

    /** @return HasOne<Cart, $this> */
    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    /** @return HasMany<Voucher, $this> */
    public function createdVouchers(): HasMany
    {
        return $this->hasMany(Voucher::class, 'created_by');
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<VoucherUsage, $this> */
    public function voucherUsages(): HasMany
    {
        return $this->hasMany(VoucherUsage::class);
    }

    /** @return HasMany<OrderStatusHistory, $this> */
    public function orderStatusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class, 'changed_by');
    }

    /** @return HasMany<BookStockMovement, $this> */
    public function bookStockMovements(): HasMany
    {
        return $this->hasMany(BookStockMovement::class, 'changed_by');
    }
}
