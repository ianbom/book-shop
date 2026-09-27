import { Head, Link, router } from "@inertiajs/react";
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    Package,
    Ticket,
    Truck,
    Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, rupiah } from "@/lib/format";
import admin from "@/routes/admin";
import type { OrderStatus } from "@/types/admin";

type Day = { date: string; count: number };
type DashboardOrder = {
    id: number;
    order_code: string;
    customer_name: string;
    item_summary: string;
    quantity: number;
    total: string;
    status: OrderStatus;
    created_at: string | null;
};
type DashboardBook = {
    id: number;
    title: string;
    author: string;
    stock: number;
};
type DashboardProps = {
    period: 7 | 30;
    operational: {
        orders_to_process: number;
        pending_orders: number;
        pending_topups: number;
        pending_shipments: number;
        risky_stock: number;
    };
    finance: {
        customer_wallet_balance: string;
        gross_order_payments: string;
        refunds: string;
        book_spend: string;
        shipping_spend: string;
        voucher_discounts: string;
    };
    trend: { days: Day[]; total: number; previous_total: number };
    statusCounts: { status: OrderStatus; count: number }[];
    recentOrders: DashboardOrder[];
    actions: { low_stock_books: DashboardBook[] };
};

const statusLabels: Record<OrderStatus, string> = {
    pending: "Menunggu",
    waiting_preorder: "Preorder",
    processing: "Diproses",
    packing: "Dikemas",
    shipping: "Dikirim",
    completed: "Selesai",
    cancelled: "Batal",
};

const statusColors: Record<OrderStatus, string> = {
    pending: "bg-amber-500",
    waiting_preorder: "bg-orange-600",
    processing: "bg-sky-500",
    packing: "bg-cyan-600",
    shipping: "bg-indigo-600",
    completed: "bg-emerald-600",
    cancelled: "bg-muted-foreground/50",
};

const formatCount = (value: number) => value.toLocaleString("id-ID");
const formatDay = (value: string) =>
    new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
        new Date(`${value}T00:00:00`),
    );

export default function Dashboard({
    period,
    operational,
    finance,
    trend,
    statusCounts,
    recentOrders,
    actions,
}: DashboardProps) {
    const maximum = Math.max(1, ...trend.days.map(({ count }) => count));
    const chartPoints = trend.days.map((day, index) => ({
        ...day,
        x: trend.days.length === 1 ? 400 : (index / (trend.days.length - 1)) * 800,
        y: 178 - (day.count / maximum) * 146,
    }));
    const points = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");
    const delta = trend.total - trend.previous_total;
    const labels = [
        {
            label: "Saldo customer",
            value: finance.customer_wallet_balance,
            icon: Wallet,
            emphasis: true,
        },
        {
            label: "Pembayaran order · bruto",
            value: finance.gross_order_payments,
            icon: CircleDollarSign,
        },
        { label: "Refund saldo", value: finance.refunds, icon: ArrowDownRight },
        { label: "Alokasi buku", value: finance.book_spend, icon: BookOpen },
        { label: "Alokasi ongkir", value: finance.shipping_spend, icon: Truck },
        { label: "Voucher terpakai", value: finance.voucher_discounts, icon: Ticket },
    ];
    const tasks = [
        {
            label: "Order menunggu proses",
            count: operational.pending_orders,
            icon: ClipboardList,
            href: admin.orders.index.url({ query: { status: "pending" } }),
        },
        {
            label: "Top-up menunggu tinjauan",
            count: operational.pending_topups,
            icon: Wallet,
            href: admin.topUps.index.url({ query: { status: "pending" } }),
        },
        {
            label: "Shipment menunggu proses",
            count: operational.pending_shipments,
            icon: Truck,
            href: admin.shipments.index.url({ query: { status: "pending" } }),
        },
        {
            label: "Buku stok berisiko",
            count: operational.risky_stock,
            icon: Package,
            href: admin.inventory.index(),
        },
    ];
    const dayLabels = trend.days.filter((_, index) =>
        [0, Math.floor((trend.days.length - 1) / 2), trend.days.length - 1].includes(index),
    );

    return (
        <>
            <Head title="Dashboard" />
            <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-7 p-4 md:p-7">
                <PageHeader
                    title="Dashboard"
                    description="Pantau pekerjaan harian, aliran pesanan, dan saldo customer."
                />

                <section
                    aria-label="Ringkasan operasional"
                    className="grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
                >
                    <div className="flex items-center justify-between gap-4 py-4 sm:px-5 sm:first:pl-0">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                Order perlu diproses
                            </p>
                            <p className="text-foreground mt-1 text-3xl font-bold tabular-nums">
                                {formatCount(operational.orders_to_process)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Pending, diproses, dan dikemas
                            </p>
                        </div>
                        <ClipboardList
                            className="text-primary size-5 shrink-0"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-4 sm:px-5">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                Top-up menunggu tinjauan
                            </p>
                            <p className="text-foreground mt-1 text-3xl font-bold tabular-nums">
                                {formatCount(operational.pending_topups)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Permintaan customer
                            </p>
                        </div>
                        <Wallet className="text-primary size-5 shrink-0" aria-hidden="true" />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-4 sm:px-5 sm:last:pr-0">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                Stok berisiko
                            </p>
                            <p className="text-foreground mt-1 text-3xl font-bold tabular-nums">
                                {formatCount(operational.risky_stock)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Buku aktif dengan stok ≤ 5
                            </p>
                        </div>
                        <Package className="text-warning size-5 shrink-0" aria-hidden="true" />
                    </div>
                </section>

                <section
                    aria-labelledby="wallet-summary-title"
                    className="rounded-2xl border bg-white p-5 sm:p-6"
                >
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-primary text-[10px] font-bold tracking-[0.16em] uppercase">
                                Posisi finansial
                            </p>
                            <h2
                                id="wallet-summary-title"
                                className="font-heading mt-1 text-xl font-bold"
                            >
                                Saldo & penggunaan wallet
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Akumulasi sepanjang waktu · refund ditampilkan terpisah
                        </p>
                    </div>
                    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {labels.map(({ label, value, icon: Icon, emphasis }) => (
                            <div
                                key={label}
                                className={`border-l-2 pl-3 ${emphasis ? "border-primary" : "border-border"}`}
                            >
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                                    <Icon className="size-3.5" aria-hidden="true" />
                                    {label}
                                </div>
                                <p
                                    className={`mt-1 font-bold tabular-nums ${emphasis ? "text-primary text-lg" : "text-foreground text-base"}`}
                                >
                                    {rupiah(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]">
                    <section
                        aria-labelledby="order-trend-title"
                        className="min-w-0 rounded-2xl border bg-white p-5 sm:p-6"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                    <Activity className="text-primary size-4" /> Aktivitas order
                                </p>
                                <h2
                                    id="order-trend-title"
                                    className="font-heading mt-1 text-xl font-bold"
                                >
                                    Tren pesanan harian
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {formatCount(trend.total)} order dalam {period} hari
                                </p>
                            </div>
                            <div
                                className="flex items-center gap-1 rounded-lg border p-1"
                                aria-label="Rentang grafik"
                            >
                                {[7, 30].map((value) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        size="sm"
                                        variant={period === value ? "default" : "ghost"}
                                        aria-pressed={period === value}
                                        onClick={() =>
                                            router.get(
                                                admin.dashboard.url({ query: { period: value } }),
                                                {},
                                                { preserveScroll: true, replace: true },
                                            )
                                        }
                                    >
                                        {value} hari
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div
                            className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs"
                            aria-live="polite"
                        >
                            {delta >= 0 ? (
                                <ArrowUpRight className="text-emerald-600 size-4" />
                            ) : (
                                <ArrowDownRight className="text-rose-600 size-4" />
                            )}
                            <span className="font-semibold text-foreground">
                                {delta > 0 ? "+" : ""}
                                {formatCount(delta)}
                            </span>
                            <span>
                                dibanding {period} hari sebelumnya (
                                {formatCount(trend.previous_total)} order)
                            </span>
                        </div>
                        <div
                            className="mt-4"
                            role="img"
                            aria-label={`Grafik tren jumlah pesanan harian, ${period} hari terakhir`}
                        >
                            {trend.total > 0 ? (
                                <svg
                                    viewBox="0 0 800 210"
                                    preserveAspectRatio="none"
                                    className="h-52 w-full overflow-visible"
                                    aria-hidden="true"
                                >
                                    {[32, 80, 128, 178].map((y) => (
                                        <line
                                            key={y}
                                            x1="0"
                                            x2="800"
                                            y1={y}
                                            y2={y}
                                            stroke="currentColor"
                                            className="text-border"
                                            strokeDasharray="3 7"
                                        />
                                    ))}
                                    <polyline
                                        points={points}
                                        fill="none"
                                        stroke="var(--primary)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    {chartPoints.map(({ date, count, x, y }) => (
                                        <circle
                                            key={date}
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="var(--primary)"
                                            stroke="white"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        >
                                            <title>
                                                {formatDay(date)}: {count} order
                                            </title>
                                        </circle>
                                    ))}
                                </svg>
                            ) : (
                                <div className="text-muted-foreground flex h-52 items-center justify-center rounded-xl bg-muted/40 text-sm">
                                    Belum ada pesanan pada rentang ini.
                                </div>
                            )}
                        </div>
                        <div className="text-muted-foreground flex justify-between text-xs">
                            {dayLabels.map((day) => (
                                <span key={day.date}>{formatDay(day.date)}</span>
                            ))}
                        </div>

                        <div className="mt-7 border-t pt-5">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">Status order</h3>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        Klik status untuk membuka daftar terfilter.
                                    </p>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                    Periode {period} hari
                                </span>
                            </div>
                            <div
                                className="flex h-3 overflow-hidden rounded-full bg-muted"
                                aria-label="Komposisi status order"
                            >
                                {statusCounts
                                    .filter(({ count }) => count > 0)
                                    .map(({ status, count }) => (
                                        <Link
                                            key={status}
                                            href={admin.orders.index.url({
                                                query: {
                                                    status,
                                                    date_from: trend.days[0]?.date,
                                                    date_to: trend.days.at(-1)?.date,
                                                },
                                            })}
                                            style={{
                                                width: `${(count / Math.max(trend.total, 1)) * 100}%`,
                                            }}
                                            className={`${statusColors[status]} transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                                            aria-label={`${statusLabels[status]}: ${formatCount(count)} order`}
                                            title={`${statusLabels[status]}: ${formatCount(count)} order`}
                                        />
                                    ))}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                                {statusCounts.map(({ status, count }) => (
                                    <Link
                                        key={status}
                                        href={admin.orders.index.url({
                                            query: {
                                                status,
                                                date_from: trend.days[0]?.date,
                                                date_to: trend.days.at(-1)?.date,
                                            },
                                        })}
                                        className="group flex min-h-9 min-w-0 items-center gap-2 text-xs"
                                    >
                                        <span
                                            className={`size-2 shrink-0 rounded-full ${statusColors[status]}`}
                                        />
                                        <span className="text-muted-foreground truncate group-hover:text-foreground">
                                            {statusLabels[status]}
                                        </span>
                                        <span className="text-foreground ml-auto font-semibold tabular-nums">
                                            {formatCount(count)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    <aside
                        aria-labelledby="action-queue-title"
                        className="rounded-2xl border bg-white p-5 sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-primary text-[10px] font-bold tracking-[0.16em] uppercase">
                                    Fokus hari ini
                                </p>
                                <h2
                                    id="action-queue-title"
                                    className="font-heading mt-1 text-xl font-bold"
                                >
                                    Perlu tindakan
                                </h2>
                            </div>
                            <CalendarDays
                                className="text-muted-foreground size-5"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="mt-4 divide-y">
                            {tasks.map(({ label, count, icon: Icon, href }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="group flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                                >
                                    <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg group-hover:bg-primary/10 group-hover:text-primary">
                                        <Icon className="size-4" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium group-hover:text-primary">
                                            {label}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            Buka daftar untuk meninjau
                                        </span>
                                    </span>
                                    <span className="text-foreground text-lg font-bold tabular-nums">
                                        {formatCount(count)}
                                    </span>
                                    <ArrowRight
                                        className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                                        aria-hidden="true"
                                    />
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
                    <div className="min-w-0 rounded-2xl border bg-white p-5 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-heading text-lg font-bold">Pesanan terbaru</h2>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    Aktivitas order yang paling baru masuk.
                                </p>
                            </div>
                            <Link
                                href={admin.orders.index()}
                                className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline"
                            >
                                Semua order <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] text-left text-sm">
                                <thead className="text-muted-foreground border-b text-[10px] tracking-wider uppercase">
                                    <tr>
                                        <th className="pb-3 font-semibold">Order</th>
                                        <th className="pb-3 font-semibold">Customer</th>
                                        <th className="pb-3 font-semibold">Total</th>
                                        <th className="pb-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="group">
                                            <td className="py-3">
                                                <Link
                                                    className="text-primary font-semibold hover:underline"
                                                    href={admin.orders.show(order.id)}
                                                >
                                                    {order.order_code}
                                                </Link>
                                                <div className="text-muted-foreground mt-0.5 text-xs">
                                                    {formatDate(order.created_at)}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="block max-w-40 truncate font-medium">
                                                    {order.customer_name}
                                                </span>
                                                <span className="text-muted-foreground block max-w-48 truncate text-xs">
                                                    {order.item_summary} · {order.quantity} buku
                                                </span>
                                            </td>
                                            <td className="py-3 font-semibold tabular-nums">
                                                {rupiah(order.total)}
                                            </td>
                                            <td className="py-3">
                                                <StatusBadge value={order.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {recentOrders.length === 0 && (
                                <p className="text-muted-foreground py-10 text-center text-sm">
                                    Belum ada order terbaru.
                                </p>
                            )}
                        </div>
                    </div>

                    <aside
                        className="rounded-2xl border bg-white p-5 sm:p-6"
                        aria-labelledby="low-stock-title"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-warning flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] uppercase">
                                    <Package className="size-3.5" /> Inventaris
                                </p>
                                <h2
                                    id="low-stock-title"
                                    className="font-heading mt-1 text-lg font-bold"
                                >
                                    Peringatan stok
                                </h2>
                            </div>
                            <Link
                                href={admin.inventory.index()}
                                className="text-primary text-xs font-semibold hover:underline"
                            >
                                Kelola stok
                            </Link>
                        </div>
                        <div className="mt-4 divide-y">
                            {actions.low_stock_books.map((book) => (
                                <Link
                                    key={book.id}
                                    href={admin.books.show(book.id)}
                                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">
                                            {book.title}
                                        </span>
                                        <span className="text-muted-foreground block truncate text-xs">
                                            {book.author}
                                        </span>
                                    </span>
                                    <span
                                        className={`shrink-0 text-sm font-bold tabular-nums ${book.stock === 0 ? "text-destructive" : "text-warning"}`}
                                    >
                                        {book.stock === 0 ? "Habis" : `${book.stock} unit`}
                                    </span>
                                </Link>
                            ))}
                            {actions.low_stock_books.length === 0 && (
                                <p className="text-muted-foreground py-8 text-center text-sm">
                                    Stok buku aktif dalam batas aman.
                                </p>
                            )}
                        </div>
                    </aside>
                </section>
            </main>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: "Dashboard", href: admin.dashboard() }],
};
