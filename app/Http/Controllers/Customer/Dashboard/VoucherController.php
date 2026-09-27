<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Customer\Dashboard\VoucherListService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function __construct(private readonly VoucherListService $service) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100']]);

        return Inertia::render('customer/dashboard/vouchers/index', [
            'vouchers' => $this->service->paginate($user, $filters),
            'filters' => $filters,
        ]);
    }
}
