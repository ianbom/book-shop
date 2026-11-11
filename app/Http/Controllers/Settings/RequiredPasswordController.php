<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\RequiredPasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class RequiredPasswordController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        return $request->user()->must_change_password
            ? Inertia::render('auth/change-password', ['passwordRules' => Password::defaults()->toPasswordRulesString()])
            : to_route('home');
    }

    public function update(RequiredPasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->forceFill(['password' => $request->validated('password'), 'must_change_password' => false])->save();
        $request->session()->regenerate();

        return to_route('home');
    }
}
