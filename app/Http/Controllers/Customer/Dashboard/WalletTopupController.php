<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreWalletTopupRequest;
use App\Services\Customer\WalletTopupService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class WalletTopupController extends Controller
{
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
