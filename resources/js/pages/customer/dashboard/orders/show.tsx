import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    Check,
    CreditCard,
    MapPin,
    Package,
    ReceiptText,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { formatDate, rupiah } from '@/lib/format';
import type { OrderStatus, PaymentStatus, ShipmentStatus } from '@/types/admin';

type Item = {
    name: string;
    author: string | null;
    isbn: string | null;
    quantity: number;
    value: string;
    subtotal: string;
    preorder_estimated_date: string | null;
    primary_image: { url: string; alt_text: string | null } | null;
};
type Event = {
    status: string;
    note?: string | null;
    description?: string | null;
    provider_status?: string | null;
    created_at?: string | null;
    occurred_at?: string | null;
};
type Shipment = {
    courier_company: string | null;
    courier_type: string | null;
    courier_service_name: string | null;
    status: ShipmentStatus;
    tracking_id: string | null;
    waybill_id: string | null;
    courier_link: string | null;
    price: string;
    items: { name: string | null; quantity: number }[];
    status_histories: Event[];
};
type Order = {
    id: number;
    order_code: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    subtotal: string;
    voucher_discount: string;
    shipping_cost: string;
    total: string;
    wallet_amount: string;
    customer_note: string | null;
    created_at: string | null;
    items: Item[];
    shipping_address: null | {
        recipient_name: string;
        phone: string;
        address: string;
        postal_code: string | null;
        province: string | null;
        city: string | null;
        district: string | null;
        subdistrict: string | null;
    };
    voucher: null | { code: string; name: string };
    status_histories: Event[];
    wallet_transactions: {
        type: string;
        direction: string;
        amount: string;
        created_at: string | null;
    }[];
    shipments: Shipment[];
};

const orderLabels: Record<OrderStatus, string> = {
    pending: 'Pesanan dibuat',
    waiting_preorder: 'Menunggu preorder',
    processing: 'Sedang diproses',
    packing: 'Sedang dikemas',
    shipping: 'Dalam pengiriman',
    completed: 'Selesai',
    cancelled: 'Pesanan dibatalkan',
};
const shipmentLabels: Record<ShipmentStatus, string> = {
    pending: 'Menunggu pengiriman',
    booked: 'Pengiriman dibuat',
    pickup: 'Penjemputan paket',
    in_transit: 'Dalam perjalanan',
    delivered: 'Paket diterima',
    cancelled: 'Pengiriman dibatalkan',
    failed: 'Pengiriman gagal',
};

function SectionHeading({
    icon: Icon,
    children,
}: {
    icon: typeof Package;
    children: React.ReactNode;
}) {
    return (
        <h2 className="font-heading text-foreground flex items-center gap-3 border-b pb-3 text-lg font-bold">
            <Icon className="text-primary size-5" aria-hidden="true" />
            {children}
        </h2>
    );
}

function Timeline({
    events,
    labels,
}: {
    events: Event[];
    labels: Record<string, string>;
}) {
    if (!events.length) {
        return (
            <p className="text-muted-foreground pt-4 text-sm">
                Belum ada riwayat status.
            </p>
        );
    }

    return (
        <ol className="mt-5 space-y-0">
            {events.map((event, index) => (
                <li key={index} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < events.length - 1 && (
                        <span
                            className="bg-primary/30 absolute top-6 bottom-0 left-3 w-px"
                            aria-hidden="true"
                        />
                    )}
                    <span className="bg-primary text-primary-foreground z-10 flex size-6 shrink-0 items-center justify-center rounded-full">
                        <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 text-sm">
                        <p className="text-foreground font-semibold">
                            {labels[event.status] ??
                                event.provider_status ??
                                event.status}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {formatDate(event.occurred_at ?? event.created_at)}
                        </p>
                        {(event.note || event.description) && (
                            <p className="text-muted-foreground mt-1 text-xs break-words">
                                {event.note || event.description}
                            </p>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    );
}

export default function OrderShow({ order }: { order: Order }) {
    const itemCount = order.items.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const payment = order.wallet_transactions.find(
        (transaction) => transaction.direction === 'debit',
    );
    const shipment = order.shipments[0];
    const address = order.shipping_address;

    return (
        <>
            <Head title={`Pesanan ${order.order_code}`} />
            <AdminListLayout
                title="Detail Pesanan"
                description="Lihat detail lengkap pesanan, status, dan informasi pengiriman."
                icon={Package}
                dashboardHref="/customer/dashboard/orders"
                eyebrow="Pesanan Saya"
            >
                <section className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1.3fr_1fr_1fr_auto] xl:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
                            <ReceiptText
                                className="size-6"
                                aria-hidden="true"
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-xs">
                                Kode Pesanan
                            </p>
                            <p className="font-heading text-foreground text-lg font-bold break-all">
                                {order.order_code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 xl:border-l xl:pl-5">
                        <CalendarDays
                            className="text-primary size-5 shrink-0"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-muted-foreground text-xs">
                                Tanggal Pesanan
                            </p>
                            <p className="font-semibold">
                                {formatDate(order.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1 xl:border-l xl:pl-5">
                        <StatusBadge value={order.status} />
                        <p className="text-muted-foreground text-xs">
                            Status pesanan saat ini
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 xl:border-l xl:pl-5">
                        {shipment?.courier_link && (
                            <a
                                href={shipment.courier_link}
                                target="_blank"
                                rel="noreferrer"
                                className="border-primary text-primary hover:bg-primary/5 focus-visible:outline-primary inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                <Truck className="size-4" aria-hidden="true" />{' '}
                                Lacak Pengiriman
                            </a>
                        )}
                        <Link
                            href="/customer/dashboard/orders"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />{' '}
                            Kembali ke Daftar Pesanan
                        </Link>
                    </div>
                </section>

                <div className="@container min-w-0">
                    <div className="grid min-w-0 items-start gap-4 @min-[900px]:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
                        <div className="min-w-0 space-y-4">
                            <section className="bg-card rounded-xl border p-4 sm:p-5">
                                <SectionHeading icon={Package}>
                                    Produk yang Dibeli
                                </SectionHeading>
                                {order.items.length ? (
                                    <div className="mt-4">
                                        <div className="bg-muted/60 text-muted-foreground hidden grid-cols-[minmax(0,1fr)_110px_70px_110px] gap-3 rounded-md px-3 py-2 text-xs sm:grid">
                                            <span>Produk</span>
                                            <span className="text-right">
                                                Harga Satuan
                                            </span>
                                            <span className="text-center">
                                                Jumlah
                                            </span>
                                            <span className="text-right">
                                                Subtotal
                                            </span>
                                        </div>
                                        {order.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="grid gap-2 border-b py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_110px_70px_110px] sm:items-center sm:gap-3 sm:px-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {item.primary_image ? (
                                                        <img
                                                            src={
                                                                item
                                                                    .primary_image
                                                                    .url
                                                            }
                                                            alt={
                                                                item
                                                                    .primary_image
                                                                    .alt_text ||
                                                                item.name
                                                            }
                                                            className="size-14 shrink-0 rounded-md border object-cover"
                                                        />
                                                    ) : (
                                                        <span
                                                            className="bg-primary/5 text-primary flex size-14 shrink-0 items-center justify-center rounded-md"
                                                            aria-hidden="true"
                                                        >
                                                            <BookOpen className="size-7" />
                                                        </span>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-foreground font-semibold">
                                                            {item.name}
                                                        </p>
                                                        {item.isbn && (
                                                            <p className="text-muted-foreground text-xs">
                                                                ISBN:{' '}
                                                                {item.isbn}
                                                            </p>
                                                        )}
                                                        {item.author && (
                                                            <p className="text-muted-foreground text-xs">
                                                                {item.author}
                                                            </p>
                                                        )}
                                                        {item.preorder_estimated_date && (
                                                            <p className="text-muted-foreground text-xs">
                                                                Estimasi
                                                                preorder:{' '}
                                                                {formatDate(
                                                                    item.preorder_estimated_date,
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-sm sm:block sm:text-right">
                                                    <span className="text-muted-foreground sm:hidden">
                                                        Harga
                                                    </span>
                                                    {rupiah(item.value)}
                                                </div>
                                                <div className="flex justify-between text-sm sm:text-center">
                                                    <span className="text-muted-foreground sm:hidden">
                                                        Jumlah
                                                    </span>
                                                    {item.quantity}
                                                </div>
                                                <div className="flex justify-between text-sm font-semibold sm:block sm:text-right">
                                                    <span className="text-muted-foreground font-normal sm:hidden">
                                                        Subtotal
                                                    </span>
                                                    {rupiah(item.subtotal)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground pt-4 text-sm">
                                        Tidak ada detail produk.
                                    </p>
                                )}
                            </section>

                            <div className="grid gap-4 md:grid-cols-2">
                                <section className="bg-card rounded-xl border p-4 sm:p-5">
                                    <SectionHeading icon={ShoppingCart}>
                                        Status Pesanan
                                    </SectionHeading>
                                    <Timeline
                                        events={order.status_histories}
                                        labels={orderLabels}
                                    />
                                </section>
                                <section className="bg-card rounded-xl border p-4 sm:p-5">
                                    <SectionHeading icon={Truck}>
                                        Status Pengiriman
                                    </SectionHeading>
                                    {order.shipments.length ? (
                                        order.shipments.map((entry, index) => (
                                            <div
                                                key={index}
                                                className="border-b py-4 last:border-0 last:pb-0"
                                            >
                                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    {entry.courier_company ||
                                                        'Pengiriman'}{' '}
                                                    ·{' '}
                                                    {entry.courier_service_name ||
                                                        entry.courier_type ||
                                                        'Layanan belum tersedia'}
                                                    <StatusBadge
                                                        value={entry.status}
                                                    />
                                                </div>
                                                {(entry.waybill_id ||
                                                    entry.tracking_id) && (
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        Resi:{' '}
                                                        {entry.waybill_id ||
                                                            entry.tracking_id}
                                                    </p>
                                                )}
                                                <Timeline
                                                    events={
                                                        entry.status_histories
                                                    }
                                                    labels={shipmentLabels}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground pt-4 text-sm">
                                            Belum ada data pengiriman.
                                        </p>
                                    )}
                                </section>
                            </div>
                        </div>

                        <div className="min-w-0 space-y-4">
                            <section className="bg-card rounded-xl border p-4 sm:p-5">
                                <SectionHeading icon={ShoppingCart}>
                                    Ringkasan Pesanan
                                </SectionHeading>
                                <dl className="mt-4 space-y-3 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <dt>
                                            Subtotal Buku ({itemCount} item)
                                        </dt>
                                        <dd className="font-semibold">
                                            {rupiah(order.subtotal)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt>Ongkos Kirim</dt>
                                        <dd className="font-semibold">
                                            {rupiah(order.shipping_cost)}
                                        </dd>
                                    </div>
                                    {Number(order.voucher_discount) > 0 && (
                                        <div className="flex justify-between gap-3">
                                            <dt>
                                                Voucher Diskon{' '}
                                                {order.voucher && (
                                                    <span className="bg-success/10 text-success ml-1 rounded px-2 py-0.5 text-xs">
                                                        {order.voucher.code}
                                                    </span>
                                                )}
                                            </dt>
                                            <dd className="font-semibold">
                                                −
                                                {rupiah(order.voucher_discount)}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="bg-primary/10 text-primary flex items-center justify-between gap-3 rounded-lg px-3 py-3 font-bold">
                                        <dt>Total Pembayaran</dt>
                                        <dd className="text-xl">
                                            {rupiah(order.total)}
                                        </dd>
                                    </div>
                                </dl>
                                <div
                                    className={`mt-3 rounded-lg p-3 text-sm ${order.payment_status === 'paid' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
                                >
                                    <StatusBadge value={order.payment_status} />
                                    <span className="ml-2">
                                        {order.payment_status === 'paid'
                                            ? 'Pembayaran berhasil dilakukan.'
                                            : `Status pembayaran: ${order.payment_status.replaceAll('_', ' ')}.`}
                                    </span>
                                </div>
                            </section>

                            <section className="bg-card rounded-xl border p-4 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                                    <h2 className="font-heading flex items-center gap-3 text-lg font-bold">
                                        <MapPin
                                            className="text-primary size-5"
                                            aria-hidden="true"
                                        />
                                        Alamat Pengiriman
                                    </h2>
                                    <Link
                                        href="/customer/dashboard/profile"
                                        className="text-primary text-xs font-medium hover:underline"
                                    >
                                        Kelola Alamat
                                    </Link>
                                </div>
                                {address ? (
                                    <div className="mt-4 space-y-1 text-sm">
                                        <p className="font-semibold">
                                            {address.recipient_name}
                                        </p>
                                        <p>{address.phone}</p>
                                        <p className="pt-2">
                                            {[
                                                address.address,
                                                address.subdistrict,
                                                address.district,
                                                address.city,
                                                address.province,
                                                address.postal_code,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground pt-4 text-sm">
                                        Alamat belum tersedia.
                                    </p>
                                )}
                                {order.customer_note && (
                                    <div className="bg-muted/60 mt-4 rounded-lg p-3 text-sm">
                                        <p className="font-medium">
                                            Catatan Pesanan
                                        </p>
                                        <p className="text-muted-foreground mt-1 break-words">
                                            {order.customer_note}
                                        </p>
                                    </div>
                                )}
                            </section>

                            <section className="bg-card rounded-xl border p-4 sm:p-5">
                                <SectionHeading icon={CreditCard}>
                                    Data Pembayaran
                                </SectionHeading>
                                <dl className="mt-4 space-y-3 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Metode Pembayaran
                                        </dt>
                                        <dd className="text-right font-medium">
                                            Saldo Buku Order
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Status Pembayaran
                                        </dt>
                                        <dd>
                                            <StatusBadge
                                                value={order.payment_status}
                                            />
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Dibayar dari Saldo
                                        </dt>
                                        <dd className="font-medium">
                                            {rupiah(order.wallet_amount)}
                                        </dd>
                                    </div>
                                    {payment?.created_at && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-muted-foreground">
                                                Tanggal Pembayaran
                                            </dt>
                                            <dd className="text-right">
                                                {formatDate(payment.created_at)}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                                {order.wallet_transactions.length > 0 && (
                                    <div className="text-muted-foreground mt-4 border-t pt-3 text-xs">
                                        <p className="text-foreground mb-2 font-semibold">
                                            Riwayat Saldo
                                        </p>
                                        {order.wallet_transactions.map(
                                            (transaction, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between gap-3 py-1"
                                                >
                                                    <span>
                                                        {transaction.type} ·{' '}
                                                        {formatDate(
                                                            transaction.created_at,
                                                        )}
                                                    </span>
                                                    <span className="shrink-0">
                                                        {transaction.direction ===
                                                        'debit'
                                                            ? '−'
                                                            : '+'}
                                                        {rupiah(
                                                            transaction.amount,
                                                        )}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </AdminListLayout>
        </>
    );
}
