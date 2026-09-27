<?php

namespace App\Services\Admin;

use App\Enums\BookSaleType;
use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Enums\TopupStatus;
use App\Enums\UserRole;
use App\Enums\WalletTransactionType;
use App\Models\Book;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\VoucherUsage;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardDataService
{
    /** @return array<string, mixed> */
    public function data(int $period): array
    {
        $today = Carbon::today();
        $start = $today->copy()->subDays($period - 1);
        $end = $today->copy()->endOfDay();
        $risk = Book::query()->where('is_active', true)->where('sale_type', BookSaleType::ReadyStock)->where('stock', '<=', 5);
        $lowStock = (clone $risk)->orderBy('stock')->orderBy('id')->limit(6)->get(['id', 'title', 'author', 'stock']);
        $pendingOrders = Order::query()->where('status', OrderStatus::Pending)->count();

        $daily = DB::table('orders')->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) AS day, COUNT(*) AS total')
            ->groupByRaw('DATE(created_at)')->pluck('total', 'day');
        $days = [];
        for ($offset = 0; $offset < $period; $offset++) {
            $date = $start->copy()->addDays($offset)->toDateString();
            $days[] = ['date' => $date, 'count' => (int) ($daily[$date] ?? 0)];
        }
        $previousTotal = Order::query()->whereBetween('created_at', [
            $start->copy()->subDays($period), $start->copy()->subSecond(),
        ])->count();
        $statusTotals = DB::table('orders')->whereBetween('created_at', [$start, $end])
            ->selectRaw('status, COUNT(*) AS total')->groupBy('status')->pluck('total', 'status');
        $statuses = [
            OrderStatus::Pending, OrderStatus::WaitingPreorder, OrderStatus::Processing,
            OrderStatus::Packing, OrderStatus::Shipping, OrderStatus::Completed,
            OrderStatus::Cancelled,
        ];

        return [
            'operational' => [
                'orders_to_process' => Order::query()->whereIn('status', [
                    OrderStatus::Pending, OrderStatus::Processing, OrderStatus::Packing,
                ])->count(),
                'pending_orders' => $pendingOrders,
                'pending_topups' => WalletTopup::query()->where('status', TopupStatus::Pending)->count(),
                'pending_shipments' => Shipment::query()->where('status', ShipmentStatus::Pending)
                    ->whereHas('order', fn ($query) => $query->where('status', '!=', OrderStatus::Cancelled))->count(),
                'risky_stock' => (clone $risk)->count(),
            ],
            'finance' => $this->finance(),
            'trend' => [
                'days' => $days,
                'total' => array_sum(array_column($days, 'count')),
                'previous_total' => $previousTotal,
            ],
            'statusCounts' => array_map(fn (OrderStatus $status) => [
                'status' => $status->value,
                'count' => (int) ($statusTotals[$status->value] ?? 0),
            ], $statuses),
            'recentOrders' => Order::query()->with(['user:id,name', 'items:id,order_id,name,quantity'])
                ->latest()->limit(8)->get()->map(fn (Order $order) => [
                    'id' => $order->id,
                    'order_code' => $order->order_code,
                    'customer_name' => $order->user?->name ?? 'Customer',
                    'item_summary' => $order->items->first()?->name ?? 'Buku',
                    'quantity' => $order->items->sum('quantity'),
                    'total' => $order->total,
                    'status' => $order->status->value,
                    'created_at' => $order->created_at?->toISOString(),
                ])->all(),
            'actions' => ['low_stock_books' => $lowStock->toArray()],
        ];
    }

    /** @return array<string, string> */
    private function finance(): array
    {
        $customerTransactions = fn () => WalletTransaction::query()->whereHas('wallet.user',
            fn ($query) => $query->where('role', UserRole::Customer));
        $payments = $customerTransactions()->where('type', WalletTransactionType::OrderPayment);
        $gross = (float) (clone $payments)->sum('amount');
        $perOrder = (clone $payments)->select('order_id')->selectRaw('SUM(amount) AS amount')->groupBy('order_id');
        $shippingByOrder = Shipment::query()->select('order_id')->selectRaw('SUM(price) AS amount')->groupBy('order_id');
        $shipping = (float) DB::query()->fromSub($perOrder->toBase(), 'payments')
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->leftJoinSub($shippingByOrder->toBase(), 'shipments', 'shipments.order_id', '=', 'payments.order_id')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.amount < COALESCE(shipments.amount, orders.shipping_cost) THEN payments.amount ELSE COALESCE(shipments.amount, orders.shipping_cost) END), 0) AS total')
            ->value('total');
        $money = fn (float $amount): string => number_format($amount, 2, '.', '');

        return [
            'customer_wallet_balance' => $money((float) Wallet::query()->whereHas('user',
                fn ($query) => $query->where('role', UserRole::Customer))->sum('balance')),
            'gross_order_payments' => $money($gross),
            'refunds' => $money((float) $customerTransactions()->where('type', WalletTransactionType::OrderRefund)->sum('amount')),
            'book_spend' => $money(max(0, $gross - $shipping)),
            'shipping_spend' => $money($shipping),
            'voucher_discounts' => $money((float) VoucherUsage::query()
                ->whereHas('order', fn ($query) => $query->where('status', '!=', OrderStatus::Cancelled))
                ->sum('discount_amount')),
        ];
    }
}
