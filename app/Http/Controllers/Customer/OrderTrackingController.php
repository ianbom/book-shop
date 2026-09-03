<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\OrderTrackingResource;
use App\Models\Order;
use App\Services\Customer\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class OrderTrackingController extends Controller
{
    public function __construct(private readonly WhatsAppService $whatsApp) {}

    public function index(): InertiaResponse
    {
        return Inertia::render('customer/track-order/index');
    }

    public function show(Request $request, string $orderCode): Response
    {
        $order = Order::query()
            ->where('order_code', Str::upper(trim($orderCode)))
            ->with(['statusHistories' => fn ($query) => $query->oldest()])
            ->first();

        if (! $order) {
            return Inertia::render('customer/track-order/show', [
                'order' => null,
                'error' => 'Pesanan tidak ditemukan. Periksa kembali kode order Anda.',
            ])->toResponse($request)->setStatusCode(Response::HTTP_NOT_FOUND);
        }

        return Inertia::render('customer/track-order/show', [
            'order' => [
                ...(new OrderTrackingResource($order))->resolve($request),
                'whatsapp_url' => $this->whatsAppUrl($order->order_code),
            ],
            'error' => null,
        ])->toResponse($request);
    }

    private function whatsAppUrl(string $orderCode): ?string
    {
        $number = $this->whatsApp->storeNumber();

        if (! $number) {
            return null;
        }

        return $this->whatsApp->url($number, implode("\n", [
            'Halo Admin Wonder Book,',
            '',
            "Saya ingin menanyakan status pesanan dengan kode order: {$orderCode}.",
        ]));
    }
}
