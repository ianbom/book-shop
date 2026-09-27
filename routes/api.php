<?php

use App\Http\Controllers\BiteshipWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('webhooks/biteship', BiteshipWebhookController::class)->name('webhooks.biteship');