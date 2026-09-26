<?php

namespace App\Services\Admin;

use App\Models\Voucher;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class VoucherListService
{
    public const SORTS = ['created_at', 'code', 'name', 'type', 'value', 'starts_at', 'ends_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Voucher>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Voucher::query()->with('creator')->withCount('usages');
        $search = trim((string) ($filters['search'] ?? ''));
        $now = now();

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $query->when($filters['type'] ?? null, fn (Builder $builder, string $type) => $builder->where('type', $type));

        match ($filters['status'] ?? null) {
            'inactive' => $query->where('is_active', false),
            'scheduled' => $query->where('is_active', true)->where('starts_at', '>', $now),
            'expired' => $query->where('is_active', true)->where('ends_at', '<', $now)
                ->where(fn (Builder $builder) => $builder->whereNull('starts_at')->orWhere('starts_at', '<=', $now)),
            'active' => $query->where('is_active', true)
                ->where(fn (Builder $builder) => $builder->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                ->where(fn (Builder $builder) => $builder->whereNull('ends_at')->orWhere('ends_at', '>=', $now)),
            default => null,
        };

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['sort_direction'] ?? 'desc')
            ->orderByDesc('id')
            ->paginate(15)
            ->appends($filters);
    }
}
