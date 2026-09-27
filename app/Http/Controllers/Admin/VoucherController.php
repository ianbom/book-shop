<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VoucherType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Vouchers\SaveVoucherRequest;
use App\Http\Resources\Admin\VoucherResource;
use App\Models\Voucher;
use App\Services\Admin\VoucherListService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function __construct(private readonly VoucherListService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(VoucherType::class)],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'scheduled', 'expired'])],
            'sort' => ['nullable', Rule::in(VoucherListService::SORTS)],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return Inertia::render('admin/vouchers/index', [
            'vouchers' => VoucherResource::collection($this->service->paginate($filters)),
            'filters' => $filters,
        ]);
    }

    public function store(SaveVoucherRequest $request): RedirectResponse
    {
        Voucher::create([...$request->validated(), 'created_by' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Voucher berhasil ditambahkan.']);

        return back();
    }

    public function update(SaveVoucherRequest $request, Voucher $voucher): RedirectResponse
    {
        $voucher->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Voucher berhasil diperbarui.']);

        return back();
    }
}
