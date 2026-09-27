<?php

namespace App\Services\Customer;

use App\Enums\TopupStatus;
use App\Models\User;
use App\Models\WalletTopup;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class WalletTopupService
{
    public function create(User $user, int $amount, UploadedFile $proof): WalletTopup
    {
        $path = $proof->storeAs('topups', Str::ulid().'.'.$proof->extension(), 'local');
        if ($path === false) {
            throw new RuntimeException('Bukti transfer gagal disimpan.');
        }

        try {
            return $user->walletTopups()->create([
                'topup_code' => 'TOP-'.Str::ulid(),
                'requested_amount' => $amount,
                'proof_image_path' => $path,
                'status' => TopupStatus::Pending,
            ]);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);

            throw $exception;
        }
    }
}
