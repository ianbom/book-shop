import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Package,
    Search,
    SlidersHorizontal,
    Tag,
    XCircle,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { formatDate, formatMonthYear, rupiah } from '@/lib/format';
import type {
    CustomerDashboardPage,
    CustomerOrder,
} from '@/types/customer-dashboard';

const url = '/customer/dashboard/orders';
const orderDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});
const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Packing', value: 'packing' },
    { label: 'Pengiriman', value: 'shipping' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Dibatalkan', value: 'cancelled' },
];

type Filters = Partial<
    Record<'search' | 'pre_order_code' | 'status' | 'payment', string>
>;

export default function OrdersIndex({
    orders,
    filters,
}: {
    orders: CustomerDashboardPage<CustomerOrder>;
    filters: Filters;
}) {
    const [filterOpen, setFilterOpen] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [orderToCancel, setOrderToCancel] = useState<CustomerOrder | null>(
        null,
    );
    const cancelForm = useForm({});
    const cancellationError = String(Object.values(cancelForm.errors)[0] ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            url,
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            {
                preserveState: true,
                replace: true,
                onSuccess: () => setFilterOpen(false),
            },
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
            <main className="mx-auto flex w-full min-w-0 flex-1 flex-col gap-4 bg-white px-3 py-5 md:hidden">
                <header className="relative">
                    <img
                        src="/images/customer/orders/books-plant.png"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-3 right-0 h-16 w-12 object-contain"
                    />
                    <p className="text-primary pr-12 text-[10px] font-extrabold tracking-[0.12em] uppercase">
                        Akun Saya
                    </p>
                    <h1 className="font-heading text-foreground mt-1 pr-12 text-[clamp(1.75rem,7.5vw,2.25rem)] leading-tight font-bold tracking-tight">
                        Pesanan Saya
                    </h1>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Pantau perjalanan buku favoritmu.
                    </p>
                </header>
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                    <form
                        onSubmit={submit}
                        className="flex min-w-0 gap-3"
                        aria-label="Cari pesanan"
                    >
                        {(['pre_order_code', 'status', 'payment'] as const).map(
                            (name) => (
                                <input
                                    key={name}
                                    type="hidden"
                                    name={name}
                                    value={filters[name] ?? ''}
                                />
                            ),
                        )}
                        <div className="relative min-w-0 flex-1">
                            <button
                                type="submit"
                                aria-label="Cari pesanan"
                                className="text-muted-foreground focus-visible:ring-ring absolute inset-y-0 left-0 flex w-11 items-center justify-center rounded-l-lg focus-visible:ring-2"
                            >
                                <Search className="size-4" aria-hidden="true" />
                            </button>
                            <Input
                                type="search"
                                name="search"
                                aria-label="Cari pesanan atau judul buku"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari pesanan atau judul buku..."
                                className="h-11 rounded-lg bg-white pl-11 text-xs"
                            />
                        </div>
                        <SheetTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 shrink-0 rounded-lg bg-white text-xs"
                            >
                                <SlidersHorizontal aria-hidden="true" /> Filter
                            </Button>
                        </SheetTrigger>
                    </form>
                    <SheetContent
                        side="bottom"
                        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)] [&>button]:top-1 [&>button]:right-1 [&>button]:size-11 [&>button]:p-3.5"
                    >
                        <SheetHeader>
                            <SheetTitle>Filter Pesanan</SheetTitle>
                            <SheetDescription>
                                Pilih kode preorder, status pesanan, dan
                                pembayaran.
                            </SheetDescription>
                        </SheetHeader>
                        <form
                            key={JSON.stringify(filters)}
                            onSubmit={submit}
                            className="grid gap-4 px-4 pb-6"
                        >
                            <input type="hidden" name="search" value={search} />
                            <label className="grid gap-2 text-sm font-semibold">
                                Kode Preorder
                                <Input
                                    name="pre_order_code"
                                    defaultValue={filters.pre_order_code}
                                    placeholder="Masukkan kode preorder"
                                    maxLength={100}
                                    className="h-11"
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold">
                                Status Pesanan
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className="border-input bg-background focus-visible:ring-ring h-11 min-w-0 rounded-md border px-3 text-sm focus-visible:ring-2"
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
                            <label className="grid gap-2 text-sm font-semibold">
                                Pembayaran
                                <select
                                    name="payment"
                                    defaultValue={filters.payment ?? ''}
                                    className="border-input bg-background focus-visible:ring-ring h-11 min-w-0 rounded-md border px-3 text-sm focus-visible:ring-2"
                                >
                                    <option value="">Semua</option>
                                    <option value="unpaid">
                                        Belum Dibayar
                                    </option>
                                    <option value="paid">Dibayar</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </label>
                            <Button type="submit" className="h-11">
                                Terapkan Filter
                            </Button>
                            <Button asChild variant="outline" className="h-11">
                                <Link
                                    href={url}
                                    onClick={() => {
                                        setSearch('');
                                        setFilterOpen(false);
                                    }}
                                >
                                    Reset Filter
                                </Link>
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
                <nav
                    aria-label="Status pesanan"
                    className="flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
                >
                    {tabs.map((tab) => (
                        <Button
                            key={tab.value || 'all'}
                            type="button"
                            variant={
                                (filters.status ?? '') === tab.value
                                    ? 'default'
                                    : 'outline'
                            }
                            aria-pressed={(filters.status ?? '') === tab.value}
                            onClick={() => applyStatus(tab.value)}
                            className="h-11 shrink-0 rounded-lg px-3 text-[11px]"
                        >
                            {tab.label}
                        </Button>
                    ))}
                </nav>
                <section
                    aria-labelledby="mobile-orders-heading"
                    className="grid gap-3"
                >
                    <div>
                        <h2
                            id="mobile-orders-heading"
                            className="font-heading text-xl font-bold"
                        >
                            Daftar Pesanan
                        </h2>
                        <p className="text-muted-foreground text-xs">
                            {orders.total} pesanan
                        </p>
                    </div>
                    {orders.data.map((order) => (
                        <article
                            key={order.id}
                            aria-label={`Pesanan ${order.order_code}`}
                            className="border-border overflow-hidden rounded-xl border bg-white px-3 shadow-xs [&_[data-slot=badge]]:max-w-full [&_[data-slot=badge]]:text-[10px] [&_[data-slot=badge]]:whitespace-normal min-[360px]:[&_[data-slot=badge]]:text-xs"
                        >
                            <div className="flex items-center justify-between gap-2 border-b py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Package
                                        className="size-5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold">
                                            {order.created_at
                                                ? orderDate.format(
                                                      new Date(
                                                          order.created_at,
                                                      ),
                                                  )
                                                : '-'}
                                        </p>
                                        <p
                                            className="text-muted-foreground mt-0.5 truncate text-[10px]"
                                            title={order.order_code}
                                        >
                                            {order.order_code}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge value={order.status} />
                            </div>
                            <div className="flex items-center gap-3 py-3">
                                {order.primary_image ? (
                                    <img
                                        src={order.primary_image.url}
                                        alt={
                                            order.primary_image.alt_text ||
                                            order.item_summary
                                        }
                                        className="h-24 w-[4.5rem] shrink-0 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="admin-orders-book-placeholder text-primary-foreground flex h-24 w-[4.5rem] shrink-0 items-center justify-center rounded-lg">
                                        <BookOpen
                                            className="size-7"
                                            aria-hidden="true"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="font-heading line-clamp-2 text-base leading-tight font-bold">
                                        {order.item_summary}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {order.quantity} buku
                                    </p>
                                    <p className="mt-2 text-sm font-extrabold">
                                        {rupiah(order.total)}
                                    </p>
                                </div>
                            </div>
                            <dl className="grid grid-cols-2 divide-x border-t py-3 text-[11px]">
                                <div className="min-w-0 pr-3">
                                    <dt className="text-muted-foreground mb-1">
                                        Pembayaran
                                    </dt>
                                    <dd>
                                        <StatusBadge
                                            value={order.payment_status}
                                        />
                                    </dd>
                                </div>
                                <div className="min-w-0 pl-3">
                                    <dt className="text-muted-foreground mb-1">
                                        Pengiriman
                                    </dt>
                                    <dd>
                                        {order.shipment_status ? (
                                            <StatusBadge
                                                value={order.shipment_status}
                                            />
                                        ) : (
                                            '-'
                                        )}
                                    </dd>
                                </div>
                            </dl>
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-t py-2">
                                <p className="text-muted-foreground py-2 text-[8px] whitespace-nowrap min-[360px]:text-[11px]">
                                    Estimasi{' '}
                                    {formatMonthYear(
                                        order.preorder_estimated_date,
                                    )}
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 gap-1 rounded-lg bg-white px-1.5 text-[9px] has-[>svg]:px-1.5 min-[360px]:text-xs"
                                >
                                    <Link href={`${url}/${order.id}`}>
                                        Lihat Detail{' '}
                                        <ArrowRight
                                            className="size-2.5"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </Button>
                                {order.can_cancel && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-destructive col-span-2 h-11 w-full text-xs"
                                        onClick={() => {
                                            cancelForm.clearErrors();
                                            setOrderToCancel(order);
                                        }}
                                    >
                                        <XCircle aria-hidden="true" /> Batalkan
                                        Pesanan
                                    </Button>
                                )}
                            </div>
                        </article>
                    ))}
                    {orders.data.length === 0 && (
                        <p className="text-muted-foreground rounded-xl border bg-white px-4 py-10 text-center text-sm">
                            Pesanan tidak ditemukan.
                        </p>
                    )}
                </section>
                {orders.total > 0 && (
                    <div className="grid gap-3 py-2">
                        <p className="text-muted-foreground text-xs">
                            Menampilkan {orders.from ?? 0}–{orders.to ?? 0} dari{' '}
                            {orders.total} pesanan
                        </p>
                        <Pagination links={orders.links} />
                    </div>
                )}
            </main>
            <div className="hidden md:contents">
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
                                className="grid gap-4 xl:grid-cols-[1fr_1.35fr_1fr_1fr_auto_auto] xl:items-end"
                            >
                                <label className="text-foreground grid gap-2 text-xs font-bold">
                                    <span className="flex items-center gap-2">
                                        <Tag className="text-primary size-4" />{' '}
                                        Kode Preorder
                                    </span>
                                    <Input
                                        name="pre_order_code"
                                        defaultValue={filters.pre_order_code}
                                        placeholder="Masukkan kode preorder"
                                        maxLength={100}
                                        className="bg-background h-10"
                                    />
                                </label>
                                <label className="text-foreground grid gap-2 text-xs font-bold">
                                    <span className="flex items-center gap-2">
                                        <Tag className="text-primary size-4" />{' '}
                                        Kode / Buku
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
                                        <option value="rejected">
                                            Ditolak
                                        </option>
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
                                <table className="w-full min-w-[1320px] text-left text-sm">
                                    <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                        <tr>
                                            <th className="px-4 py-4">
                                                Pesanan
                                            </th>
                                            <th className="px-4 py-4">Buku</th>
                                            <th className="px-4 py-4">Total</th>
                                            <th className="px-4 py-4">
                                                Status Pembayaran
                                            </th>
                                            <th className="px-4 py-4">
                                                Tanggal
                                            </th>
                                            <th className="px-4 py-4">
                                                Status Pesanan
                                            </th>
                                            <th className="px-4 py-4">
                                                Status Pengiriman
                                            </th>
                                            <th className="px-4 py-4">ETA</th>
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
                                                                {
                                                                    order.item_summary
                                                                }
                                                            </p>
                                                            <Link
                                                                href={`/customer/dashboard/orders/${order.id}`}
                                                                className="text-primary mt-0.5 block text-xs underline-offset-2 hover:underline"
                                                            >
                                                                {
                                                                    order.order_code
                                                                }
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
                                                        value={
                                                            order.payment_status
                                                        }
                                                    />
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                    {formatDate(
                                                        order.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <StatusBadge
                                                        value={order.status}
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {order.shipment_status ? (
                                                        <StatusBadge
                                                            value={
                                                                order.shipment_status
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5 text-xs whitespace-nowrap">
                                                    {formatMonthYear(
                                                        order.preorder_estimated_date,
                                                    )}
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
                                        {orders.to ?? 0} dari {orders.total}{' '}
                                        pesanan
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
                                            Pesanan {orderToCancel.order_code}{' '}
                                            akan dibatalkan. Stok buku dan saldo
                                            yang digunakan akan dikembalikan.
                                            Tindakan ini tidak dapat dibatalkan.
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
            </div>
        </>
    );
}

OrdersIndex.layout = { breadcrumbs: [{ title: 'Pesanan', href: url }] };
