<?php

namespace App\Http\Responses;

use App\Enums\UserRole;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class RoleAwareVerifyEmailResponse implements VerifyEmailResponse
{
    public function toResponse($request): Response
    {
        if ($request->user()?->role !== UserRole::Admin) {
            $request->session()->forget('url.intended');

            return $request->wantsJson()
                ? new JsonResponse('', 204)
                : redirect()->route('home', ['verified' => 1]);
        }

        return $request->wantsJson()
            ? new JsonResponse('', 204)
            : redirect()->intended(Fortify::redirects('email-verification').'?verified=1');
    }
}
