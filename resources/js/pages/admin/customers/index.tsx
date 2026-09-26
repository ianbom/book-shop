import type { FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    RotateCcw,
    Search,
    ShoppingBag,
    SlidersHorizontal,
    UserRound,
} from 'lucide-react';
import { AdminListFilterErrors } from '@/components/admin/shared/admin-list-filter-errors';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { Pagination } from '@/components/admin/shared/pagination';
import { SortableHeading } from '@/components/admin/shared/sortable-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Customer, Paginated } from '@/types/admin';

type Filters = Partial<
    Record<
        | 'search'
        | 'verification_status'
        | 'date_from'
        | 'date_to'
        | 'sort'
        | 'sort_direction',
        string
    >
>;
type Props = { customers: Paginated<Customer>; filters: Filters };

const selectClass =
    'border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4';

export default function CustomersIndex({ customers, filters }: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.customers.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };
    const sortBy = (sort: string) =>
        router.get(
            admin.customers.index(),
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
            <Head title="Customer" />
            <AdminListLayout
                title="Customer"
                description="Lihat profil dan aktivitas belanja setiap customer."
                icon={UserRound}
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            key={JSON.stringify(filters)}
                            onSubmit={submit}
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1.1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Nama / Email / Telepon
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari customer"
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
                                <span>Status Verifikasi</span>
                                <select
                                    name="verification_status"
                                    defaultValue={
                                        filters.verification_status ?? ''
                                    }
                                    className={selectClass}
                                >
                                    <option value="">Semua Customer</option>
                                    <option value="verified">
                                        Terverifikasi
                                    </option>
                                    <option value="unverified">
                                        Belum Terverifikasi
                                    </option>
                                </select>
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    router.get(admin.customers.index())
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
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <SortableHeading
                                            label="Nama"
                                            field="name"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Email"
                                            field="email"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Telepon"
                                            field="phone"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Verifikasi
                                        </th>
                                        <SortableHeading
                                            label="Pesanan"
                                            field="orders_count"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                            align="right"
                                        />
                                        <SortableHeading
                                            label="Saldo Wallet"
                                            field="wallet_balance"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                            align="right"
                                        />
                                        <SortableHeading
                                            label="Bergabung"
                                            field="created_at"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {customers.data.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="text-foreground px-4 py-3.5 font-semibold">
                                                {customer.name}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {customer.email}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {customer.phone ?? '-'}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={
                                                        customer.email_verified_at
                                                            ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                                                            : 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700'
                                                    }
                                                >
                                                    {customer.email_verified_at
                                                        ? 'Terverifikasi'
                                                        : 'Belum terverifikasi'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="inline-flex items-center justify-end gap-1.5">
                                                    <ShoppingBag className="text-muted-foreground size-3.5" />
                                                    {customer.orders_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-semibold">
                                                {rupiah(
                                                    customer.wallet_balance,
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {formatDate(
                                                    customer.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {customers.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-muted-foreground px-4 py-12 text-center"
                                            >
                                                Customer tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {customers.meta.from ?? 0}–
                                    {customers.meta.to ?? 0} dari{' '}
                                    {customers.meta.total} customer
                                </p>
                                <Pagination links={customers.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [{ title: 'Customer', href: admin.customers.index() }],
};
