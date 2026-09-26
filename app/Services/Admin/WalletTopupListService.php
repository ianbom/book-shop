<?php

namespace App\Services\Admin;

use App\Models\WalletTopup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class WalletTopupListService
{
    public const SORTS = ['created_at', 'topup_code', 'requested_amount', 'status'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, WalletTopup>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = WalletTopup::query()->with(['user', 'reviewer']);
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $term = "%{$search}%";
                $builder->where('topup_code', 'like', $term)
                    ->orWhereHas('user', fn (Builder $user) => $user
                        ->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term));
            });
        }

        return $query
            ->when($filters['status'] ?? null, fn (Builder $builder, string $status) => $builder->where('status', $status))
            ->when($filters['date_from'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '<=', $date))
            ->orderBy($filters['sort'] ?? 'created_at', $filters['sort_direction'] ?? 'desc')
            ->orderByDesc('id')
            ->paginate(15)
            ->appends($filters);
    }
}
