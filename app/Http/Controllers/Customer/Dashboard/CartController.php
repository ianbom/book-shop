<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Customer\CartListService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __invoke(Request $request, CartListService $cartListService): Response
    {
        return Inertia::render('customer/dashboard/carts/index', $cartListService->get($request->user()));
    }
}
