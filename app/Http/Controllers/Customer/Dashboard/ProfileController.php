<?php

namespace App\Http\Controllers\Customer\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('customer/dashboard/profile', [
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
}
