<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookSaleType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ShipmentStatus;
use App\Enums\WalletTransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Orders\UpdateOrderShippingCostRequest;
use App\Http\Requests\Admin\Orders\UpdateOrderStatusRequest;
use App\Http\Resources\Admin\OrderDetailResource;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Book;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\Admin\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderStatusService $statusService) {}

    public function index(Request $request): Response
    {
        $request->validate([
            'pre_order_code' => ['nullable', 'string', 'max:255'],
            'eta' => ['nullable', 'date_format:Y-m'],
        ]);

        $filters = $request->only(['search', 'status', 'pre_order_code', 'eta']);
        $eta = $request->filled('eta') ? Carbon::createFromFormat('!Y-m', $filters['eta']) : null;
        $status = OrderStatus::tryFrom($request->string('status')->toString());
        $orders = Order::query()
            ->with([
                'user' => fn ($query) => $query->withTrashed()->select('id', 'name', 'email'),
                'items' => fn ($query) => $query->orderBy('id'),
                'items.book' => fn ($query) => $query->withTrashed(),
                'items.book.images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
                'shipments' => fn ($query) => $query->latest('created_at')->latest('id'),
            ])
            ->withMin(['items as preorder_estimated_date' => fn ($query) => $query->where('sale_type', BookSaleType::Preorder)], 'preorder_estimated_date')
            ->withCasts(['preorder_estimated_date' => 'date'])
            ->search($request->string('search')->toString())
            ->status($status)
            ->when($request->filled('pre_order_code'), fn ($query) => $query
                ->whereHas('items', fn ($items) => $items
                    ->where('sale_type', BookSaleType::Preorder)
                    ->whereIn('book_id', Book::withTrashed()->select('id')
                        ->whereHas('preOrderCode', fn ($codes) => $codes->where('code', 'like', '%'.$filters['pre_order_code'].'%')))))
            ->when($eta, fn ($query, $month) => $query->whereIn('id', OrderItem::query()
                ->select('order_id')
                ->where('sale_type', BookSaleType::Preorder)
                ->groupBy('order_id')
                ->havingRaw('MIN(preorder_estimated_date) BETWEEN ? AND ?', [
                    $month->toDateString(), $month->copy()->endOfMonth()->toDateString(),
                ])))
            ->latest()
            ->paginate(15)
            ->appends($filters);

        return Inertia::render('admin/orders/index', [
            'orders' => OrderResource::collection($orders),
            'filters' => $filters,
            'eta_months' => OrderItem::query()
                ->where('sale_type', BookSaleType::Preorder)
                ->whereNotNull('preorder_estimated_date')
                ->distinct()
                ->orderBy('preorder_estimated_date')
                ->pluck('preorder_estimated_date')
                ->map(fn ($date) => Carbon::parse($date)->format('Y-m'))
                ->unique()->values(),
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $order->load([
            'user', 'items', 'shippingAddress', 'voucher', 'voucherUsage',
            'walletTransactions' => fn ($query) => $query->oldest(),
            'statusHistories.changedBy',
            'stockMovements.book', 'stockMovements.changedBy',
            'shipments.items.orderItem',
            'shipments.statusHistories' => fn ($query) => $query->orderBy('occurred_at')->orderBy('created_at'),
        ]);

        return Inertia::render('admin/orders/show', [
            'order' => (new OrderDetailResource($order))->resolve($request),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $this->statusService->update($order, OrderStatus::from($request->validated('status')), $request->validated('note'), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status order berhasil diperbarui.']);

        return back();
    }

    public function updateShippingCost(UpdateOrderShippingCostRequest $request, Order $order): RedirectResponse
    {
        DB::transaction(function () use ($request, $order): void {
            $order = Order::lockForUpdate()->findOrFail($order->id);
            $shipments = $order->shipments()->lockForUpdate()->get();
            if ($order->payment_status !== PaymentStatus::Unpaid
                || $order->status === OrderStatus::Cancelled
                || (int) str_replace('.', '', $order->wallet_amount) !== 0
                || $order->walletTransactions()->whereIn('type', [WalletTransactionType::OrderPayment, WalletTransactionType::OrderRefund])->exists()
                || $shipments->contains(fn ($shipment) => $shipment->status !== ShipmentStatus::Pending
                    || $shipment->biteship_order_id !== null || $shipment->tracking_id !== null
                    || $shipment->waybill_id !== null || $shipment->courier_link !== null
                    || $shipment->biteship_status !== null)) {
                throw ValidationException::withMessages(['shipping_cost' => 'Ongkir hanya dapat diubah sebelum pembayaran dan pengiriman diproses.']);
            }

            [$whole, $fraction] = array_pad(explode('.', (string) $request->validated('shipping_cost')), 2, '');
            $shippingCents = (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
            $totalCents = (int) str_replace('.', '', $order->subtotal)
                - (int) str_replace('.', '', $order->voucher_discount) + $shippingCents;
            if ($totalCents < 0 || $totalCents > 999999999999999) {
                throw ValidationException::withMessages(['shipping_cost' => 'Total order berada di luar batas nominal yang diperbolehkan.']);
            }

            $formatMoney = fn (int $cents): string => sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
            $order->update([
                'shipping_cost' => $formatMoney($shippingCents),
                'total' => $formatMoney($totalCents),
            ]);
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ongkir order berhasil diperbarui.']);

        return back();
    }
}
