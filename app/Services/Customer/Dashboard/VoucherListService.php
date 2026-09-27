<?php

namespace App\Services\Customer\Dashboard;

use App\Models\User;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class VoucherListService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function paginate(User $user, array $filters): array
    {
        $search = trim((string) ($filters['search'] ?? ''));

        $paginator = Voucher::query()
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->where(fn (Builder $query) => $query->whereNull('usage_limit')
                ->orWhereRaw('(select count(*) from voucher_usages where voucher_usages.voucher_id = vouchers.id) < vouchers.usage_limit'))
            ->whereRaw('(select count(*) from voucher_usages where voucher_usages.voucher_id = vouchers.id and voucher_usages.user_id = ?) < vouchers.per_user_limit', [$user->id])
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            }))
            ->withCount(['usages as user_usages_count' => fn (Builder $query) => $query->where('user_id', $user->id)])
            ->latest()
            ->paginate(15)
            ->appends($filters);

        return [
            ...$paginator->toArray(),
            'data' => $paginator->getCollection()->map(function (Voucher $voucher): array {
                $endsAt = $voucher->getRawOriginal('ends_at');

                return [
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'name' => $voucher->name,
                    'description' => $voucher->description,
                    'type' => $voucher->getRawOriginal('type'),
                    'value' => $voucher->value,
                    'max_discount' => $voucher->max_discount,
                    'min_order_amount' => $voucher->min_order_amount,
                    'ends_at' => $endsAt === null ? null : Carbon::parse($endsAt)->toISOString(),
                    'remaining_uses' => $voucher->per_user_limit - (int) $voucher->getAttribute('user_usages_count'),
                ];
            })->all(),
        ];
    }
}
