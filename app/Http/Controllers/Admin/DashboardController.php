<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardDataService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardDataService $dashboard) {}

    public function __invoke(Request $request): Response
    {
        $filters = $request->validate(['period' => ['nullable', 'integer', Rule::in([7, 30])]]);
        $period = (int) ($filters['period'] ?? 30);

        return Inertia::render('admin/dashboard', [
            'period' => $period,
            ...$this->dashboard->data($period),
        ]);
    }
}
