<?php

use App\Http\Controllers\Admin\BookController;
use App\Http\Controllers\Admin\BookImageController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\PaymentProofController;
use App\Http\Controllers\Admin\ShipmentController;
use App\Http\Controllers\Admin\StoreSettingController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\Admin\WalletTopupController;
use App\Http\Controllers\Admin\WalletTransactionController;
use App\Http\Controllers\BiteshipWebhookController;
use App\Http\Controllers\Customer\BookController as CustomerBookController;
use App\Http\Controllers\Customer\CartItemController;
use App\Http\Controllers\Customer\Dashboard\AddressController as CustomerDashboardAddressController;
use App\Http\Controllers\Customer\Dashboard\CartController as CustomerDashboardCartController;
use App\Http\Controllers\Customer\Dashboard\CheckoutController;
use App\Http\Controllers\Customer\Dashboard\OrderController as CustomerDashboardOrderController;
use App\Http\Controllers\Customer\Dashboard\ProfileController as CustomerDashboardProfileController;
use App\Http\Controllers\Customer\Dashboard\VoucherController as CustomerDashboardVoucherController;
use App\Http\Controllers\Customer\Dashboard\WalletController as CustomerDashboardWalletController;
use App\Http\Controllers\Customer\Dashboard\WalletTopupController as CustomerDashboardWalletTopupController;
use App\Http\Controllers\Customer\HomeController;
use App\Http\Controllers\Customer\OrderController as CustomerOrderController;
use App\Http\Controllers\Customer\OrderTrackingController;
use App\Http\Middleware\EnsureAdminRole;
use App\Http\Middleware\EnsureCustomerRole;
use Illuminate\Support\Facades\Route;



Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('books', [CustomerBookController::class, 'index'])->name('books.index');
Route::post('orders', [CustomerOrderController::class, 'store'])->name('orders.store');
Route::get('track-order', [OrderTrackingController::class, 'index'])->name('track-order.index');
Route::get('track-order/{orderCode}', [OrderTrackingController::class, 'show'])->name('track-order.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('cart/items', [CartItemController::class, 'store'])->name('cart.items.store');
    Route::patch('cart/items/{cartItem}', [CartItemController::class, 'update'])->middleware(EnsureCustomerRole::class)->name('cart.items.update');
    Route::delete('cart/items/{cartItem}', [CartItemController::class, 'destroy'])->middleware(EnsureCustomerRole::class)->name('cart.items.destroy');
    Route::redirect('dashboard', '/admin')->name('dashboard');

    Route::prefix('customer/dashboard')->as('customer.dashboard.')->middleware(EnsureCustomerRole::class)->group(function () {
        Route::get('profile', CustomerDashboardProfileController::class)->name('profile');
        Route::patch('profile', [CustomerDashboardProfileController::class, 'update'])->name('profile.update');
        Route::get('address/areas', [CustomerDashboardAddressController::class, 'areas'])->middleware('throttle:30,1')->name('address.areas');
        Route::get('address/map-center', [CustomerDashboardAddressController::class, 'mapCenter'])->middleware('throttle:30,1')->name('address.map-center');
        Route::put('address', [CustomerDashboardAddressController::class, 'save'])->name('address.save');
        Route::get('carts', CustomerDashboardCartController::class)->name('carts.index');
        Route::get('carts/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::get('carts/checkout/rates', [CheckoutController::class, 'rates'])->middleware('throttle:20,1')->name('checkout.rates');
        Route::post('carts/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
        Route::get('orders', CustomerDashboardOrderController::class)->name('orders.index');
        Route::patch('orders/{order}/cancel', [CustomerDashboardOrderController::class, 'cancel'])->name('orders.cancel');
        Route::get('orders/{order}', [CustomerDashboardOrderController::class, 'show'])->name('orders.show');
        Route::get('wallets', CustomerDashboardWalletController::class)->name('wallets.index');
        Route::post('wallets/top-ups', CustomerDashboardWalletTopupController::class)->name('wallets.topups.store');
        Route::get('vouchers', CustomerDashboardVoucherController::class)->name('vouchers.index');
    });

    Route::prefix('admin')->as('admin.')->middleware(EnsureAdminRole::class)->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');
        Route::get('profile', AdminProfileController::class)->name('profile');
        Route::patch('profile', [CustomerDashboardProfileController::class, 'update'])->name('profile.update');
        Route::get('profile/address/areas', [CustomerDashboardAddressController::class, 'areas'])->middleware('throttle:30,1')->name('profile.address.areas');
        Route::get('profile/address/map-center', [CustomerDashboardAddressController::class, 'mapCenter'])->middleware('throttle:30,1')->name('profile.address.map-center');
        Route::put('profile/address', [CustomerDashboardAddressController::class, 'save'])->name('profile.address.save');
        Route::resource('books', BookController::class);
        Route::patch('books/{book}/status', [BookController::class, 'updateStatus'])->name('books.status');
        Route::post('books/{book}/images', [BookImageController::class, 'store'])->name('books.images.store');
        Route::patch('books/{book}/images/{image}', [BookImageController::class, 'update'])->name('books.images.update');
        Route::put('books/{book}/images/order', [BookImageController::class, 'reorder'])->name('books.images.reorder');
        Route::delete('books/{book}/images/{image}', [BookImageController::class, 'destroy'])->name('books.images.destroy');

        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
        Route::get('shipments', [ShipmentController::class, 'index'])->name('shipments.index');
        Route::get('top-ups', [WalletTopupController::class, 'index'])->name('top-ups.index');
        Route::get('top-ups/{walletTopup}/proof', [WalletTopupController::class, 'proof'])->name('top-ups.proof');
        Route::patch('top-ups/{walletTopup}', [WalletTopupController::class, 'review'])->name('top-ups.review');
        Route::get('wallet-transactions', [WalletTransactionController::class, 'index'])->name('wallet-transactions.index');
        Route::get('vouchers', [VoucherController::class, 'index'])->name('vouchers.index');
        Route::post('vouchers', [VoucherController::class, 'store'])->name('vouchers.store');
        Route::patch('vouchers/{voucher}', [VoucherController::class, 'update'])->name('vouchers.update');
        Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
        Route::patch('orders/{order}/shipments/{shipment}/status', [ShipmentController::class, 'updateStatus'])->name('orders.shipments.status');
        Route::patch('orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus'])->name('orders.payment-status');
        Route::patch('orders/{order}/shipping-cost', [OrderController::class, 'updateShippingCost'])->name('orders.shipping-cost');
        Route::post('orders/{order}/payment-proofs', [PaymentProofController::class, 'store'])->name('orders.payment-proofs.store');
        Route::delete('orders/{order}/payment-proofs/{paymentProof}', [PaymentProofController::class, 'destroy'])->name('orders.payment-proofs.destroy');

        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('inventory/adjustments', [InventoryController::class, 'store'])->name('inventory.adjustments.store');
        Route::get('inventory/history', [InventoryController::class, 'history'])->name('inventory.history');

        Route::get('settings', [StoreSettingController::class, 'edit'])->name('settings.edit');
        Route::patch('settings', [StoreSettingController::class, 'update'])->name('settings.update');
        Route::get('settings/address/areas', [CustomerDashboardAddressController::class, 'areas'])->middleware('throttle:30,1')->name('settings.address.areas');
        Route::get('settings/address/map-center', [CustomerDashboardAddressController::class, 'mapCenter'])->middleware('throttle:30,1')->name('settings.address.map-center');
    });
});

require __DIR__.'/settings.php';
