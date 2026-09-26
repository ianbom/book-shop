<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TopupStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\WalletTopupResource;
use App\Services\Admin\WalletTopupListService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

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
}
