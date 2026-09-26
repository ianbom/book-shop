import type { FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    CircleDollarSign,
    CreditCard,
    RotateCcw,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { AdminListFilterErrors } from '@/components/admin/shared/admin-list-filter-errors';
import { AdminListTabs } from '@/components/admin/shared/admin-list-tabs';
import { Pagination } from '@/components/admin/shared/pagination';
import { SortableHeading } from '@/components/admin/shared/sortable-heading';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated, WalletTopup } from '@/types/admin';

type Filters = Partial<
    Record<
        | 'search'
        | 'status'
        | 'date_from'
        | 'date_to'
        | 'sort'
        | 'sort_direction',
        string
    >
>;
type Props = { topups: Paginated<WalletTopup>; filters: Filters };

const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Menunggu', value: 'pending' },
    { label: 'Disetujui', value: 'approved' },
    { label: 'Ditolak', value: 'rejected' },
];
const selectClass =
    'border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4';

export default function TopupsIndex({ topups, filters }: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.topUps.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };
    const applyStatus = (status: string) =>
        router.get(
            admin.topUps.index(),
            { ...filters, status },
            { preserveState: true, replace: true },
        );
    const sortBy = (sort: string) =>
        router.get(
            admin.topUps.index(),
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
            <Head title="Permintaan Top-up" />
            <AdminListLayout
                title="Permintaan Top-up"
                description="Tinjau riwayat permintaan pengisian saldo pelanggan."
                icon={CreditCard}
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            key={JSON.stringify(filters)}
                            onSubmit={submit}
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Kode / Pelanggan
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari kode atau nama pelanggan"
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
                                    Status
                                </span>
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className={selectClass}
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
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.get(admin.topUps.index())}
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
                            label="Filter status permintaan top-up"
                            tabs={tabs}
                            active={filters.status ?? ''}
                            onChange={applyStatus}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <SortableHeading
                                            label="Kode Top-up"
                                            field="topup_code"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Pelanggan
                                        </th>
                                        <SortableHeading
                                            label="Diminta"
                                            field="requested_amount"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Dikreditkan
                                        </th>
                                        <SortableHeading
                                            label="Status"
                                            field="status"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Pemeriksa
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
                                    {topups.data.map((topup) => (
                                        <tr
                                            key={topup.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="text-foreground px-4 py-3.5 font-bold">
                                                {topup.topup_code}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold">
                                                    {topup.user?.name ?? '-'}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {topup.user?.email ?? '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 font-bold">
                                                {rupiah(topup.requested_amount)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {topup.credited_amount
                                                    ? rupiah(
                                                          topup.credited_amount,
                                                      )
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge
                                                    value={topup.status}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {topup.reviewer ?? '-'}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                {formatDate(topup.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                    {topups.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-muted-foreground p-10 text-center text-sm"
                                            >
                                                Permintaan top-up tidak
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
                                    Menampilkan {topups.meta.from ?? 0}–
                                    {topups.meta.to ?? 0} dari{' '}
                                    {topups.meta.total} permintaan
                                </p>
                                <Pagination links={topups.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
        </>
    );
}

TopupsIndex.layout = {
    breadcrumbs: [{ title: 'Permintaan Top-up', href: admin.topUps.index() }],
};
