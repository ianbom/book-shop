<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderPaymentSubmission;
use App\Models\User;
use App\Services\Customer\OrderSettlementService;
use App\Support\OrderImportMoney;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderPaymentReviewService
{
    public function __construct(private readonly OrderSettlementService $settlement) {}

    /** @param array<string, mixed> $data */
    public function review(OrderPaymentSubmission $submission, User $admin, array $data): OrderPaymentSubmission
    {
        abort_unless($admin->role->value === 'admin' && ! $admin->trashed(), 403);
        $data = Validator::make($data, [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:2000'],
        ])->validate();

        return DB::transaction(function () use ($submission, $admin, $data): OrderPaymentSubmission {
            $order = Order::query()->lockForUpdate()->findOrFail($submission->order_id);
            $submission = $order->paymentSubmissions()->lockForUpdate()->findOrFail($submission->id);
            if ($submission->status !== 'pending') {
                if ($submission->status === $data['status'] && ($submission->reason ?? '') === ($data['reason'] ?? '')) {
                    return $submission;
                }
                throw ValidationException::withMessages(['status' => 'Pengajuan telah diperiksa; keputusan tidak dapat diubah.']);
            }
            if (! $order->isImported() || $order->isArchivedImport() || ! $order->shipping_selected_at
                || ! in_array($order->status, [OrderStatus::Pending, OrderStatus::WaitingPreorder, OrderStatus::Processing, OrderStatus::Packing], true)) {
                throw ValidationException::withMessages(['status' => 'Pesanan tidak dapat menerima pemeriksaan pembayaran.']);
            }
            if ($data['status'] === 'approved') {
                $summary = $this->settlement->summary($order);
                if ($order->payment_status !== PaymentStatus::Unpaid || $submission->amount !== $summary['outstanding']
                    || OrderImportMoney::cents($submission->amount) === 0
                    || ! hash_equals($submission->billing_fingerprint, $this->settlement->fingerprint($order))) {
                    throw ValidationException::withMessages(['status' => 'Nominal atau snapshot tagihan berubah. Tolak pengajuan dan minta customer memeriksa ulang.']);
                }
                $order->update(['payment_status' => PaymentStatus::Paid]);
            }
            $submission->update([
                'status' => $data['status'], 'pending_slot' => null, 'reviewed_by' => $admin->id,
                'reviewed_at' => now(), 'reason' => $data['reason'] ?? null,
            ]);
            $order->statusHistories()->create([
                'status' => $order->status, 'changed_by' => $admin->id,
                'note' => 'Pengajuan transfer #'.$submission->id.($data['status'] === 'approved' ? ' disetujui.' : ' ditolak.'),
            ]);

            return $submission->refresh();
        }, 3);
    }
}
