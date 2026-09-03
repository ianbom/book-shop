import { BookOpen, CreditCard, Hash, Package } from 'lucide-react';
import { rupiah } from '@/lib/format';
import { orderStatusLabels, paymentStatusLabels } from '@/lib/order-status';
import type { CustomerTrackedOrder } from '@/types/customer';

export function OrderSummary({ order }: { order: CustomerTrackedOrder }) {
    const details = [
        ['Harga Satuan', rupiah(order.unit_price)],
        ['Jumlah', String(order.quantity) + ' buku'],
        ['Subtotal', rupiah(order.subtotal)],
        ['Biaya Pengiriman', rupiah(order.shipping_cost)],
    ];

    return (
        <section
            className="border-border bg-background border p-5 sm:p-7"
            aria-labelledby="order-summary-title"
        >
            <div className="border-border flex items-start justify-between gap-4 border-b pb-5">
                <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                        Ringkasan Pesanan
                    </p>
                    <h2
                        id="order-summary-title"
                        className="font-heading text-foreground mt-2 text-2xl font-semibold"
                    >
                        {order.book_title}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {order.book_author || 'Penulis tidak tercantum'}
                    </p>
                </div>
                <BookOpen
                    className="text-foreground mt-1 size-6 shrink-0"
                    aria-hidden="true"
                />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
                <div className="flex gap-3">
                    <Hash
                        className="text-muted-foreground size-4"
                        aria-hidden="true"
                    />
                    <dt className="text-muted-foreground">Kode Order</dt>
                    <dd className="ml-auto font-semibold">
                        {order.order_code}
                    </dd>
                </div>
                <div className="flex gap-3">
                    <Package
                        className="text-muted-foreground size-4"
                        aria-hidden="true"
                    />
                    <dt className="text-muted-foreground">ISBN</dt>
                    <dd className="ml-auto text-right">
                        {order.book_isbn || '-'}
                    </dd>
                </div>
                <div className="flex gap-3">
                    <CreditCard
                        className="text-muted-foreground size-4"
                        aria-hidden="true"
                    />
                    <dt className="text-muted-foreground">Pembayaran</dt>
                    <dd className="ml-auto font-medium">
                        {paymentStatusLabels[order.payment_status]}
                    </dd>
                </div>
            </dl>
            <div className="border-border mt-6 border-y py-4 text-sm">
                {details.map(([label, value]) => (
                    <div
                        key={label}
                        className="flex justify-between gap-4 py-1.5"
                    >
                        <span className="text-muted-foreground">{label}</span>
                        <span>{value}</span>
                    </div>
                ))}
                <div className="border-border text-foreground mt-2 flex justify-between gap-4 border-t pt-3 text-base font-bold">
                    <span>Total</span>
                    <span>{rupiah(order.total)}</span>
                </div>
            </div>
            <div className="border-foreground bg-secondary mt-5 border-l-2 px-4 py-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
                    Status Saat Ini
                </p>
                <p className="font-heading text-foreground mt-1 text-xl font-semibold">
                    {orderStatusLabels[order.status]}
                </p>
            </div>
        </section>
    );
}
