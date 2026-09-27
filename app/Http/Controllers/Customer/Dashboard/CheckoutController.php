<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CheckoutRequest;
use App\Services\Customer\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly CheckoutService $service) {}

    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->addresses()->exists()) {
            return to_route('customer.dashboard.profile')->with('error', 'Simpan alamat sebelum checkout.');
        }
        if (! $request->user()->cart?->items()->exists()) {
            return to_route('customer.dashboard.carts.index');
        }

        return Inertia::render('customer/dashboard/carts/checkout', $this->service->page($request->user()));
    }

    public function rates(Request $request): JsonResponse
    {
        $data = $request->validate(['address_id' => ['required', 'integer']]);
        try {
            return response()->json(['rates' => $this->service->rates($request->user(), (int) $data['address_id'])]);
        } catch (ValidationException $exception) {
            return response()->json(['message' => collect($exception->errors())->flatten()->first()], 422);
        }
    }

    public function store(CheckoutRequest $request): RedirectResponse
    {
        $this->service->create($request->user(), $request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil dibuat.']);

        return to_route('customer.dashboard.orders.index');
    }
}
