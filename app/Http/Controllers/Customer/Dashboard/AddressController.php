<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\SaveAddressRequest;
use App\Models\User;
use App\Services\Customer\AddressLookup;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use RuntimeException;

class AddressController extends Controller
{
    public function areas(Request $request, AddressLookup $lookup): JsonResponse
    {
        $data = $request->validate(['postal_code' => ['required', 'regex:/^[0-9]{5}$/']]);

        try {
            return response()->json(['areas' => $lookup->areas($data['postal_code'])]);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function mapCenter(Request $request, AddressLookup $lookup): JsonResponse
    {
        $data = $request->validate([
            'postal_code' => ['required', 'regex:/^[0-9]{5}$/'],
            'area_id' => ['required', 'string', 'max:150'],
        ]);

        try {
            if (! collect($lookup->areas($data['postal_code']))->firstWhere('id', $data['area_id'])) {
                return response()->json(['message' => 'Area tidak sesuai kode pos.'], 422);
            }

            return response()->json(['center' => $lookup->mapCenter($data['postal_code'])]);
        } catch (LockTimeoutException|RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function save(SaveAddressRequest $request, AddressLookup $lookup): RedirectResponse
    {
        $data = $request->validated();
        try {
            $area = collect($lookup->areas($data['destination_postal_code']))
                ->firstWhere('id', $data['destination_area_id']);
        } catch (RuntimeException) {
            throw ValidationException::withMessages(['destination_postal_code' => 'Kode pos belum dapat diverifikasi. Coba lagi nanti.']);
        }

        if (! $area) {
            throw ValidationException::withMessages(['destination_area_id' => 'Pilih area yang sesuai kode pos.']);
        }

        DB::transaction(function () use ($request, $data, $area): void {
            User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $addresses = $request->user()->addresses();
            $address = $addresses->orderByDesc('is_default')->orderByDesc('id')->first()
                ?? $addresses->make();
            $request->user()->addresses()->where('is_default', true)->update(['is_default' => false]);
            $address->fill(array_merge($data, [
                'province_name' => $area['province'],
                'city_name' => $area['city'],
                'district_name' => $area['district'],
                'destination_location_id' => null,
                'is_default' => true,
            ]));
            $address->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Alamat berhasil disimpan.']);

        if ($request->user()->role === UserRole::Customer && $request->query('return_to') === 'cart') {
            return to_route('customer.dashboard.carts.index');
        }

        return $request->user()->role === UserRole::Admin
            ? to_route('admin.profile')
            : to_route('customer.dashboard.profile');
    }
}
