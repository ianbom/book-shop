<?php

namespace App\Services\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class CustomerListService
{
    public const SORTS = ['name', 'email', 'phone', 'orders_count', 'wallet_balance', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, User>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->select('users.*')
            ->selectRaw('COALESCE(wallets.balance, 0) as wallet_balance')
            ->leftJoin('wallets', 'wallets.user_id', '=', 'users.id')
            ->with('wallet:id,user_id,balance')
            ->withCount('orders')
            ->where('users.role', UserRole::Customer);
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $term = "%{$search}%";
            $query->where(fn (Builder $builder) => $builder
                ->where('users.name', 'like', $term)
                ->orWhere('users.email', 'like', $term)
                ->orWhere('users.phone', 'like', $term));
        }

        $sort = $filters['sort'] ?? 'created_at';
        $sortColumn = in_array($sort, ['orders_count', 'wallet_balance'], true) ? $sort : "users.{$sort}";

        return $query
            ->when($filters['verification_status'] ?? null, function (Builder $builder, string $status): void {
                $status === 'verified'
                    ? $builder->whereNotNull('users.email_verified_at')
                    : $builder->whereNull('users.email_verified_at');
            })
            ->when($filters['date_from'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('users.created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('users.created_at', '<=', $date))
            ->orderBy($sortColumn, $filters['sort_direction'] ?? 'desc')
            ->orderByDesc('users.id')
            ->paginate(15)
            ->appends($filters);
    }
}
