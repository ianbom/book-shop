<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Payments\StorePaymentProofRequest;
use App\Models\Order;
use App\Models\PaymentProof;
use App\Services\Admin\PaymentProofService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class PaymentProofController extends Controller
{
    public function __construct(private readonly PaymentProofService $service) {}

    public function store(StorePaymentProofRequest $request, Order $order): RedirectResponse
    {
        $this->service->create($order, $request->file('image'), $request->safe()->except('image'), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bukti pembayaran berhasil diunggah.']);

        return back();
    }

    public function destroy(Order $order, PaymentProof $paymentProof): RedirectResponse
    {
        abort_unless($paymentProof->order_id === $order->id, 404);
        $this->service->delete($paymentProof);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bukti pembayaran berhasil dihapus.']);

        return back();
    }
}
