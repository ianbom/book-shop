<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Orders\UpdateOrderShippingCostRequest;
use App\Http\Requests\Admin\Orders\UpdateOrderStatusRequest;
use App\Http\Requests\Admin\Orders\UpdatePaymentStatusRequest;
use App\Http\Resources\Admin\OrderDetailResource;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Order;
use App\Services\Admin\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderStatusService $statusService) {}

    public function index(Request $request): Response
    {
        $status = OrderStatus::tryFrom($request->string('status')->toString());
        $paymentStatus = PaymentStatus::tryFrom($request->string('payment')->toString());
        $orders = Order::query()
            ->search($request->string('search')->toString())
            ->status($status)
            ->paymentStatus($paymentStatus)
            ->when($request->date('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($request->date('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => OrderResource::collection($orders),
            'filters' => $request->only(['search', 'status', 'payment', 'date_from', 'date_to']),
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

    public function updatePaymentStatus(UpdatePaymentStatusRequest $request, Order $order): RedirectResponse
    {
        $order->update(['payment_status' => PaymentStatus::from($request->validated('payment_status'))]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status pembayaran berhasil diperbarui.']);

        return back();
    }

    public function updateShippingCost(UpdateOrderShippingCostRequest $request, Order $order): RedirectResponse
    {
        $shippingCost = $request->validated('shipping_cost');

        $order->update([
            'shipping_cost' => $shippingCost,
            'total' => number_format((float) $order->subtotal + (float) $shippingCost, 2, '.', ''),
        ]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ongkir order berhasil diperbarui.']);

        return back();
    }
}
