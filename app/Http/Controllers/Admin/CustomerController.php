<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CustomerResource;
use App\Services\Admin\CustomerListService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerListService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'verification_status' => ['nullable', Rule::in(['verified', 'unverified'])],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', Rule::in(CustomerListService::SORTS)],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return Inertia::render('admin/customers/index', [
            'customers' => CustomerResource::collection($this->service->paginate($filters)),
            'filters' => $filters,
        ]);
    }
}
