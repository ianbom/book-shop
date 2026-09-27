<?php

namespace App\Services\Customer\Dashboard;

use App\Models\StoreSetting;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class WalletListService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{balance: string, transactions: array<string, mixed>, topups: array<string, mixed>, bankAccounts: list<array<string, mixed>>}
     */
    public function paginate(User $user, array $filters): array
    {
        $wallet = Wallet::query()->where('user_id', $user->id)->first();
        $setting = StoreSetting::query()->first(['bank_accounts']);
        $bankAccounts = $setting?->getAttribute('bank_accounts') ?? [];
        $bankAccounts = is_array($bankAccounts) ? array_values($bankAccounts) : [];
        $search = trim((string) ($filters['search'] ?? ''));

        $paginator = WalletTransaction::query()
            ->whereHas('wallet', fn (Builder $query) => $query->where('user_id', $user->id))
            ->with(['order:id,order_code', 'topup:id,topup_code'])
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->whereHas('order', fn (Builder $order) => $order->where('order_code', 'like', "%{$search}%"))
                    ->orWhereHas('topup', fn (Builder $topup) => $topup->where('topup_code', 'like', "%{$search}%"));
            }))
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['direction'] ?? null, fn (Builder $query, string $direction) => $query->where('direction', $direction))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->appends($filters);

        $transactions = [
            ...$paginator->toArray(),
            'data' => $paginator->getCollection()->map(fn (WalletTransaction $transaction): array => [
                'id' => $transaction->id,
                'type' => $transaction->getRawOriginal('type'),
                'direction' => $transaction->getRawOriginal('direction'),
                'amount' => $transaction->amount,
                'balance_after' => $transaction->balance_after,
                'order_code' => $transaction->order?->order_code,
                'topup_code' => $transaction->topup?->topup_code,
                'created_at' => Carbon::parse((string) $transaction->getRawOriginal('created_at'))->toISOString(),
            ])->all(),
        ];

        $topupPaginator = $user->walletTopups()->latest('id')->paginate(10, ['*'], 'topup_page')->withQueryString();
        $topups = [
            ...$topupPaginator->toArray(),
            'data' => $topupPaginator->getCollection()->map(fn (WalletTopup $topup): array => [
                'id' => $topup->id,
                'topup_code' => $topup->topup_code,
                'requested_amount' => $topup->requested_amount,
                'credited_amount' => $topup->credited_amount,
                'status' => $topup->getRawOriginal('status'),
                'admin_note' => $topup->admin_note,
                'created_at' => $topup->created_at?->toISOString(),
                'reviewed_at' => $topup->reviewed_at?->toISOString(),
            ])->all(),
        ];

        return [
            'balance' => $wallet === null ? '0.00' : (string) $wallet->getAttribute('balance'),
            'transactions' => $transactions,
            'topups' => $topups,
            'bankAccounts' => $bankAccounts,
        ];
    }
}
