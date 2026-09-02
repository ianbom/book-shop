<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Orders\UpdateOrderStatusRequest;
use App\Http\Requests\Admin\Orders\UpdatePaymentStatusRequest;
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
            'book',
            'paymentProofs.uploadedBy',
            'statusHistories' => fn ($query) => $query->with('changedBy')->oldest(),
            'stockMovements' => fn ($query) => $query->with(['book', 'order', 'changedBy'])->latest(),
        ]);

        return Inertia::render('admin/orders/show', ['order' => (new OrderResource($order))->resolve($request)]);
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
}
