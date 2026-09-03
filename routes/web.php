<?php

use App\Http\Controllers\Admin\BookController;
use App\Http\Controllers\Admin\BookImageController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PaymentProofController;
use App\Http\Controllers\Admin\StoreSettingController;
use App\Http\Controllers\Customer\BookController as CustomerBookController;
use App\Http\Controllers\Customer\HomeController;
use App\Http\Controllers\Customer\OrderController as CustomerOrderController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('books', [CustomerBookController::class, 'index'])->name('books.index');
Route::post('orders', [CustomerOrderController::class, 'store'])->name('orders.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('dashboard', '/admin')->name('dashboard');

    Route::prefix('admin')->as('admin.')->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');
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
        Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
        Route::patch('orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus'])->name('orders.payment-status');
        Route::post('orders/{order}/payment-proofs', [PaymentProofController::class, 'store'])->name('orders.payment-proofs.store');
        Route::delete('orders/{order}/payment-proofs/{paymentProof}', [PaymentProofController::class, 'destroy'])->name('orders.payment-proofs.destroy');

        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('inventory/adjustments', [InventoryController::class, 'store'])->name('inventory.adjustments.store');
        Route::get('inventory/history', [InventoryController::class, 'history'])->name('inventory.history');

        Route::get('settings', [StoreSettingController::class, 'edit'])->name('settings.edit');
        Route::patch('settings', [StoreSettingController::class, 'update'])->name('settings.update');
    });
});

require __DIR__.'/settings.php';
