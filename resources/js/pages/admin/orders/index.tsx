import { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    ChevronRight,
    CircleDollarSign,
    Eye,
    House,
    Package,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tag,
} from 'lucide-react';
import { Pagination } from '@/components/admin/shared/pagination';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Order, OrderStatus, Paginated } from '@/types/admin';

type Props = {
    orders: Paginated<Order>;
    filters: Record<
        'search' | 'status' | 'payment' | 'date_from' | 'date_to',
        string | undefined
    >;
};

const orderTabs: Array<{ label: string; value: OrderStatus | '' }> = [
    { label: 'Semua', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Packing', value: 'packing' },
    { label: 'Pengiriman', value: 'shipping' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Dibatalkan', value: 'cancelled' },
];

function paymentDetails(order: Order) {
    const paid = order.payment_status === 'paid' ? order.total : '0';
    const remaining = order.payment_status === 'paid' ? '0' : order.total;

    return { paid, remaining };
}

export default function OrdersIndex({ orders, filters }: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.orders.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };

    const applyStatus = (status: OrderStatus | '') => {
        router.get(
            admin.orders.index(),
            {
                search: filters.search ?? '',
                status,
                payment: filters.payment ?? '',
                date_from: filters.date_from ?? '',
                date_to: filters.date_to ?? '',
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Pesanan" />
            <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-4 py-5 md:px-7 md:py-7">
                <nav className="text-muted-foreground flex items-center gap-2 text-xs" aria-label="Breadcrumb">
                    <Link href={admin.dashboard()} className="hover:text-primary inline-flex items-center gap-1.5">
                        <House className="size-3.5" />
                        Dashboard
                    </Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground font-semibold">Pesanan</span>
                </nav>

                <section className="bg-muted/60 relative overflow-hidden rounded-2xl border border-white/80 px-5 py-6 sm:px-7 sm:py-7">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl shadow-sm">
                                <BookOpen className="size-6" />
                            </span>
                            <div>
                                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">Manajemen Toko</p>
                                <h1 className="font-heading text-4xl leading-none font-bold text-foreground sm:text-5xl">Pesanan</h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
                            Pantau pembayaran dan proses setiap pesanan pelanggan dengan cepat.
                        </p>
                    </div>
                    <img
                        src="/dashboard/pesanan.png"
                        alt="Ilustrasi membaca buku"
                        className="pointer-events-none absolute right-0 bottom-0 hidden h-full max-w-[56%] object-contain object-right lg:block"
                    />
                </section>

                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_1.35fr_1fr_1fr_auto_auto] xl:items-end">
                            <label className="grid gap-2 text-xs font-bold text-foreground">
                                <span className="flex items-center gap-2"><CalendarDays className="text-primary size-4" /> Tanggal Pesanan</span>
                                <Input type="date" name="date_from" defaultValue={filters.date_from} className="h-10 bg-background" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold text-foreground">
                                <span className="flex items-center gap-2"><Tag className="text-primary size-4" /> Kode / Buku / Pelanggan</span>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input name="search" defaultValue={filters.search} placeholder="Contoh: WPL, buku, pelanggan" className="h-10 bg-background pl-9" />
                                </div>
                            </label>
                            <label className="grid gap-2 text-xs font-bold text-foreground">
                                <span className="flex items-center gap-2"><Package className="text-primary size-4" /> Status Pesanan</span>
                                <select name="status" defaultValue={filters.status ?? ''} className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4">
                                    <option value="">Semua Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="packing">Packing</option>
                                    <option value="shipping">Pengiriman</option>
                                    <option value="completed">Selesai</option>
                                    <option value="cancelled">Dibatalkan</option>
                                </select>
                            </label>
                            <label className="grid gap-2 text-xs font-bold text-foreground">
                                <span className="flex items-center gap-2"><CircleDollarSign className="text-primary size-4" /> Pembayaran</span>
                                <select name="payment" defaultValue={filters.payment ?? ''} className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4">
                                    <option value="">Semua Pembayaran</option>
                                    <option value="unpaid">Belum Dibayar</option>
                                    <option value="paid">Dibayar</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </label>
                            <input type="hidden" name="date_to" value={filters.date_to ?? ''} readOnly />
                            <Button type="button" variant="secondary" onClick={() => router.get(admin.orders.index())} className="h-10 px-4">
                                <RotateCcw /> Reset
                            </Button>
                            <Button type="submit" className="h-10 px-5">
                                <SlidersHorizontal /> Terapkan Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-border/90 shadow-sm">
                    <CardContent className="p-0">
                        <div className="border-b bg-white px-3 pt-3 sm:px-4">
                            <div className="flex min-w-max gap-1 overflow-x-auto pb-3" role="tablist" aria-label="Filter status pesanan">
                                {orderTabs.map((tab) => {
                                    const count = tab.value === '' ? orders.meta.total : orders.data.filter((order) => order.status === tab.value).length;
                                    const isActive = (filters.status ?? '') === tab.value;

                                    return (
                                        <button key={tab.value || 'all'} type="button" role="tab" aria-selected={isActive} onClick={() => applyStatus(tab.value)} className={isActive ? 'bg-primary text-primary-foreground h-10 min-w-30 rounded-lg px-4 text-xs font-bold shadow-sm' : 'border-border text-foreground hover:bg-muted h-10 min-w-30 rounded-lg border bg-white px-4 text-xs font-semibold transition-colors'}>
                                            {tab.label} <span className={isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'}>({count})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1060px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Order / Campaign</th>
                                        <th className="px-4 py-4">Buku</th>
                                        <th className="px-4 py-4">Total</th>
                                        <th className="px-4 py-4">Pembayaran</th>
                                        <th className="px-4 py-4">Tanggal</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/80 bg-white">
                                    {orders.data.map((order) => {
                                        const payment = paymentDetails(order);

                                        return (
                                            <tr key={order.id} className="hover:bg-muted/45 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="admin-orders-book-placeholder text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-lg border border-white/70 shadow-sm">
                                                            <BookOpen className="size-6" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-foreground truncate font-bold">{order.book_title}</p>
                                                            <p className="text-muted-foreground mt-0.5 text-xs">{order.order_code}</p>
                                                            <p className="text-muted-foreground text-xs">{formatDate(order.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 font-semibold text-foreground">{order.quantity} buku</td>
                                                <td className="px-4 py-3.5 font-bold text-foreground">{rupiah(order.total)}</td>
                                                <td className="px-4 py-3.5 text-xs leading-5">
                                                    <div className="flex gap-3"><span className="text-muted-foreground">Dibayar</span><span className="font-semibold text-foreground">{rupiah(payment.paid)}</span></div>
                                                    <div className="flex gap-3"><span className="text-muted-foreground">Sisa</span><span className={payment.remaining === '0' ? 'font-semibold text-success' : 'font-semibold text-destructive'}>{rupiah(payment.remaining)}</span></div>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5 text-xs">{formatDate(order.created_at)}</td>
                                                <td className="px-4 py-3.5"><StatusBadge value={order.status} /></td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <Button asChild size="sm" variant="outline" className="bg-white px-3">
                                                        <Link href={admin.orders.show(order.id)} aria-label={`Lihat detail ${order.order_code}`}>
                                                            <Eye /> Lihat Detail
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {orders.data.length === 0 && <p className="text-muted-foreground p-10 text-center text-sm">Pesanan tidak ditemukan.</p>}
                        </div>

                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {orders.meta.from ?? 0}–{orders.meta.to ?? 0} dari {orders.meta.total} pesanan
                                </p>
                                <Pagination links={orders.meta.links} />
                            </div>
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
