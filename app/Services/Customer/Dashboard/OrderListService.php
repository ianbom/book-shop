<?php

namespace App\Services\Customer\Dashboard;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class OrderListService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function paginate(User $user, array $filters): array
    {
        $paginator = Order::query()
            ->where('user_id', $user->id)
            ->with([
                'items',
                'items.book' => fn ($query) => $query->withTrashed(),
                'items.book.images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
            ])
            ->withCount('shipments')
            ->search($filters['search'] ?? null)
            ->status(OrderStatus::tryFrom($filters['status'] ?? ''))
            ->paymentStatus(PaymentStatus::tryFrom($filters['payment'] ?? ''))
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(15)
            ->appends($filters);

        return [
            ...$paginator->toArray(),
            'data' => $paginator->getCollection()->map(function (Order $order): array {
                $images = $order->items->first()?->book?->images;
                $image = $images?->firstWhere('is_primary') ?? $images?->first();

                return [
                    'id' => $order->id,
                    'order_code' => $order->order_code,
                    'item_summary' => ($order->items->isEmpty() ? 'Buku' : $order->items->first()->name)
                        .($order->items->count() > 1 ? ' +'.($order->items->count() - 1).' lainnya' : ''),
                    'primary_image' => $image ? [
                        'url' => Storage::disk('public')->url($image->image_path),
                        'alt_text' => $image->alt_text,
                    ] : null,
                    'quantity' => $order->items->sum('quantity'),
                    'total' => $order->total,
                    'status' => $order->getRawOriginal('status'),
                    'can_cancel' => in_array($order->status, [OrderStatus::Pending, OrderStatus::WaitingPreorder], true),
                    'payment_status' => $order->getRawOriginal('payment_status'),
                    'shipments_count' => $order->shipments_count,
                    'created_at' => $order->created_at?->toISOString(),
                ];
            })->all(),
        ];
    }
}
