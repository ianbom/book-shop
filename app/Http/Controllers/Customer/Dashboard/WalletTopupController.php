<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreWalletTopupRequest;
use App\Services\Customer\WalletTopupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WalletTopupController extends Controller
{
    public function proof(Request $request, int $walletTopup): StreamedResponse
    {
        $topup = $request->user()->walletTopups()->findOrFail($walletTopup);
        abort_unless(Storage::disk('local')->exists($topup->proof_image_path), 404);

        return Storage::disk('local')->response($topup->proof_image_path, $topup->topup_code, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function __invoke(StoreWalletTopupRequest $request, WalletTopupService $service): RedirectResponse
    {
        $topup = $service->create(
            $request->user(),
            (int) $request->validated('requested_amount'),
            $request->file('proof_image'),
        );
        Inertia::flash('toast', ['type' => 'success', 'message' => "Pengajuan {$topup->topup_code} menunggu verifikasi admin. Saldo belum bertambah."]);

        return to_route('customer.dashboard.wallets.index');
    }
}
