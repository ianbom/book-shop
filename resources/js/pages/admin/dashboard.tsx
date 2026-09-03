import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, ClipboardList, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/shared/page-header';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Book, Order } from '@/types/admin';

type Metrics = Record<
    | 'total_books'
    | 'active_books'
    | 'total_stock'
    | 'total_orders'
    | 'pending_orders'
    | 'packing_orders'
    | 'shipping_orders'
    | 'completed_orders'
    | 'cancelled_orders'
    | 'unpaid_orders'
    | 'paid_orders',
    number
>;
export default function Dashboard({
    metrics,
    recentOrders,
    lowStockBooks,
}: {
    metrics: Metrics;
    recentOrders: { data: Order[] } | Order[];
    lowStockBooks: { data: Book[] } | Book[];
}) {
    const orders = Array.isArray(recentOrders)
        ? recentOrders
        : recentOrders.data;
    const books = Array.isArray(lowStockBooks)
        ? lowStockBooks
        : lowStockBooks.data;
    const cards = [
        { label: 'Total Buku', value: metrics.total_books, icon: BookOpen },
        { label: 'Stok Saat Ini', value: metrics.total_stock, icon: Package },
        {
            label: 'Total Pesanan',
            value: metrics.total_orders,
            icon: ClipboardList,
        },
        {
            label: 'Perlu Diproses',
            value: metrics.pending_orders + metrics.packing_orders,
            icon: ClipboardList,
        },
    ];
    return (
        <>
            <Head title="Dashboard" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Dashboard"
                    description="Ringkasan operasional Buku Order hari ini."
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, icon: Icon }) => (
                        <Card key={label} className="border-border shadow-sm">
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-muted-foreground text-sm">
                                        {label}
                                    </p>
                                    <p className="text-foreground mt-2 text-3xl font-semibold">
                                        {value.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <span className="text-primary bg-secondary rounded-xl p-3">
                                    <Icon className="size-5" />
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Pesanan Terbaru</CardTitle>
                            <Link
                                href={admin.orders.index()}
                                className="text-primary flex items-center gap-1 text-sm"
                            >
                                Lihat semua <ArrowRight className="size-4" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-muted-foreground border-b text-xs uppercase">
                                        <tr>
                                            <th className="pb-3">Order</th>
                                            <th className="pb-3">Customer</th>
                                            <th className="pb-3">Total</th>
                                            <th className="pb-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="py-3 font-medium">
                                                    <Link
                                                        className="text-primary"
                                                        href={admin.orders.show(
                                                            order.id,
                                                        )}
                                                    >
                                                        {order.order_code}
                                                    </Link>
                                                    <div className="text-muted-foreground text-xs">
                                                        {formatDate(
                                                            order.created_at,
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {order.customer_name}
                                                    <div className="text-muted-foreground max-w-40 truncate text-xs">
                                                        {order.book_title} ×{' '}
                                                        {order.quantity}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {rupiah(order.total)}
                                                </td>
                                                <td className="py-3">
                                                    <StatusBadge
                                                        value={order.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Stok Menipis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {books.length ? (
                                books.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={admin.books.show(book.id)}
                                        className="hover:border-primary flex items-center justify-between rounded-lg border p-3 transition"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">
                                                {book.title}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {book.author}
                                            </span>
                                        </span>
                                        <span className="text-warning ml-3 font-semibold">
                                            {book.stock}
                                        </span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Tidak ada stok menipis.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: admin.dashboard() }],
};
