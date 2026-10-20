<?php

namespace App\Services\Customer\Dashboard;

use App\Enums\BookSaleType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Book;
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
                'shipments' => fn ($query) => $query->latest('created_at')->latest('id'),
            ])
            ->withCount('shipments')
            ->withMin(['items as preorder_estimated_date' => fn ($query) => $query->where('sale_type', BookSaleType::Preorder)], 'preorder_estimated_date')
            ->withCasts(['preorder_estimated_date' => 'date'])
            ->search($filters['search'] ?? null)
            ->when(filled($filters['pre_order_code'] ?? null), function ($query) use ($filters): void {
                $query->whereHas('items', fn ($items) => $items
                    ->where('sale_type', BookSaleType::Preorder)
                    ->whereIn('book_id', Book::withTrashed()->select('id')
                        ->whereHas('preOrderCode', fn ($codes) => $codes->where('code', 'like', '%'.$filters['pre_order_code'].'%'))));
            })
            ->status(OrderStatus::tryFrom($filters['status'] ?? ''))
            ->paymentStatus(PaymentStatus::tryFrom($filters['payment'] ?? ''))
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
                    'shipment_status' => $order->shipments->first()?->getRawOriginal('status'),
                    'preorder_estimated_date' => $order->getAttribute('preorder_estimated_date')?->toDateString(),
                    'shipments_count' => $order->shipments_count,
                    'created_at' => $order->created_at?->toISOString(),
                ];
            })->all(),
        ];
    }
}
