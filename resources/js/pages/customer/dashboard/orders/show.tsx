import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    CreditCard,
    MapPin,
    Package,
    ReceiptText,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import OrderSettlement from '@/components/order-settlement';
import type {
    Settlement,
    SettlementAddress,
    SettlementBank,
} from '@/components/order-settlement';
import { exactRupiah, formatDate, formatMonthYear, rupiah } from '@/lib/format';
import type { OrderStatus, PaymentStatus, ShipmentStatus } from '@/types/admin';

type Item = {
    name: string;
    author: string | null;
    isbn: string | null;
    quantity: number;
    value: string;
    subtotal: string;
    pre_order_code: string | null;
    line_discount: string;
    historical_dp: string;
    historical_paid: string;
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
    source: 'website' | 'imported';
    settlement: Settlement | null;
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
        phone: string | null;
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

export default function OrderShow({
    order,
    settlement_addresses,
    settlement_banks,
}: {
    order: Order;
    settlement_addresses: SettlementAddress[];
    settlement_banks: SettlementBank[];
}) {
    const itemCount = order.items.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const payment = order.wallet_transactions.find(
        (transaction) => transaction.direction === 'debit',
    );
    const address = order.shipping_address;
    const money = order.source === 'imported' ? exactRupiah : rupiah;
    const history = order.status_histories.some(
        (event) => event.status === order.status,
    )
        ? order.status_histories
        : [
              ...order.status_histories,
              { status: order.status, created_at: null },
          ];

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
                        <span className="font-semibold">
                            {orderLabels[order.status]}
                        </span>
                        <p className="text-muted-foreground text-xs">
                            Status pesanan saat ini
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 xl:border-l xl:pl-5">
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
                            <section className="bg-card @container/product rounded-xl border p-4 sm:p-5">
                                <SectionHeading icon={Package}>
                                    Produk yang Dibeli
                                </SectionHeading>
                                {order.items.length ? (
                                    <div className="mt-4">
                                        <div
                                            className={`bg-muted/60 text-muted-foreground hidden gap-3 rounded-md px-3 py-2 text-xs @min-[760px]/product:grid ${order.settlement ? 'grid-cols-[minmax(0,1fr)_110px_110px_110px_60px_110px]' : 'grid-cols-[minmax(0,1fr)_110px_70px_110px]'}`}
                                        >
                                            <span>Produk</span>
                                            <span className="text-right">
                                                Harga Satuan
                                            </span>
                                            {order.settlement && (
                                                <>
                                                    <span className="text-right">
                                                        Diskon baris
                                                    </span>
                                                    <span className="text-right">
                                                        Dibayar historis
                                                    </span>
                                                </>
                                            )}
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
                                                className={`grid gap-2 border-b py-4 last:border-0 @min-[760px]/product:items-center @min-[760px]/product:gap-3 @min-[760px]/product:px-3 ${order.settlement ? '@min-[760px]/product:grid-cols-[minmax(0,1fr)_110px_110px_110px_60px_110px]' : '@min-[760px]/product:grid-cols-[minmax(0,1fr)_110px_70px_110px]'}`}
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
                                                        {item.pre_order_code && (
                                                            <p className="text-muted-foreground text-xs">
                                                                PO:{' '}
                                                                {
                                                                    item.pre_order_code
                                                                }
                                                            </p>
                                                        )}
                                                        {item.preorder_estimated_date && (
                                                            <p className="text-muted-foreground text-xs">
                                                                Estimasi
                                                                preorder:{' '}
                                                                {(order.source ===
                                                                    'imported'
                                                                    ? formatMonthYear
                                                                    : formatDate)(
                                                                    item.preorder_estimated_date,
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-sm @min-[760px]/product:block @min-[760px]/product:text-right">
                                                    <span className="text-muted-foreground @min-[760px]/product:hidden">
                                                        Harga
                                                    </span>
                                                    {money(item.value)}
                                                </div>
                                                {order.settlement && (
                                                    <>
                                                        <div className="flex justify-between text-sm @min-[760px]/product:block @min-[760px]/product:text-right">
                                                            <span className="text-muted-foreground @min-[760px]/product:hidden">
                                                                Diskon baris
                                                            </span>
                                                            {money(
                                                                item.line_discount,
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between text-sm @min-[760px]/product:block @min-[760px]/product:text-right">
                                                            <span className="text-muted-foreground @min-[760px]/product:hidden">
                                                                Dibayar historis
                                                            </span>
                                                            {money(
                                                                item.historical_paid,
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                <div className="flex justify-between text-sm @min-[760px]/product:text-center">
                                                    <span className="text-muted-foreground @min-[760px]/product:hidden">
                                                        Jumlah
                                                    </span>
                                                    {item.quantity}
                                                </div>
                                                <div className="flex justify-between text-sm font-semibold @min-[760px]/product:block @min-[760px]/product:text-right">
                                                    <span className="text-muted-foreground font-normal @min-[760px]/product:hidden">
                                                        Subtotal
                                                    </span>
                                                    {money(item.subtotal)}
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

                            <div>
                                <section className="bg-card @container/shipping rounded-xl border p-4 sm:p-5">
                                    <SectionHeading icon={Truck}>
                                        Status Pengiriman
                                    </SectionHeading>
                                    <div className="mt-4 grid gap-5 @min-[480px]/shipping:grid-cols-2">
                                        <ol aria-label="Alur status pesanan">
                                            {history.map((event, index) => (
                                                <li
                                                    key={event.status}
                                                    className="relative flex gap-3 pb-4 text-sm last:pb-0"
                                                >
                                                    {index <
                                                        history.length - 1 && (
                                                        <span
                                                            className="bg-border absolute top-2.5 bottom-[-10px] left-[3.5px] w-px"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <span
                                                        className="bg-primary relative mt-1.5 size-2 shrink-0 rounded-full"
                                                        aria-hidden="true"
                                                    />
                                                    <div>
                                                        <p className="font-semibold">
                                                            {orderLabels[
                                                                event.status as OrderStatus
                                                            ] ?? event.status}
                                                        </p>
                                                        {event.created_at && (
                                                            <p className="text-muted-foreground text-xs">
                                                                {formatDate(
                                                                    event.created_at,
                                                                )}
                                                            </p>
                                                        )}
                                                        {event.status ===
                                                            order.status && (
                                                            <p className="text-muted-foreground text-xs">
                                                                Status saat ini
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                        <div className="min-w-0">
                                            {order.shipments.length ? (
                                                order.shipments.map(
                                                    (entry, index) => (
                                                        <div
                                                            key={index}
                                                            className="border-b py-4 first:pt-0 last:border-0 last:pb-0"
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                                {entry.courier_company ||
                                                                    'Pengiriman'}{' '}
                                                                ·{' '}
                                                                {entry.courier_service_name ||
                                                                    entry.courier_type ||
                                                                    'Layanan belum tersedia'}
                                                                <StatusBadge
                                                                    value={
                                                                        entry.status
                                                                    }
                                                                />
                                                            </div>
                                                            {(entry.waybill_id ||
                                                                entry.tracking_id) && (
                                                                <p className="text-muted-foreground mt-1 text-xs break-all">
                                                                    Resi:{' '}
                                                                    {entry.waybill_id ||
                                                                        entry.tracking_id}
                                                                </p>
                                                            )}
                                                            {entry.courier_link && (
                                                                <a
                                                                    href={
                                                                        entry.courier_link
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-primary mt-2 inline-block text-sm underline"
                                                                >
                                                                    Lacak
                                                                    pengiriman
                                                                </a>
                                                            )}
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <p className="text-muted-foreground text-sm">
                                                    Belum ada data pengiriman.
                                                </p>
                                            )}
                                        </div>
                                    </div>
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
                                            {money(
                                                order.settlement?.summary
                                                    .subtotal ?? order.subtotal,
                                            )}
                                        </dd>
                                    </div>
                                    {order.settlement && (
                                        <>
                                            <div className="flex justify-between gap-3">
                                                <dt>Sudah dibayar historis</dt>
                                                <dd className="font-semibold">
                                                    {money(
                                                        order.settlement.summary
                                                            .historical_paid,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between gap-3">
                                                <dt>Transfer disetujui</dt>
                                                <dd className="font-semibold">
                                                    {money(
                                                        order.settlement.summary
                                                            .approved_paid,
                                                    )}
                                                </dd>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between gap-3">
                                        <dt>Ongkos Kirim</dt>
                                        <dd className="font-semibold">
                                            {order.settlement &&
                                            !order.settlement.summary
                                                .shipping_selected
                                                ? order.settlement.archived
                                                    ? 'Historis tidak tersedia'
                                                    : 'Belum dipilih'
                                                : money(
                                                      order.settlement?.summary
                                                          .shipping_cost ??
                                                          order.shipping_cost,
                                                  )}
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
                                        <dt>
                                            {order.settlement
                                                ? 'Sisa pelunasan'
                                                : 'Total Pembayaran'}
                                        </dt>
                                        <dd className="text-xl">
                                            {money(
                                                order.settlement?.summary
                                                    .outstanding ?? order.total,
                                            )}
                                            {order.settlement &&
                                                !order.settlement.summary
                                                    .shipping_selected && (
                                                    <span className="block text-xs font-normal">
                                                        {order.settlement
                                                            .archived
                                                            ? 'Ongkir historis tidak tersedia'
                                                            : 'Belum termasuk ongkir'}
                                                    </span>
                                                )}
                                        </dd>
                                    </div>
                                </dl>
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
                                    {!order.settlement?.summary
                                        .shipping_selected && (
                                        <Link
                                            href="/customer/dashboard/profile"
                                            className="text-primary text-xs font-medium hover:underline"
                                        >
                                            Kelola Alamat
                                        </Link>
                                    )}
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
                                            {order.settlement
                                                ? 'Historis dan transfer bank'
                                                : 'Saldo Buku Order'}
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
                                    {!order.settlement && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-muted-foreground">
                                                Dibayar dari Saldo
                                            </dt>
                                            <dd className="font-medium">
                                                {rupiah(order.wallet_amount)}
                                            </dd>
                                        </div>
                                    )}
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
                                {order.settlement && (
                                    <OrderSettlement
                                        orderId={order.id}
                                        settlement={order.settlement}
                                        addresses={settlement_addresses}
                                        banks={settlement_banks}
                                    />
                                )}
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
