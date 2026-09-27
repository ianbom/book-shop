<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdateCustomerProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('customer/dashboard/profile', [
            'profilePhotoUrl' => $request->user()->profile_photo_path
                ? Storage::disk('public')->url($request->user()->profile_photo_path)
                : null,
            'address' => $request->user()->addresses()
                ->orderByDesc('is_default')
                ->orderByDesc('id')
                ->first()?->only([
                    'label', 'destination_contact_name', 'destination_contact_phone',
                    'destination_contact_email', 'destination_address', 'destination_note',
                    'destination_postal_code', 'destination_area_id', 'destination_latitude',
                    'destination_longitude', 'province_name', 'city_name', 'district_name',
                    'subdistrict_name',
                ]),
        ]);
    }

    public function update(UpdateCustomerProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $oldPhotoPath = $user->profile_photo_path;
        $newPhotoPath = null;

        if ($request->hasFile('profile_photo')) {
            $newPhotoPath = $request->file('profile_photo')->store("profile-photos/{$user->id}", 'public');

            if ($newPhotoPath === false) {
                throw new \RuntimeException('Foto profil gagal disimpan.');
            }
        }

        $user->phone = $validated['phone'] ?? null;
        if ($newPhotoPath !== null) {
            $user->profile_photo_path = $newPhotoPath;
        }
        $user->save();

        if ($newPhotoPath !== null && $oldPhotoPath !== null) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Profil berhasil diperbarui.']);

        return $user->role === UserRole::Admin
            ? to_route('admin.profile')
            : to_route('customer.dashboard.profile');
    }
}
