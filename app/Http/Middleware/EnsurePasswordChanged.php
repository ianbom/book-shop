<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->must_change_password || $request->routeIs(
            'password.change', 'password.change.update', 'logout',
            'password.request', 'password.email', 'password.reset', 'password.update',
        )) {
            return $next($request);
        }

        return $request->expectsJson() || $request->is('api/*')
            ? response()->json(['code' => 'password_change_required', 'message' => 'Ganti password awal sebelum melanjutkan.'], 403)
            : redirect()->route('password.change');
    }
}
