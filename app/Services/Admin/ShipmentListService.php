<?php

namespace App\Services\Admin;

use App\Models\Shipment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class ShipmentListService
{
    public const SORTS = ['created_at', 'shipment_code', 'courier_company', 'status', 'price'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Shipment>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Shipment::query()->with('order.user');
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $term = "%{$search}%";
                $builder->where('shipment_code', 'like', $term)
                    ->orWhere('courier_company', 'like', $term)
                    ->orWhere('tracking_id', 'like', $term)
                    ->orWhere('waybill_id', 'like', $term)
                    ->orWhereHas('order', fn (Builder $order) => $order
                        ->where('order_code', 'like', $term)
                        ->orWhereHas('user', fn (Builder $user) => $user
                            ->where('name', 'like', $term)
                            ->orWhere('email', 'like', $term)));
            });
        }

        return $query
            ->when($filters['status'] ?? null, fn (Builder $builder, string $status) => $builder->where('status', $status))
            ->when($filters['delivery_type'] ?? null, fn (Builder $builder, string $type) => $builder->where('delivery_type', $type))
            ->when($filters['date_from'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '<=', $date))
            ->orderBy($filters['sort'] ?? 'created_at', $filters['sort_direction'] ?? 'desc')
            ->orderByDesc('id')
            ->paginate(15)
            ->appends($filters);
    }
}
