import { Head, Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { Pagination } from '@/components/admin/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { PaginationLink } from '@/types/admin';

type Page<T> = {
    data: T[];
    meta: {
        total: number;
        from: number | null;
        to: number | null;
        links: PaginationLink[];
    };
};
type Address = {
    id: number;
    label: string;
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
    is_default: boolean;
    deleted: boolean;
};
type Order = {
    id: number;
    order_code: string;
    status: string;
    payment_status: string;
    total: string;
    items_count: number;
    created_at: string | null;
};
type Topup = {
    id: number;
    topup_code: string;
    requested_amount: string;
    credited_amount: string | null;
    status: string;
    reviewed_at: string | null;
    created_at: string | null;
};
type Transaction = {
    id: number;
    type: string;
    direction: string;
    amount: string;
    balance_before: string;
    balance_after: string;
    note: string | null;
    order_code: string | null;
    topup_code: string | null;
    created_at: string | null;
};
type Voucher = {
    id: number;
    code: string | null;
    name: string | null;
    discount_amount: string;
    order_code: string | null;
    created_at: string | null;
};
type CartItem = {
    id: number;
    title: string | null;
    author: string | null;
    quantity: number;
    price: string | null;
};
type Props = {
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        email_verified_at: string | null;
        created_at: string | null;
        wallet_balance: string;
    };
    addresses: Page<Address>;
    orders: Page<Order>;
    topups: Page<Topup>;
    transactions: Page<Transaction>;
    vouchers: Page<Voucher>;
    cartItems: Page<CartItem>;
};
type Tab =
    | 'addresses'
    | 'orders'
    | 'topups'
    | 'transactions'
    | 'vouchers'
    | 'cart';
type Section = {
    title: string;
    columns: string[];
    rows: { id: number; cells: ReactNode[] }[];
    meta: Page<unknown>['meta'];
};

const text = (value: string | null) => value || '—';
const date = (value: string | null) => (value ? formatDate(value) : '—');
const orderLink = (code: string, id: number) => (
    <Link
        href={`/admin/orders/${id}`}
        className="text-primary font-semibold hover:underline"
    >
        {code}
    </Link>
);

export default function CustomerShow({
    customer,
    addresses,
    orders,
    topups,
    transactions,
    vouchers,
    cartItems,
}: Props) {
    const [active, setActive] = useState<Tab>('orders');
    const sections: Record<Tab, Section> = {
        addresses: {
            title: 'Alamat',
            columns: [
                'Label',
                'Penerima',
                'Kontak',
                'Alamat lengkap',
                'Koordinat',
                'Status',
            ],
            meta: addresses.meta,
            rows: addresses.data.map((address) => ({
                id: address.id,
                cells: [
                    address.label,
                    address.recipient_name,
                    <span key="contact">
                        {address.phone}
                        <br />
                        {text(address.email)}
                    </span>,
                    <span key="address">
                        {address.address}
                        <br />
                        {[
                            address.subdistrict,
                            address.district,
                            address.city,
                            address.province,
                            address.postal_code,
                        ]
                            .filter(Boolean)
                            .join(', ')}
                        {address.note && (
                            <>
                                <br />
                                Catatan: {address.note}
                            </>
                        )}
                    </span>,
                    address.latitude && address.longitude
                        ? `${address.latitude}, ${address.longitude}`
                        : '—',
                    address.deleted
                        ? 'Dihapus'
                        : address.is_default
                          ? 'Utama'
                          : 'Aktif',
                ],
            })),
        },
        orders: {
            title: 'Pesanan',
            columns: [
                'Kode order',
                'Tanggal',
                'Buku',
                'Total',
                'Status order',
                'Pembayaran',
            ],
            meta: orders.meta,
            rows: orders.data.map((order) => ({
                id: order.id,
                cells: [
                    orderLink(order.order_code, order.id),
                    date(order.created_at),
                    order.items_count,
                    rupiah(order.total),
                    order.status,
                    order.payment_status,
                ],
            })),
        },
        topups: {
            title: 'Riwayat Top-up',
            columns: [
                'Kode top-up',
                'Tanggal',
                'Pengajuan',
                'Dikreditkan',
                'Status',
                'Ditinjau',
            ],
            meta: topups.meta,
            rows: topups.data.map((topup) => ({
                id: topup.id,
                cells: [
                    topup.topup_code,
                    date(topup.created_at),
                    rupiah(topup.requested_amount),
                    topup.credited_amount ? rupiah(topup.credited_amount) : '—',
                    topup.status,
                    date(topup.reviewed_at),
                ],
            })),
        },
        transactions: {
            title: 'Mutasi Saldo',
            columns: [
                'Tanggal',
                'Jenis',
                'Arus',
                'Jumlah',
                'Saldo awal',
                'Saldo akhir',
                'Referensi',
                'Catatan',
            ],
            meta: transactions.meta,
            rows: transactions.data.map((transaction) => ({
                id: transaction.id,
                cells: [
                    date(transaction.created_at),
                    transaction.type,
                    transaction.direction,
                    rupiah(transaction.amount),
                    rupiah(transaction.balance_before),
                    rupiah(transaction.balance_after),
                    text(transaction.order_code ?? transaction.topup_code),
                    text(transaction.note),
                ],
            })),
        },
        vouchers: {
            title: 'Voucher Digunakan',
            columns: ['Voucher', 'Nama', 'Order', 'Diskon', 'Tanggal'],
            meta: vouchers.meta,
            rows: vouchers.data.map((voucher) => ({
                id: voucher.id,
                cells: [
                    text(voucher.code),
                    text(voucher.name),
                    text(voucher.order_code),
                    rupiah(voucher.discount_amount),
                    date(voucher.created_at),
                ],
            })),
        },
        cart: {
            title: 'Keranjang',
            columns: ['Buku', 'Penulis', 'Jumlah', 'Harga buku'],
            meta: cartItems.meta,
            rows: cartItems.data.map((item) => ({
                id: item.id,
                cells: [
                    text(item.title),
                    text(item.author),
                    item.quantity,
                    item.price ? rupiah(item.price) : '—',
                ],
            })),
        },
    };
    const section = sections[active];

    return (
        <>
            <Head title={`Customer: ${customer.name}`} />
            <AdminListLayout
                title={customer.name}
                description="Profil dan seluruh aktivitas customer."
                icon={UserRound}
            >
                <Button variant="outline" asChild className="self-start">
                    <Link href={admin.customers.index()}>
                        <ArrowLeft className="size-4" /> Kembali ke customer
                    </Link>
                </Button>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="space-y-2 text-sm">
                            <h2 className="font-semibold">Profil</h2>
                            <p>{customer.email}</p>
                            <p>{text(customer.phone)}</p>
                            <p className="text-muted-foreground">
                                Bergabung {date(customer.created_at)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-2 text-sm">
                            <h2 className="font-semibold">Verifikasi email</h2>
                            <p>
                                {customer.email_verified_at
                                    ? 'Terverifikasi'
                                    : 'Belum terverifikasi'}
                            </p>
                            {customer.email_verified_at && (
                                <p className="text-muted-foreground">
                                    {date(customer.email_verified_at)}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-2 text-sm">
                            <h2 className="font-semibold">Saldo dompet</h2>
                            <p className="text-primary text-2xl font-bold">
                                {rupiah(customer.wallet_balance)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div
                    role="tablist"
                    aria-label="Data customer"
                    className="flex flex-wrap gap-2"
                >
                    {(Object.keys(sections) as Tab[]).map((tab) => (
                        <Button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={active === tab}
                            variant={active === tab ? 'default' : 'outline'}
                            onClick={() => setActive(tab)}
                        >
                            {sections[tab].title} ({sections[tab].meta.total})
                        </Button>
                    ))}
                </div>
                <Card role="tabpanel" className="overflow-hidden py-0">
                    <div className="border-b px-5 py-4">
                        <h2 className="font-heading text-lg font-semibold">
                            {section.title}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    {section.columns.map((column) => (
                                        <th
                                            key={column}
                                            scope="col"
                                            className="px-4 py-3 font-semibold"
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {section.rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-muted/30"
                                    >
                                        {row.cells.map((cell, index) => (
                                            <td
                                                key={index}
                                                className="px-4 py-3 align-top"
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {section.rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={section.columns.length}
                                            className="text-muted-foreground px-4 py-12 text-center"
                                        >
                                            Belum ada data{' '}
                                            {section.title.toLowerCase()}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 text-xs">
                        <span className="text-muted-foreground">
                            Menampilkan {section.meta.from ?? 0}–
                            {section.meta.to ?? 0} dari {section.meta.total}
                        </span>
                        <Pagination links={section.meta.links} />
                    </div>
                </Card>
            </AdminListLayout>
        </>
    );
}

CustomerShow.layout = {
    breadcrumbs: [{ title: 'Customer', href: admin.customers.index() }],
};
