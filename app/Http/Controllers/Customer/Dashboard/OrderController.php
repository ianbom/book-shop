<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Services\Customer\Dashboard\OrderCancellationService;
use App\Services\Customer\Dashboard\OrderListService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderListService $service,
        private readonly OrderCancellationService $cancellationService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'payment' => ['nullable', Rule::enum(PaymentStatus::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        return Inertia::render('customer/dashboard/orders/index', [
            'orders' => $this->service->paginate($user, $filters),
            'filters' => $filters,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $order = $user->orders()->with([
            'items',
            'items.book' => fn ($query) => $query->withTrashed(),
            'items.book.images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
            'shippingAddress', 'voucher:id,code,name',
            'statusHistories' => fn ($query) => $query->oldest(),
            'walletTransactions', 'shipments.items.orderItem',
            'shipments.statusHistories' => fn ($query) => $query->orderBy('occurred_at')->orderBy('created_at'),
        ])->whereKey($order->id)->firstOrFail();

        return Inertia::render('customer/dashboard/orders/show', ['order' => [
            'id' => $order->id, 'order_code' => $order->order_code,
            'status' => $order->status->value, 'payment_status' => $order->payment_status->value,
            'subtotal' => $order->subtotal, 'voucher_discount' => $order->voucher_discount,
            'shipping_cost' => $order->shipping_cost, 'total' => $order->total,
            'wallet_amount' => $order->wallet_amount, 'customer_note' => $order->customer_note,
            'created_at' => $order->created_at?->toISOString(),
            'items' => $order->items->map(function ($item) {
                $image = $item->book?->images->firstWhere('is_primary') ?? $item->book?->images->first();

                return [
                    'name' => $item->name, 'author' => $item->author, 'isbn' => $item->isbn,
                    'quantity' => $item->quantity, 'value' => $item->value, 'subtotal' => $item->subtotal,
                    'sale_type' => $item->sale_type?->value,
                    'preorder_estimated_date' => $item->preorder_estimated_date?->toDateString(),
                    'primary_image' => $image ? [
                        'url' => Storage::disk('public')->url($image->image_path),
                        'alt_text' => $image->alt_text,
                    ] : null,
                ];
            }),
            'shipping_address' => $order->shippingAddress ? [
                'recipient_name' => $order->shippingAddress->destination_contact_name,
                'phone' => $order->shippingAddress->destination_contact_phone,
                'email' => $order->shippingAddress->destination_contact_email,
                'address' => $order->shippingAddress->destination_address,
                'postal_code' => $order->shippingAddress->destination_postal_code,
                'province' => $order->shippingAddress->province_name,
                'city' => $order->shippingAddress->city_name,
                'district' => $order->shippingAddress->district_name,
                'subdistrict' => $order->shippingAddress->subdistrict_name,
            ] : null,
            'voucher' => $order->voucher ? ['code' => $order->voucher->code, 'name' => $order->voucher->name] : null,
            'status_histories' => $order->statusHistories->map(fn ($history) => [
                'status' => $history->status->value,
                'created_at' => $history->created_at?->toISOString(),
            ]),
            'wallet_transactions' => $order->walletTransactions->map(fn ($transaction) => [
                'type' => $transaction->type->value, 'direction' => $transaction->direction->value,
                'amount' => $transaction->amount, 'created_at' => $transaction->created_at?->toISOString(),
            ]),
            'shipments' => $order->shipments->map(fn ($shipment) => [
                'shipment_code' => $shipment->shipment_code, 'courier_company' => $shipment->courier_company,
                'courier_type' => $shipment->courier_type, 'courier_service_name' => $shipment->courier_service_name,
                'status' => $shipment->status->value, 'tracking_id' => $shipment->tracking_id,
                'waybill_id' => $shipment->waybill_id, 'courier_link' => $shipment->courier_link,
                'price' => $shipment->price, 'duration' => $shipment->duration,
                'items' => $shipment->items->map(fn ($item) => [
                    'name' => $item->orderItem?->name, 'quantity' => $item->quantity,
                ]),
                'status_histories' => $shipment->statusHistories->map(fn ($history) => [
                    'status' => $history->status->value, 'provider_status' => $history->provider_status,
                    'description' => $history->description, 'occurred_at' => $history->occurred_at?->toISOString(),
                ]),
            ]),
        ]]);
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $order = $user->orders()->whereKey($order->id)->firstOrFail();
        $this->cancellationService->cancel($order, $user);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil dibatalkan.']);

        return back();
    }
}
