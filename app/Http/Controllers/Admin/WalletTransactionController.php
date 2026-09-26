<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\WalletTransactionResource;
use App\Services\Admin\WalletTransactionListService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WalletTransactionController extends Controller
{
    public function __construct(private readonly WalletTransactionListService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(WalletTransactionType::class)],
            'direction' => ['nullable', Rule::enum(WalletTransactionDirection::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', Rule::in(WalletTransactionListService::SORTS)],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return Inertia::render('admin/wallet-transactions/index', [
            'transactions' => WalletTransactionResource::collection($this->service->paginate($filters)),
            'filters' => $filters,
        ]);
    }
}
