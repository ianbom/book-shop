<?php

namespace App\Http\Responses;

use App\Enums\UserRole;
use Laravel\Fortify\Http\Responses\RedirectAsIntended;

class RoleAwareRedirectAsIntended extends RedirectAsIntended
{
    public function toResponse($request)
    {
        if ($request->user()?->role !== UserRole::Admin) {
            $request->session()->forget('url.intended');

            return redirect()->route('home');
        }

        return parent::toResponse($request);
    }
}
