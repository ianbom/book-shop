<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    public function __construct(private readonly InventoryService $inventory, private readonly BiteshipBookingService $booking) {}

    public function update(Order $order, OrderStatus $nextStatus, ?string $note, User $admin): Order
    {
        return DB::transaction(function () use ($order, $nextStatus, $note, $admin): Order {
            $order = Order::lockForUpdate()->findOrFail($order->id);
            $currentStatus = $order->status;

            if ($currentStatus === $nextStatus) {
                throw ValidationException::withMessages(['status' => 'Status order tidak berubah.']);
            }

            if (! in_array($nextStatus, $this->transitions()[$currentStatus->value] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'Transisi status order tidak valid.']);
            }

            if ($nextStatus === OrderStatus::Shipping) {
                $shipments = $order->shipments()->lockForUpdate()->get();
                if ($shipments->isEmpty()) {
                    throw ValidationException::withMessages(['status' => 'Pengiriman belum tersedia.']);
                }
                foreach ($shipments as $shipment) {
                    $this->booking->book($order, $shipment);
                }
            }

            $order->update(['status' => $nextStatus]);
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => $nextStatus,
                'changed_by' => $admin->id,
                'note' => $note,
            ]);

            if ($nextStatus === OrderStatus::Cancelled) {
                $alreadyRestored = BookStockMovement::query()
                    ->where('order_id', $order->id)
                    ->where('type', StockMovementType::Cancellation)
                    ->exists();

                if ($alreadyRestored) {
                    throw ValidationException::withMessages(['status' => 'Stok order ini sudah pernah dikembalikan.']);
                }

                $this->inventory->restoreForCancellation($order, $admin);
                $this->refundWalletPayment($order, $admin);
            }

            return $order->refresh();
        });
    }

    private function refundWalletPayment(Order $order, User $admin): void
    {
        if ($order->payment_status === PaymentStatus::Unpaid) {
            return;
        }

        $toCents = fn (string $amount): int => (int) str_replace('.', '', $amount);
        $formatMoney = fn (int $cents): string => sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
        $chargedCents = $order->walletTransactions()
            ->where('type', WalletTransactionType::OrderPayment)
            ->get()
            ->sum(fn ($transaction) => $toCents($transaction->amount));
        $paymentCents = min($toCents($order->wallet_amount), $chargedCents);
        if ($paymentCents === 0) {
            throw ValidationException::withMessages(['status' => 'Transaksi pembayaran saldo tidak ditemukan; refund belum diproses.']);
        }
        $refundCents = $order->walletTransactions()
            ->where('type', WalletTransactionType::OrderRefund)
            ->get()
            ->sum(fn ($transaction) => $toCents($transaction->amount));
        if ($refundCents > $paymentCents) {
            throw ValidationException::withMessages(['status' => 'Jumlah refund melebihi pembayaran saldo.']);
        }
        $amountCents = $paymentCents - $refundCents;

        if ($amountCents === 0) {
            $order->update(['payment_status' => PaymentStatus::Refunded]);

            return;
        }

        $wallet = Wallet::query()->where('user_id', $order->user_id)->lockForUpdate()->first();
        if ($wallet === null) {
            throw ValidationException::withMessages(['status' => 'Wallet pelanggan tidak ditemukan; refund belum diproses.']);
        }
        $balanceBefore = $toCents($wallet->balance);
        $balanceAfter = $balanceBefore + $amountCents;
        if ($balanceAfter > 999999999999999) {
            throw ValidationException::withMessages(['status' => 'Saldo refund melebihi batas maksimum wallet.']);
        }
        $wallet->update(['balance' => $formatMoney($balanceAfter)]);
        $wallet->transactions()->create([
            'order_id' => $order->id,
            'created_by' => $admin->id,
            'type' => WalletTransactionType::OrderRefund,
            'direction' => WalletTransactionDirection::Credit,
            'amount' => $formatMoney($amountCents),
            'balance_before' => $formatMoney($balanceBefore),
            'balance_after' => $formatMoney($balanceAfter),
            'note' => 'Refund saldo karena order dibatalkan.',
        ]);
        $order->update(['payment_status' => PaymentStatus::Refunded]);
    }

    /** @return array<string, array<int, OrderStatus>> */
    private function transitions(): array
    {
        return [
            OrderStatus::Pending->value => [OrderStatus::Processing, OrderStatus::Cancelled],
            OrderStatus::WaitingPreorder->value => [OrderStatus::Processing, OrderStatus::Cancelled],
            OrderStatus::Processing->value => [OrderStatus::Packing],
            OrderStatus::Packing->value => [OrderStatus::Shipping],
            OrderStatus::Shipping->value => [OrderStatus::Completed],
        ];
    }
}
