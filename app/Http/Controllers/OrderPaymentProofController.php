<?php

namespace App\Http\Controllers;

use App\Models\OrderPaymentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderPaymentProofController extends Controller
{
    public function __invoke(Request $request, OrderPaymentSubmission $submission): StreamedResponse
    {
        $user = $request->user();
        abort_unless($user->role->value === 'admin' || ($user->role->value === 'customer' && $submission->order()->where('user_id', $user->id)->exists()), 404);
        $disk = Storage::disk('local');
        abort_unless($disk->exists($submission->proof_path), 404);
        $mime = $disk->mimeType($submission->proof_path);
        $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'application/pdf' => 'pdf'][$mime] ?? null;
        abort_unless($extension, 404);

        return $disk->response($submission->proof_path, 'transfer-'.$submission->id.'.'.$extension, [
            'Content-Type' => $mime,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ], $mime === 'application/pdf' ? 'attachment' : 'inline');
    }
}
