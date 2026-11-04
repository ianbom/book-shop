<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'uploaded_by', 'submission_key', 'amount', 'proof_path', 'proof_sha256', 'status', 'pending_slot', 'bank_account_snapshot', 'billing_fingerprint', 'reviewed_by', 'reviewed_at', 'reason'])]
class OrderPaymentSubmission extends Model
{
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'bank_account_snapshot' => 'array', 'reviewed_at' => 'datetime', 'pending_slot' => 'integer'];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
