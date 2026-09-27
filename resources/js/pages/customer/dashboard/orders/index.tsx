import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    Package,
    Search,
    SlidersHorizontal,
    Tag,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { AdminListTabs } from '@/components/admin/shared/admin-list-tabs';
import { Pagination } from '@/components/admin/shared/pagination';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import type {
    CustomerDashboardPage,
    CustomerOrder,
} from '@/types/customer-dashboard';

const url = '/customer/dashboard/orders';
const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Packing', value: 'packing' },
    { label: 'Pengiriman', value: 'shipping' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Dibatalkan', value: 'cancelled' },
];

type Filters = Partial<
    Record<'search' | 'status' | 'payment' | 'date_from' | 'date_to', string>
>;

export default function OrdersIndex({
    orders,
    filters,
}: {
    orders: CustomerDashboardPage<CustomerOrder>;
    filters: Filters;
}) {
    const [orderToCancel, setOrderToCancel] = useState<CustomerOrder | null>(
        null,
    );
    const cancelForm = useForm({});
    const cancellationError = String(Object.values(cancelForm.errors)[0] ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            url,
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };

    const applyStatus = (status: string) => {
        router.get(
            url,
            { ...filters, status },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Pesanan Saya" />
            <AdminListLayout
                title="Pesanan"
                description="Pantau pembayaran dan perjalanan setiap pesanan buku Anda."
                icon={BookOpen}
                dashboardHref={url}
                eyebrow="Akun Saya"
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            onSubmit={submit}
                            className="grid gap-4 xl:grid-cols-[1fr_1fr_1.35fr_1fr_1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Tanggal Pesanan
                                </span>
                                <Input
                                    type="date"
                                    name="date_from"
                                    defaultValue={filters.date_from}
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Sampai Tanggal
                                </span>
                                <Input
                                    type="date"
                                    name="date_to"
                                    defaultValue={filters.date_to}
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Tag className="text-primary size-4" /> Kode
                                    / Buku
                                </span>
                                <span className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari pesanan atau buku"
                                        className="bg-background h-10 pl-9"
                                    />
                                </span>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Package className="text-primary size-4" />{' '}
                                    Status Pesanan
                                </span>
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua Status</option>
                                    {tabs.slice(1).map((tab) => (
                                        <option
                                            key={tab.value}
                                            value={tab.value}
                                        >
                                            {tab.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <SlidersHorizontal className="text-primary size-4" />{' '}
                                    Pembayaran
                                </span>
                                <select
                                    name="payment"
                                    defaultValue={filters.payment ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua</option>
                                    <option value="unpaid">
                                        Belum Dibayar
                                    </option>
                                    <option value="paid">Dibayar</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </label>
                            <Button type="submit" className="h-10">
                                <Search /> Cari
                            </Button>
                            <Button
                                asChild
                                type="button"
                                variant="outline"
                                className="h-10"
                            >
                                <Link href={url}>Reset</Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b bg-white px-4 py-4 sm:px-5">
                            <div>
                                <h2 className="font-heading text-foreground text-xl font-bold">
                                    Daftar Pesanan
                                </h2>
                                <p className="text-muted-foreground text-xs">
                                    Lihat status dan rincian pesanan Anda.
                                </p>
                            </div>
                        </div>
                        <AdminListTabs
                            label="Status pesanan"
                            tabs={tabs}
                            active={filters.status ?? ''}
                            onChange={applyStatus}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1060px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Pesanan</th>
                                        <th className="px-4 py-4">Buku</th>
                                        <th className="px-4 py-4">Total</th>
                                        <th className="px-4 py-4">
                                            Pembayaran
                                        </th>
                                        <th className="px-4 py-4">Tanggal</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {order.primary_image ? (
                                                        <img
                                                            src={
                                                                order
                                                                    .primary_image
                                                                    .url
                                                            }
                                                            alt={
                                                                order
                                                                    .primary_image
                                                                    .alt_text ||
                                                                order.item_summary
                                                            }
                                                            className="size-14 shrink-0 rounded-lg border object-cover"
                                                        />
                                                    ) : (
                                                        <div className="admin-orders-book-placeholder text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-lg border border-white/70 shadow-sm">
                                                            <BookOpen
                                                                className="size-6"
                                                                aria-hidden="true"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-foreground truncate font-bold">
                                                            {order.item_summary}
                                                        </p>
                                                        <Link
                                                            href={`/customer/dashboard/orders/${order.id}`}
                                                            className="text-primary mt-0.5 block text-xs underline-offset-2 hover:underline"
                                                        >
                                                            {order.order_code}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-foreground px-4 py-3.5 font-semibold">
                                                {order.quantity} buku
                                            </td>
                                            <td className="text-foreground px-4 py-3.5 font-bold">
                                                {rupiah(order.total)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs leading-5">
                                                <StatusBadge
                                                    value={order.payment_status}
                                                />
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge
                                                    value={order.status}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`${url}/${order.id}`}
                                                        >
                                                            Lihat Detail
                                                        </Link>
                                                    </Button>
                                                    {order.can_cancel && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {
                                                                cancelForm.clearErrors();
                                                                setOrderToCancel(
                                                                    order,
                                                                );
                                                            }}
                                                        >
                                                            Batalkan
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {orders.data.length === 0 && (
                                <p className="text-muted-foreground p-10 text-center text-sm">
                                    Pesanan tidak ditemukan.
                                </p>
                            )}
                        </div>
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {orders.from ?? 0}–
                                    {orders.to ?? 0} dari {orders.total} pesanan
                                </p>
                                <Pagination links={orders.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Dialog
                    open={orderToCancel !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setOrderToCancel(null);
                            cancelForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Batalkan pesanan?</DialogTitle>
                            <DialogDescription>
                                {orderToCancel && (
                                    <>
                                        Pesanan {orderToCancel.order_code} akan
                                        dibatalkan. Stok buku dan saldo yang
                                        digunakan akan dikembalikan. Tindakan
                                        ini tidak dapat dibatalkan.
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        {cancellationError && (
                            <p
                                role="alert"
                                className="text-destructive text-sm"
                            >
                                {cancellationError}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={cancelForm.processing}
                                onClick={() => setOrderToCancel(null)}
                            >
                                Kembali
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={
                                    cancelForm.processing || !orderToCancel
                                }
                                onClick={() => {
                                    if (!orderToCancel) return;
                                    cancelForm.patch(
                                        `${url}/${orderToCancel.id}/cancel`,
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setOrderToCancel(null);
                                                cancelForm.reset();
                                            },
                                        },
                                    );
                                }}
                            >
                                {cancelForm.processing
                                    ? 'Membatalkan…'
                                    : 'Ya, batalkan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AdminListLayout>
        </>
    );
}

OrdersIndex.layout = { breadcrumbs: [{ title: 'Pesanan', href: url }] };
