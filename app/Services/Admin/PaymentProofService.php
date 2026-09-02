<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaymentProofService
{
    /** @param array{payment_amount?: float|string|null, paid_at?: string|null, note?: string|null} $data */
    public function create(Order $order, UploadedFile $image, array $data, User $admin): PaymentProof
    {
        $path = $image->storeAs('payment-proofs', Str::ulid().'.'.$image->extension(), 'public');

        return $order->paymentProofs()->create([
            ...$data,
            'image_path' => $path,
            'uploaded_by' => $admin->id,
        ]);
    }

    public function delete(PaymentProof $proof): void
    {
        $proof->delete();
    }

    public function url(PaymentProof $proof): string
    {
        return Storage::disk('public')->url($proof->image_path);
    }
}
