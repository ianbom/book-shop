<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('admin/profile/profile', [
            'profilePhotoUrl' => $user->profile_photo_path
                ? Storage::disk('public')->url($user->profile_photo_path)
                : null,
            'address' => $user->addresses()
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
}
