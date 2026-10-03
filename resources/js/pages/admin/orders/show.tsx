import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    BookOpen,
    Boxes,
    Check,
    ClipboardList,
    CreditCard,
    Package,
    PackageCheck,
    ReceiptText,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, rupiah } from '@/lib/format';
import { getOrderProgress } from '@/lib/order-progress';
import admin from '@/routes/admin';
import type { OrderStatus, ShipmentStatus } from '@/types/admin';

type History = {
    id: number;
    status: string;
    note?: string | null;
    changed_by?: string | null;
    provider_status?: string | null;
    description?: string | null;
    occurred_at?: string | null;
    created_at: string | null;
};
type Item = {
    id: number;
    name: string;
    sku: string | null;
    isbn: string | null;
    author: string | null;
    description: string | null;
    category: string;
    sale_type: 'ready_stock' | 'preorder';
    preorder_estimated_date: string | null;
    preorder_ready_at: string | null;
    quantity: number;
    value: string;
    subtotal: string;
    weight: number;
};
type Shipment = {
    id: number;
    shipment_code: string;
    status: ShipmentStatus;
    courier_company: string;
    courier_type: string;
    courier_service_name: string | null;
    delivery_type: string;
    price: string;
    duration: string | null;
    biteship_order_id: string | null;
    tracking_id: string | null;
    waybill_id: string | null;
    courier_link: string | null;
    biteship_status: string | null;
    created_at: string | null;
    items: { name: string | null; quantity: number }[];
    status_histories: History[];
};
type OrderDetail = {
    id: number;
    order_code: string;
    status: OrderStatus;
    payment_status: 'unpaid' | 'paid' | 'partially_refunded' | 'refunded';
    customer_note: string | null;
    subtotal: string;
    voucher_discount: string;
    shipping_cost: string;
    total: string;
    wallet_amount: string;
    created_at: string | null;
    updated_at: string | null;
    customer: {
        name: string | null;
        email: string | null;
        phone: string | null;
    };
    shipping_address: null | {
        recipient_name: string;
        phone: string;
        email: string | null;
        address: string;
        note: string | null;
        postal_code: string | null;
        province: string | null;
        city: string | null;
        district: string | null;
        subdistrict: string | null;
        latitude: string | null;
        longitude: string | null;
    };
    items: Item[];
    voucher: null | { code: string; name: string; discount: string | null };
    wallet_transactions: {
        id: number;
        type: string;
        direction: string;
        amount: string;
        balance_before: string;
        balance_after: string;
        note: string | null;
        created_at: string | null;
    }[];
    status_histories: History[];
    stock_movements: {
        id: number;
        book_title: string | null;
        type: string;
        quantity: number;
        stock_before: number;
        stock_after: number;
        note: string | null;
        changed_by: string | null;
        created_at: string | null;
    }[];
    shipments: Shipment[];
};
const orderTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending: ['processing', 'cancelled'],
    waiting_preorder: ['processing', 'cancelled'],
    processing: ['packing'],
    packing: ['shipping'],
    shipping: ['completed'],
};
const shipmentTransitions: Partial<Record<ShipmentStatus, ShipmentStatus[]>> = {
    pending: ['booked', 'cancelled', 'failed'],
    booked: ['pickup', 'cancelled', 'failed'],
    pickup: ['in_transit', 'failed'],
    in_transit: ['delivered', 'failed'],
};
const statusLabel: Record<OrderStatus, string> = {
    pending: 'Menunggu diproses',
    waiting_preorder: 'Menunggu preorder',
    processing: 'Diproses',
    packing: 'Packing',
    shipping: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};
const shipmentLabel: Record<ShipmentStatus, string> = {
    pending: 'Menunggu',
    booked: 'Dipesan',
    pickup: 'Dijemput',
    in_transit: 'Dalam perjalanan',
    delivered: 'Terkirim',
    cancelled: 'Dibatalkan',
    failed: 'Gagal',
};
const tabs = [
    { id: 'summary', label: 'Ringkasan', icon: ReceiptText },
    { id: 'status', label: 'Status', icon: PackageCheck },
    { id: 'items', label: 'Produk', icon: BookOpen },
    { id: 'payment', label: 'Pembayaran', icon: CreditCard },
    { id: 'shipping', label: 'Pengiriman', icon: Truck },
    { id: 'history', label: 'Riwayat', icon: Package },
    { id: 'stock', label: 'Stok', icon: Boxes },
] as const;
type Tab = (typeof tabs)[number]['id'];
function Info({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{label}</p>
            <div className="mt-1 text-sm font-medium break-words">{value}</div>
        </div>
    );
}
function Line({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: ReactNode;
    strong?: boolean;
}) {
    return (
        <div className="flex justify-between gap-4 border-b pb-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={
                    strong ? 'text-right font-bold' : 'text-right font-medium'
                }
            >
                {value}
            </span>
        </div>
    );
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}

function OrderProgress({ order }: { order: OrderDetail }) {
    const steps = getOrderProgress(order);
    const icons = [ClipboardList, Check, ShieldCheck, Package, Truck, Check];

    return (
        <Card className="bg-card border-primary/20 min-w-0 shadow-none xl:col-span-2">
            <CardHeader>
                <CardTitle className="text-primary">Progres Pesanan</CardTitle>
                {order.status === 'cancelled' && (
                    <p className="text-destructive text-sm">
                        Pesanan dibatalkan. Progres berikutnya dihentikan.
                    </p>
                )}
                {order.status === 'waiting_preorder' && (
                    <p className="text-muted-foreground text-sm">
                        Menunggu ketersediaan buku preorder sebelum diproses.
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div
                    role="region"
                    aria-label="Tahapan progres pesanan; geser untuk melihat seluruh tahap"
                    tabIndex={0}
                    className="focus-visible:ring-ring overflow-x-auto rounded-lg pb-2 focus-visible:ring-2 focus-visible:outline-none"
                >
                    <ol className="grid min-w-[700px] grid-cols-6 py-2">
                        {steps.map((step, index) => {
                            const Icon = icons[index];

                            return (
                                <li
                                    key={step.label}
                                    aria-current={
                                        step.state === 'current'
                                            ? 'step'
                                            : undefined
                                    }
                                    className="relative flex flex-col items-center px-2 text-center"
                                >
                                    {index < steps.length - 1 && (
                                        <span
                                            aria-hidden="true"
                                            className={`absolute top-7 left-1/2 h-px w-full ${step.reached && steps[index + 1].reached ? 'bg-primary' : 'bg-border'}`}
                                        />
                                    )}
                                    <span
                                        aria-hidden="true"
                                        className={`relative z-10 grid size-14 place-items-center rounded-full border-2 ${step.state === 'current' ? 'border-primary bg-primary text-primary-foreground shadow-md' : step.state === 'complete' ? 'border-primary bg-secondary text-primary' : 'border-border bg-card text-muted-foreground'}`}
                                    >
                                        <Icon
                                            className="size-5"
                                            strokeWidth={1.6}
                                        />
                                    </span>
                                    <span className="text-foreground mt-3 text-sm font-medium">
                                        {step.label}
                                    </span>
                                    <span className="sr-only">
                                        {step.state === 'current'
                                            ? 'Tahap saat ini'
                                            : step.state === 'complete'
                                              ? 'Tahap tercapai'
                                              : 'Belum tercapai'}
                                    </span>
                                    <span className="text-muted-foreground mt-1 text-xs">
                                        {step.date ? (
                                            <time dateTime={step.date}>
                                                {formatDate(step.date)}
                                            </time>
                                        ) : (
                                            step.detail || '—'
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </CardContent>
        </Card>
    );
}

export default function OrderShow({ order }: { order: OrderDetail }) {
    const [active, setActive] = useState<Tab>('summary');
    const nextStatuses = orderTransitions[order.status] ?? [];
    const form = useForm<{ status: OrderStatus; note: string }>({
        status: nextStatuses[0] ?? order.status,
        note: '',
    });
    useEffect(() => {
        form.setData(
            'status',
            (orderTransitions[order.status] ?? [])[0] ?? order.status,
        );
    }, [order.status]);
    const saveStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            form.data.status === 'cancelled' &&
            !window.confirm(
                'Batalkan pesanan ini? Stok yang terpotong dan pembayaran saldo akan dikembalikan.',
            )
        )
            return;
        form.patch(admin.orders.status.url(order.id), { preserveScroll: true });
    };
    return (
        <>
            <Head title={'Order ' + order.order_code} />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={admin.orders.index()}
                        className="text-primary inline-flex items-center gap-2 text-sm"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke pesanan
                    </Link>
                    <span className="text-muted-foreground text-xs">
                        Diperbarui {formatDate(order.updated_at)}
                    </span>
                </div>
                <PageHeader
                    title={order.order_code}
                    description={
                        'Pesanan dibuat ' + formatDate(order.created_at)
                    }
                    actions={<StatusBadge value={order.status} />}
                />
                <div
                    role="tablist"
                    aria-label="Data order"
                    className="flex gap-2 overflow-x-auto border-b pb-2"
                >
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={active === id}
                            onClick={() => setActive(id)}
                            className={
                                'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ' +
                                (active === id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted')
                            }
                        >
                            <Icon className="size-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <div
                    role="tabpanel"
                    className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]"
                >
                    {active === 'summary' && (
                        <>
                            <div className="space-y-5">
                                <Panel title="Data pelanggan">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Info
                                            label="Nama"
                                            value={order.customer.name || '—'}
                                        />
                                        <Info
                                            label="Telepon"
                                            value={order.customer.phone || '—'}
                                        />
                                        <Info
                                            label="Email"
                                            value={order.customer.email || '—'}
                                        />
                                        <Info
                                            label="Kode order"
                                            value={order.order_code}
                                        />
                                        <Info
                                            label="Catatan pelanggan"
                                            value={order.customer_note || '—'}
                                        />
                                    </div>
                                </Panel>
                                <Panel title="Alamat pengiriman">
                                    {order.shipping_address ? (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Info
                                                label="Penerima"
                                                value={
                                                    order.shipping_address
                                                        .recipient_name
                                                }
                                            />
                                            <Info
                                                label="Telepon"
                                                value={
                                                    order.shipping_address.phone
                                                }
                                            />
                                            <Info
                                                label="Email"
                                                value={
                                                    order.shipping_address
                                                        .email || '—'
                                                }
                                            />
                                            <Info
                                                label="Alamat"
                                                value={[
                                                    order.shipping_address
                                                        .address,
                                                    order.shipping_address
                                                        .subdistrict,
                                                    order.shipping_address
                                                        .district,
                                                    order.shipping_address.city,
                                                    order.shipping_address
                                                        .province,
                                                    order.shipping_address
                                                        .postal_code,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            />
                                            <Info
                                                label="Catatan alamat"
                                                value={
                                                    order.shipping_address
                                                        .note || '—'
                                                }
                                            />
                                            <Info
                                                label="Koordinat"
                                                value={
                                                    order.shipping_address
                                                        .latitude &&
                                                    order.shipping_address
                                                        .longitude
                                                        ? order.shipping_address
                                                              .latitude +
                                                          ', ' +
                                                          order.shipping_address
                                                              .longitude
                                                        : '—'
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            Alamat snapshot tidak tersedia.
                                        </p>
                                    )}
                                </Panel>
                                <Panel title="Rincian biaya">
                                    <Line
                                        label="Subtotal"
                                        value={rupiah(order.subtotal)}
                                    />
                                    {order.voucher && (
                                        <Line
                                            label={
                                                'Voucher ' + order.voucher.code
                                            }
                                            value={
                                                '−' +
                                                rupiah(
                                                    order.voucher.discount ||
                                                        order.voucher_discount,
                                                )
                                            }
                                        />
                                    )}
                                    <Line
                                        label="Ongkos kirim"
                                        value={rupiah(order.shipping_cost)}
                                    />
                                    <Line
                                        label="Total order"
                                        value={rupiah(order.total)}
                                        strong
                                    />
                                    <Line
                                        label="Dibayar dari saldo"
                                        value={rupiah(order.wallet_amount)}
                                    />
                                    <Info
                                        label="Status pembayaran"
                                        value={
                                            <StatusBadge
                                                value={order.payment_status}
                                            />
                                        }
                                    />
                                </Panel>
                            </div>
                        </>
                    )}
                    {active === 'status' && (
                        <>
                            <OrderProgress order={order} />
                            <Panel title="Ubah status order">
                                {nextStatuses.length ? (
                                    <form
                                        onSubmit={saveStatus}
                                        className="space-y-4"
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="next-order-status">
                                                Status berikutnya
                                            </Label>
                                            <select
                                                id="next-order-status"
                                                className="bg-background h-10 rounded-md border px-3 text-sm"
                                                value={form.data.status}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'status',
                                                        e.target
                                                            .value as OrderStatus,
                                                    )
                                                }
                                            >
                                                {nextStatuses.map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {statusLabel[status]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="order-status-note">
                                                Catatan perubahan
                                            </Label>
                                            <Textarea
                                                id="order-status-note"
                                                maxLength={2000}
                                                value={form.data.note}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'note',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        {form.errors.status && (
                                            <p className="text-destructive text-sm">
                                                {form.errors.status}
                                            </p>
                                        )}
                                        {form.data.status === 'shipping' && (
                                            <p className="text-muted-foreground text-sm">
                                                Biteship akan membuat order
                                                pengiriman. Jika gagal, status
                                                tetap packing.
                                            </p>
                                        )}
                                        <Button
                                            disabled={form.processing}
                                            className="w-full"
                                        >
                                            Simpan status
                                        </Button>
                                    </form>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Status akhir; tidak ada transisi
                                        lanjutan.
                                    </p>
                                )}
                            </Panel>
                            <div className="space-y-5">
                                {order.shipments.length ? (
                                    order.shipments.map((shipment) => (
                                        <ShipmentPanel
                                            key={shipment.id}
                                            orderId={order.id}
                                            shipment={shipment}
                                            statusOnly
                                        />
                                    ))
                                ) : (
                                    <Panel title="Status pengiriman">
                                        <p className="text-muted-foreground text-sm">
                                            Belum ada data shipment.
                                        </p>
                                    </Panel>
                                )}
                            </div>
                        </>
                    )}
                    {active === 'items' && (
                        <div className="xl:col-span-2">
                            <Panel
                                title={
                                    'Item pesanan (' + order.items.length + ')'
                                }
                            >
                                {order.items.length ? (
                                    order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="grid gap-3 border-b pb-4 sm:grid-cols-[1fr_auto]"
                                        >
                                            <div>
                                                <h3 className="font-semibold">
                                                    {item.name}
                                                </h3>
                                                <p className="text-muted-foreground text-sm">
                                                    {item.author || '—'} · SKU{' '}
                                                    {item.sku || '—'} · ISBN{' '}
                                                    {item.isbn || '—'}
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {item.category} ·{' '}
                                                    {item.sale_type ===
                                                    'preorder'
                                                        ? 'Preorder'
                                                        : 'Ready stock'}{' '}
                                                    · {item.weight} g
                                                </p>
                                                {item.description && (
                                                    <p className="mt-2 text-sm">
                                                        {item.description}
                                                    </p>
                                                )}
                                                {item.preorder_estimated_date && (
                                                    <p className="text-sm">
                                                        Estimasi preorder:{' '}
                                                        {formatDate(
                                                            item.preorder_estimated_date,
                                                        )}
                                                    </p>
                                                )}
                                                {item.preorder_ready_at && (
                                                    <p className="text-sm">
                                                        Siap preorder:{' '}
                                                        {formatDate(
                                                            item.preorder_ready_at,
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p>
                                                    {item.quantity} ×{' '}
                                                    {rupiah(item.value)}
                                                </p>
                                                <b>{rupiah(item.subtotal)}</b>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Item tidak tersedia.
                                    </p>
                                )}
                            </Panel>
                        </div>
                    )}
                    {active === 'payment' && (
                        <div className="grid gap-5 lg:grid-cols-2 xl:col-span-2">
                            <Panel title="Pembayaran">
                                <Info
                                    label="Status"
                                    value={
                                        <StatusBadge
                                            value={order.payment_status}
                                        />
                                    }
                                />
                                <Line
                                    label="Jumlah dibayar dari saldo"
                                    value={rupiah(order.wallet_amount)}
                                />
                                <Line
                                    label="Total pesanan"
                                    value={rupiah(order.total)}
                                    strong
                                />
                            </Panel>
                            <Panel
                                title={
                                    'Transaksi wallet (' +
                                    order.wallet_transactions.length +
                                    ')'
                                }
                            >
                                {order.wallet_transactions.length ? (
                                    order.wallet_transactions.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className="space-y-2 border-b pb-3"
                                        >
                                            <Line
                                                label={
                                                    tx.type +
                                                    ' · ' +
                                                    formatDate(tx.created_at)
                                                }
                                                value={
                                                    (tx.direction === 'debit'
                                                        ? '−'
                                                        : '+') +
                                                    rupiah(tx.amount)
                                                }
                                            />
                                            <Line
                                                label="Saldo sebelum"
                                                value={rupiah(
                                                    tx.balance_before,
                                                )}
                                            />
                                            <Line
                                                label="Saldo sesudah"
                                                value={rupiah(tx.balance_after)}
                                            />
                                            {tx.note && (
                                                <p className="text-muted-foreground text-xs">
                                                    {tx.note}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Tidak ada transaksi saldo.
                                    </p>
                                )}
                            </Panel>
                        </div>
                    )}
                    {active === 'shipping' && (
                        <div className="space-y-5 xl:col-span-2">
                            {order.shipments.length ? (
                                order.shipments.map((shipment) => (
                                    <ShipmentPanel
                                        key={shipment.id}
                                        orderId={order.id}
                                        shipment={shipment}
                                    />
                                ))
                            ) : (
                                <Panel title="Pengiriman">
                                    <p className="text-muted-foreground text-sm">
                                        Belum ada data shipment.
                                    </p>
                                </Panel>
                            )}
                        </div>
                    )}
                    {active === 'history' && (
                        <div className="xl:col-span-2">
                            <Panel title="Riwayat status order">
                                {order.status_histories.length ? (
                                    order.status_histories.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex flex-wrap items-start justify-between gap-3 border-b pb-3"
                                        >
                                            <div>
                                                <StatusBadge
                                                    value={
                                                        event.status as OrderStatus
                                                    }
                                                />
                                                {event.note && (
                                                    <p className="mt-2 text-sm">
                                                        {event.note}
                                                    </p>
                                                )}
                                                <p className="text-muted-foreground text-xs">
                                                    {event.changed_by ||
                                                        'Sistem'}
                                                </p>
                                            </div>
                                            <time className="text-muted-foreground text-xs">
                                                {formatDate(event.created_at)}
                                            </time>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Belum ada riwayat status.
                                    </p>
                                )}
                            </Panel>
                        </div>
                    )}
                    {active === 'stock' && (
                        <div className="xl:col-span-2">
                            <Panel
                                title={
                                    'Mutasi stok (' +
                                    order.stock_movements.length +
                                    ')'
                                }
                            >
                                {order.stock_movements.length ? (
                                    order.stock_movements.map((move) => (
                                        <div
                                            key={move.id}
                                            className="grid gap-2 border-b pb-3 sm:grid-cols-5"
                                        >
                                            <Info
                                                label="Buku"
                                                value={move.book_title || '—'}
                                            />
                                            <Info
                                                label="Jenis"
                                                value={move.type}
                                            />
                                            <Info
                                                label="Perubahan"
                                                value={move.quantity}
                                            />
                                            <Info
                                                label="Stok sebelum → sesudah"
                                                value={
                                                    move.stock_before +
                                                    ' → ' +
                                                    move.stock_after
                                                }
                                            />
                                            <Info
                                                label="Waktu / Admin"
                                                value={
                                                    formatDate(
                                                        move.created_at,
                                                    ) +
                                                    ' · ' +
                                                    (move.changed_by || '—')
                                                }
                                            />
                                            {move.note && (
                                                <p className="text-muted-foreground text-xs sm:col-span-5">
                                                    {move.note}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Tidak ada mutasi stok.
                                    </p>
                                )}
                            </Panel>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

function ShipmentPanel({
    orderId,
    shipment,
    statusOnly = false,
}: {
    orderId: number;
    shipment: Shipment;
    statusOnly?: boolean;
}) {
    const choices = shipmentTransitions[shipment.status] ?? [];
    const form = useForm<{ status: ShipmentStatus; description: string }>({
        status: choices[0] ?? shipment.status,
        description: '',
    });
    useEffect(() => {
        form.setData(
            'status',
            (shipmentTransitions[shipment.status] ?? [])[0] ?? shipment.status,
        );
    }, [shipment.status]);
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            !window.confirm(
                'Perubahan manual status pengiriman tidak disarankan karena dapat berbeda dari status Biteship. Lanjutkan?',
            )
        )
            return;
        form.patch(
            '/admin/orders/' +
                orderId +
                '/shipments/' +
                shipment.id +
                '/status',
            { preserveScroll: true },
        );
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                    {shipment.shipment_code}
                    <StatusBadge value={shipment.status} />
                </CardTitle>
            </CardHeader>
            <CardContent
                className={
                    statusOnly ? 'space-y-4' : 'grid gap-6 lg:grid-cols-2'
                }
            >
                {statusOnly ? (
                    <>
                        <p className="text-muted-foreground text-sm">
                            Status pengiriman diperbarui otomatis oleh webhook
                            Biteship. Perubahan manual tidak disarankan.
                        </p>
                        {choices.length ? (
                            <form
                                onSubmit={submit}
                                className="space-y-3 border-t pt-4"
                            >
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={
                                            'shipment-status-' + shipment.id
                                        }
                                    >
                                        Status berikutnya
                                    </Label>
                                    <select
                                        id={'shipment-status-' + shipment.id}
                                        value={form.data.status}
                                        onChange={(event) =>
                                            form.setData(
                                                'status',
                                                event.target
                                                    .value as ShipmentStatus,
                                            )
                                        }
                                        className="bg-background h-10 rounded-md border px-3 text-sm"
                                    >
                                        {choices.map((status) => (
                                            <option key={status} value={status}>
                                                {shipmentLabel[status]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={'shipment-note-' + shipment.id}
                                    >
                                        Catatan
                                    </Label>
                                    <Input
                                        id={'shipment-note-' + shipment.id}
                                        maxLength={1000}
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                {form.errors.status && (
                                    <p className="text-destructive text-sm">
                                        {form.errors.status}
                                    </p>
                                )}
                                <Button disabled={form.processing}>
                                    Perbarui status pengiriman manual
                                </Button>
                            </form>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Status akhir.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Info
                                    label="Kurir"
                                    value={shipment.courier_company}
                                />
                                <Info
                                    label="Dibuat"
                                    value={formatDate(shipment.created_at)}
                                />
                                <Info
                                    label="Layanan"
                                    value={
                                        shipment.courier_service_name ||
                                        shipment.courier_type
                                    }
                                />
                                <Info
                                    label="Tipe"
                                    value={shipment.delivery_type}
                                />
                                <Info
                                    label="Biaya"
                                    value={rupiah(shipment.price)}
                                />
                                <Info
                                    label="Estimasi"
                                    value={shipment.duration || '—'}
                                />
                                <Info
                                    label="ID Biteship"
                                    value={shipment.biteship_order_id || '—'}
                                />
                                <Info
                                    label="Status provider"
                                    value={shipment.biteship_status || '—'}
                                />
                                <Info
                                    label="Nomor tracking"
                                    value={shipment.tracking_id || '—'}
                                />
                                <Info
                                    label="Resi"
                                    value={shipment.waybill_id || '—'}
                                />
                            </div>
                            {shipment.courier_link && (
                                <a
                                    href={shipment.courier_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary text-sm underline"
                                >
                                    Buka pelacakan kurir
                                </a>
                            )}
                            <p className="text-sm">
                                Isi paket:{' '}
                                {shipment.items
                                    .map(
                                        (item) =>
                                            (item.name || 'Item') +
                                            ' × ' +
                                            item.quantity,
                                    )
                                    .join(', ') || '—'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold">
                                Riwayat pengiriman
                            </h3>
                            {shipment.status_histories.map((event) => (
                                <div
                                    key={event.id}
                                    className="border-l-2 pl-3 text-sm"
                                >
                                    <StatusBadge
                                        value={event.status as ShipmentStatus}
                                    />
                                    <time className="text-muted-foreground ml-2 text-xs">
                                        {formatDate(
                                            event.occurred_at ||
                                                event.created_at,
                                        )}
                                    </time>
                                    {event.description && (
                                        <p className="mt-1">
                                            {event.description}
                                        </p>
                                    )}
                                    {event.provider_status && (
                                        <p className="text-muted-foreground text-xs">
                                            Provider: {event.provider_status}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {!shipment.status_histories.length && (
                                <p className="text-muted-foreground text-sm">
                                    Belum ada riwayat.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
