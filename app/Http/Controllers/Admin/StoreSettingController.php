<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Settings\UpdateStoreSettingRequest;
use App\Http\Resources\Admin\StoreSettingResource;
use App\Models\StoreSetting;
use App\Services\Admin\StoreSettingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingController extends Controller
{
    public function __construct(private readonly StoreSettingService $service) {}

    public function edit(): Response
    {
        $setting = StoreSetting::withTrashed()->find(1);

        return Inertia::render('admin/settings/index', [
            'setting' => $setting ? new StoreSettingResource($setting) : null,
        ]);
    }

    public function update(UpdateStoreSettingRequest $request): RedirectResponse
    {
        $this->service->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan toko berhasil diperbarui.']);

        return back();
    }
}
