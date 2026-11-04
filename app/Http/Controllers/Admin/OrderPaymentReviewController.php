<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Orders\ReviewOrderPaymentRequest;
use App\Models\OrderPaymentSubmission;
use App\Services\Admin\OrderPaymentReviewService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class OrderPaymentReviewController extends Controller
{
    public function __invoke(ReviewOrderPaymentRequest $request, OrderPaymentSubmission $submission, OrderPaymentReviewService $service): RedirectResponse
    {
        $service->review($submission, $request->user(), $request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan transfer telah diperiksa.']);

        return back();
    }
}
