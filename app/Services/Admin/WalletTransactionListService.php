<?php

namespace App\Services\Admin;

use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class WalletTransactionListService
{
    public const SORTS = ['created_at', 'type', 'direction', 'amount'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, WalletTransaction>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = WalletTransaction::query()->with(['wallet.user', 'order', 'topup']);
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $term = "%{$search}%";
                $builder->whereHas('wallet.user', fn (Builder $user) => $user
                    ->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term))
                    ->orWhereHas('order', fn (Builder $order) => $order->where('order_code', 'like', $term))
                    ->orWhereHas('topup', fn (Builder $topup) => $topup->where('topup_code', 'like', $term));
            });
        }

        return $query
            ->when($filters['type'] ?? null, fn (Builder $builder, string $type) => $builder->where('type', $type))
            ->when($filters['direction'] ?? null, fn (Builder $builder, string $direction) => $builder->where('direction', $direction))
            ->when($filters['date_from'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '<=', $date))
            ->orderBy($filters['sort'] ?? 'created_at', $filters['sort_direction'] ?? 'desc')
            ->orderByDesc('id')
            ->paginate(15)
            ->appends($filters);
    }
}
