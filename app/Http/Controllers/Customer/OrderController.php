<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreOrderRequest;
use App\Services\Customer\OrderService;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, OrderService $service): Response
    {
        $result = $service->create($request->validated());

        return Inertia::location($result['whatsapp_url']);
    }
}
