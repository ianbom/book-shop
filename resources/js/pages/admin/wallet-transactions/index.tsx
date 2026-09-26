import type { FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    CircleDollarSign,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Wallet,
} from 'lucide-react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { AdminListFilterErrors } from '@/components/admin/shared/admin-list-filter-errors';
import { AdminListTabs } from '@/components/admin/shared/admin-list-tabs';
import { Pagination } from '@/components/admin/shared/pagination';
import { SortableHeading } from '@/components/admin/shared/sortable-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type {
    Paginated,
    WalletTransaction,
    WalletTransactionType,
} from '@/types/admin';

type Filters = Partial<
    Record<
        | 'search'
        | 'type'
        | 'direction'
        | 'date_from'
        | 'date_to'
        | 'sort'
        | 'sort_direction',
        string
    >
>;
type Props = { transactions: Paginated<WalletTransaction>; filters: Filters };

const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Masuk', value: 'credit' },
    { label: 'Keluar', value: 'debit' },
];
const types: Record<WalletTransactionType, string> = {
    topup_credit: 'Top-up',
    order_payment: 'Pembayaran Pesanan',
    order_refund: 'Pengembalian Pesanan',
    admin_adjustment_credit: 'Penyesuaian Masuk',
    admin_adjustment_debit: 'Penyesuaian Keluar',
};
const selectClass =
    'border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4';

export default function WalletTransactionsIndex({
    transactions,
    filters,
}: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.walletTransactions.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };
    const applyDirection = (direction: string) =>
        router.get(
            admin.walletTransactions.index(),
            { ...filters, direction },
            { preserveState: true, replace: true },
        );
    const sortBy = (sort: string) =>
        router.get(
            admin.walletTransactions.index(),
            {
                ...filters,
                sort,
                sort_direction:
                    filters.sort === sort && filters.sort_direction === 'asc'
                        ? 'desc'
                        : 'asc',
            },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Transaksi Wallet" />
            <AdminListLayout
                title="Transaksi Wallet"
                description="Lacak setiap saldo masuk, keluar, dan perubahan saldo pelanggan."
                icon={Wallet}
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            key={JSON.stringify(filters)}
                            onSubmit={submit}
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Pelanggan / Referensi
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari nama atau kode transaksi"
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Dari Tanggal
                                </span>
                                <Input
                                    type="date"
                                    name="date_from"
                                    defaultValue={filters.date_from ?? ''}
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
                                    defaultValue={filters.date_to ?? ''}
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CircleDollarSign className="text-primary size-4" />{' '}
                                    Jenis Transaksi
                                </span>
                                <select
                                    name="type"
                                    defaultValue={filters.type ?? ''}
                                    className={selectClass}
                                >
                                    <option value="">Semua Jenis</option>
                                    {Object.entries(types).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Wallet className="text-primary size-4" />{' '}
                                    Arah Saldo
                                </span>
                                <select
                                    name="direction"
                                    defaultValue={filters.direction ?? ''}
                                    className={selectClass}
                                >
                                    <option value="">Semua Arah</option>
                                    <option value="credit">Masuk</option>
                                    <option value="debit">Keluar</option>
                                </select>
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    router.get(admin.walletTransactions.index())
                                }
                                className="h-10 px-4"
                            >
                                <RotateCcw /> Reset
                            </Button>
                            <Button type="submit" className="h-10 px-5">
                                <SlidersHorizontal /> Terapkan Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AdminListFilterErrors />
                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <AdminListTabs
                            label="Filter arah transaksi wallet"
                            tabs={tabs}
                            active={filters.direction ?? ''}
                            onChange={applyDirection}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1020px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th scope="col" className="px-4 py-4">
                                            Pelanggan
                                        </th>
                                        <SortableHeading
                                            label="Jenis"
                                            field="type"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Referensi
                                        </th>
                                        <SortableHeading
                                            label="Arah"
                                            field="direction"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Nominal"
                                            field="amount"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Saldo Sebelum / Sesudah
                                        </th>
                                        <SortableHeading
                                            label="Tanggal"
                                            field="created_at"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {transactions.data.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold">
                                                    {transaction.user?.name ??
                                                        '-'}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {transaction.user?.email ??
                                                        '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 font-medium">
                                                {types[transaction.type]}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {transaction.order_code ??
                                                    transaction.topup_code ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        transaction.direction ===
                                                        'credit'
                                                            ? 'bg-success/10 text-success'
                                                            : 'bg-warning/10 text-warning'
                                                    }
                                                >
                                                    {transaction.direction ===
                                                    'credit'
                                                        ? 'Masuk'
                                                        : 'Keluar'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 font-bold">
                                                {rupiah(transaction.amount)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {rupiah(
                                                    transaction.balance_before,
                                                )}{' '}
                                                /{' '}
                                                {rupiah(
                                                    transaction.balance_after,
                                                )}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                {formatDate(
                                                    transaction.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-muted-foreground p-10 text-center text-sm"
                                            >
                                                Transaksi wallet tidak
                                                ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {transactions.meta.from ?? 0}–
                                    {transactions.meta.to ?? 0} dari{' '}
                                    {transactions.meta.total} transaksi
                                </p>
                                <Pagination links={transactions.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
        </>
    );
}

WalletTransactionsIndex.layout = {
    breadcrumbs: [
        { title: 'Transaksi Wallet', href: admin.walletTransactions.index() },
    ],
};
