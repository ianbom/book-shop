<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Customer\Dashboard\WalletListService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function __construct(private readonly WalletListService $service) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(WalletTransactionType::class)],
            'direction' => ['nullable', Rule::enum(WalletTransactionDirection::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);
        $data = $this->service->paginate($user, $filters);

        return Inertia::render('customer/dashboard/wallets/index', [
            ...$data,
            'filters' => $filters,
        ]);
    }
}
