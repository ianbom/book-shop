<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TopupStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewWalletTopupRequest;
use App\Http\Resources\Admin\WalletTopupResource;
use App\Models\WalletTopup;
use App\Services\Admin\WalletTopupListService;
use App\Services\Admin\WalletTopupReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WalletTopupController extends Controller
{
    public function __construct(private readonly WalletTopupListService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(TopupStatus::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', Rule::in(WalletTopupListService::SORTS)],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return Inertia::render('admin/top-ups/index', [
            'topups' => WalletTopupResource::collection($this->service->paginate($filters)),
            'filters' => $filters,
        ]);
    }

    public function proof(WalletTopup $walletTopup): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($walletTopup->proof_image_path), 404);

        return Storage::disk('local')->response($walletTopup->proof_image_path, $walletTopup->topup_code, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function review(ReviewWalletTopupRequest $request, WalletTopup $walletTopup, WalletTopupReviewService $service): RedirectResponse
    {
        $service->review($walletTopup, $request->validated(), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permintaan top-up berhasil diproses.']);

        return back();
    }
}
