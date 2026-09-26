<?php

namespace App\Models;

use App\Enums\TopupStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['topup_code', 'user_id', 'requested_amount', 'credited_amount', 'proof_image_path', 'status', 'reviewed_by', 'reviewed_at', 'admin_note'])]
class WalletTopup extends Model
{
    protected function casts(): array
    {
        return [
            'requested_amount' => 'decimal:2',
            'credited_amount' => 'decimal:2',
            'status' => TopupStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** @return HasMany<WalletTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'topup_id');
    }
}
