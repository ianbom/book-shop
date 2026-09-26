<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ShipmentDeliveryType;
use App\Enums\ShipmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\ShipmentResource;
use App\Services\Admin\ShipmentListService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShipmentController extends Controller
{
    public function __construct(private readonly ShipmentListService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(ShipmentStatus::class)],
            'delivery_type' => ['nullable', Rule::enum(ShipmentDeliveryType::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', Rule::in(ShipmentListService::SORTS)],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return Inertia::render('admin/shipments/index', [
            'shipments' => ShipmentResource::collection($this->service->paginate($filters)),
            'filters' => $filters,
        ]);
    }
}
