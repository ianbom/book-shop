<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\BookResource;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Book;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $bookMetrics = Book::query()
            ->selectRaw('COUNT(*) as total_books')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_books')
            ->selectRaw('COALESCE(SUM(stock), 0) as total_stock')
            ->first();

        $orderMetrics = Order::query()
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_orders', [OrderStatus::Pending->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as packing_orders', [OrderStatus::Packing->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as shipping_orders', [OrderStatus::Shipping->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_orders', [OrderStatus::Completed->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_orders', [OrderStatus::Cancelled->value])
            ->selectRaw('SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) as unpaid_orders', [PaymentStatus::Unpaid->value])
            ->selectRaw('SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) as paid_orders', [PaymentStatus::Paid->value])
            ->first();

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'total_books' => (int) $bookMetrics?->total_books,
                'active_books' => (int) $bookMetrics?->active_books,
                'total_stock' => (int) $bookMetrics?->total_stock,
                'total_orders' => (int) $orderMetrics?->total_orders,
                'pending_orders' => (int) $orderMetrics?->pending_orders,
                'packing_orders' => (int) $orderMetrics?->packing_orders,
                'shipping_orders' => (int) $orderMetrics?->shipping_orders,
                'completed_orders' => (int) $orderMetrics?->completed_orders,
                'cancelled_orders' => (int) $orderMetrics?->cancelled_orders,
                'unpaid_orders' => (int) $orderMetrics?->unpaid_orders,
                'paid_orders' => (int) $orderMetrics?->paid_orders,
            ],
            'recentOrders' => OrderResource::collection(Order::query()->latest()->limit(8)->get()),
            'lowStockBooks' => BookResource::collection(Book::query()->with(['images' => fn ($query) => $query->orderBy('sort_order')])->where('stock', '<=', 5)->orderBy('stock')->limit(8)->get()),
        ]);
    }
}
