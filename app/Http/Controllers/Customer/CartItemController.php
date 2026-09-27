<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\AddCartItemRequest;
use App\Services\Customer\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartItemController extends Controller
{
    public function update(Request $request, int $cartItem, CartService $cartService): RedirectResponse
    {
        $quantity = $request->validate(['quantity' => ['required', 'integer', 'min:1']])['quantity'];
        $cartService->update($request->user(), $cartItem, (int) $quantity);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jumlah buku diperbarui.']);

        return back();
    }

    public function destroy(Request $request, int $cartItem, CartService $cartService): RedirectResponse
    {
        $cartService->remove($request->user(), $cartItem);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Buku dihapus dari keranjang.']);

        return back();
    }

    public function store(AddCartItemRequest $request, CartService $cartService): RedirectResponse
    {
        $cartService->add($request->user(), (int) $request->validated('book_id'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Buku berhasil dimasukkan ke keranjang.']);

        return back();
    }
}
