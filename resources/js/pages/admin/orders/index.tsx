import { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Pagination } from '@/components/admin/shared/pagination';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Order, Paginated } from '@/types/admin';

type Props = {
    orders: Paginated<Order>;
    filters: Record<
        'search' | 'status' | 'payment' | 'date_from' | 'date_to',
        string | undefined
    >;
};

export default function OrdersIndex({ orders, filters }: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.orders.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Pesanan" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Pesanan"
                    description="Pantau pembayaran dan proses setiap pesanan pelanggan."
                />
                <Card>
                    <CardContent className="p-4">
                        <form
                            onSubmit={submit}
                            className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
                        >
                            <div className="relative md:col-span-2">
                                <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Kode, pelanggan, telepon, buku…"
                                    className="pl-9"
                                />
                            </div>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="bg-background h-10 rounded-md border px-3 text-sm"
                            >
                                <option value="">Semua status</option>
                                <option value="pending">Pending</option>
                                <option value="packing">Packing</option>
                                <option value="shipping">Pengiriman</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                            <select
                                name="payment"
                                defaultValue={filters.payment ?? ''}
                                className="bg-background h-10 rounded-md border px-3 text-sm"
                            >
                                <option value="">Semua pembayaran</option>
                                <option value="unpaid">Belum dibayar</option>
                                <option value="paid">Dibayar</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                            <Input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from}
                                aria-label="Tanggal mulai"
                            />
                            <Button type="submit" variant="outline">
                                Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="text-muted-foreground bg-muted border-b text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Order</th>
                                        <th className="px-5 py-3">Pelanggan</th>
                                        <th className="px-5 py-3">WhatsApp</th>
                                        <th className="px-5 py-3">Buku</th>
                                        <th className="px-5 py-3">Qty</th>
                                        <th className="px-5 py-3">Total</th>
                                        <th className="px-5 py-3">
                                            Pembayaran
                                        </th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.data.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-5 py-4 font-medium">
                                                {order.order_code}
                                                <div className="text-muted-foreground text-xs">
                                                    {formatDate(
                                                        order.created_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {order.customer_name}
                                            </td>
                                            <td className="px-5 py-4">
                                                <a
                                                    className="text-primary"
                                                    href={`https://wa.me/${order.customer_phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {order.customer_phone}
                                                </a>
                                            </td>
                                            <td className="max-w-64 px-5 py-4">
                                                <span className="line-clamp-2">
                                                    {order.book_title}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {order.quantity}
                                            </td>
                                            <td className="px-5 py-4 font-medium">
                                                {rupiah(order.total)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    value={order.payment_status}
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    value={order.status}
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button
                                                    asChild
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <Link
                                                        href={admin.orders.show(
                                                            order.id,
                                                        )}
                                                        aria-label={`Lihat ${order.order_code}`}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {orders.data.length === 0 && (
                                <p className="text-muted-foreground p-8 text-center text-sm">
                                    Pesanan tidak ditemukan.
                                </p>
                            )}
                        </div>
                        <div className="border-t p-4">
                            <Pagination links={orders.meta.links} />
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [{ title: 'Pesanan', href: admin.orders.index() }],
};
