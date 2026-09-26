<?php

namespace App\Http\Responses;

use App\Enums\UserRole;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class RoleAwareLoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $isCustomer = $request->user()?->getRawOriginal('role') === UserRole::Customer->value;

        if ($isCustomer) {
            $request->session()->forget('url.intended');
        }

        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => false]);
        }

        if ($isCustomer) {
            return redirect()->route('home');
        }

        return redirect()->intended(Fortify::redirects('login'));
    }
}
