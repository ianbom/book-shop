<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\OrderSettlementRequest;
use App\Models\Order;
use App\Services\Customer\OrderSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class OrderSettlementController extends Controller
{
    public function rates(OrderSettlementRequest $request, Order $order, OrderSettlementService $service): JsonResponse
    {
        $order = $request->user()->orders()->findOrFail($order->id);
        $address = $request->user()->addresses()->findOrFail($request->validated('address_id'));

        return response()->json(['rates' => $service->rates($order, $address)]);
    }

    public function shipping(OrderSettlementRequest $request, Order $order, OrderSettlementService $service): RedirectResponse
    {
        $order = $request->user()->orders()->findOrFail($order->id);
        $service->selectShipping($order, $request->user(), $request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengiriman dipilih. Booking dilakukan setelah pelunasan disetujui.']);

        return back();
    }

    public function store(OrderSettlementRequest $request, Order $order, OrderSettlementService $service): RedirectResponse
    {
        $order = $request->user()->orders()->findOrFail($order->id);
        $service->submit($order, $request->user(), $request->safe()->except('proof'), $request->file('proof'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bukti transfer menunggu pemeriksaan admin.']);

        return back();
    }
}
