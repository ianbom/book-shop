<?php

namespace App\Services\Admin;

use App\Enums\TopupStatus;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTopup;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WalletTopupReviewService
{
    /** @param array{status: string, credited_amount?: int, admin_note?: ?string} $data */
    public function review(WalletTopup $topup, array $data, User $admin): WalletTopup
    {
        return DB::transaction(function () use ($topup, $data, $admin): WalletTopup {
            $topup = WalletTopup::query()->lockForUpdate()->findOrFail($topup->id);
            if ($topup->status !== TopupStatus::Pending) {
                throw ValidationException::withMessages(['status' => 'Permintaan ini sudah pernah diproses.']);
            }

            $status = TopupStatus::from($data['status']);
            $note = $data['admin_note'] ?? null;
            $creditedAmount = null;
            if ($status === TopupStatus::Approved) {
                User::query()->lockForUpdate()->findOrFail($topup->user_id);
                $wallet = Wallet::query()->firstOrCreate(['user_id' => $topup->user_id]);
                $wallet = Wallet::query()->lockForUpdate()->findOrFail($wallet->id);
                $creditedAmount = (int) $data['credited_amount'];
                $balanceBefore = (int) str_replace('.', '', (string) $wallet->balance);
                $balanceAfter = $balanceBefore + ($creditedAmount * 100);
                if ($balanceAfter > 999999999999999) {
                    throw ValidationException::withMessages(['credited_amount' => 'Saldo setelah dikreditkan melebihi batas maksimum.']);
                }
                $formatMoney = fn (int $cents): string => sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
                $wallet->update(['balance' => $formatMoney($balanceAfter)]);
                $wallet->transactions()->create([
                    'topup_id' => $topup->id,
                    'created_by' => $admin->id,
                    'type' => WalletTransactionType::TopupCredit,
                    'direction' => WalletTransactionDirection::Credit,
                    'amount' => $formatMoney($creditedAmount * 100),
                    'balance_before' => $formatMoney($balanceBefore),
                    'balance_after' => $formatMoney($balanceAfter),
                    'note' => $note,
                ]);

            }

            $topup->update([
                'status' => $status,
                'credited_amount' => $creditedAmount,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'admin_note' => $note,
            ]);

            return $topup->refresh();
        }, 3);
    }
}
