import type { FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tag,
    TicketPercent,
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
import type { Paginated, Voucher } from '@/types/admin';

type Filters = Partial<
    Record<'search' | 'type' | 'status' | 'sort' | 'sort_direction', string>
>;
type Props = { vouchers: Paginated<Voucher>; filters: Filters };

const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Aktif', value: 'active' },
    { label: 'Terjadwal', value: 'scheduled' },
    { label: 'Kedaluwarsa', value: 'expired' },
    { label: 'Nonaktif', value: 'inactive' },
];
const selectClass =
    'border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4';

export default function VouchersIndex({ vouchers, filters }: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.vouchers.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };
    const applyStatus = (status: string) =>
        router.get(
            admin.vouchers.index(),
            { ...filters, status },
            { preserveState: true, replace: true },
        );
    const sortBy = (sort: string) =>
        router.get(
            admin.vouchers.index(),
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
            <Head title="Voucher" />
            <AdminListLayout
                title="Voucher"
                description="Pantau masa berlaku, pemakaian, dan nilai setiap voucher toko."
                icon={TicketPercent}
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            key={JSON.stringify(filters)}
                            onSubmit={submit}
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Kode / Nama Voucher
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari kode atau nama voucher"
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Tag className="text-primary size-4" /> Tipe
                                    Voucher
                                </span>
                                <select
                                    name="type"
                                    defaultValue={filters.type ?? ''}
                                    className={selectClass}
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="fixed">
                                        Potongan Tetap
                                    </option>
                                    <option value="percentage">
                                        Persentase
                                    </option>
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Status Masa Berlaku
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
                                onClick={() =>
                                    router.get(admin.vouchers.index())
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
                            label="Filter status voucher"
                            tabs={tabs}
                            active={filters.status ?? ''}
                            onChange={applyStatus}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <SortableHeading
                                            label="Kode"
                                            field="code"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Nama"
                                            field="name"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Tipe"
                                            field="type"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Nilai"
                                            field="value"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Pemakaian
                                        </th>
                                        <SortableHeading
                                            label="Mulai"
                                            field="starts_at"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Berakhir"
                                            field="ends_at"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {vouchers.data.map((voucher) => (
                                        <tr
                                            key={voucher.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="text-foreground px-4 py-3.5 font-bold">
                                                {voucher.code}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium">
                                                {voucher.name}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {voucher.type === 'percentage'
                                                    ? 'Persentase'
                                                    : 'Potongan Tetap'}
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold">
                                                {voucher.type === 'percentage'
                                                    ? `${voucher.value}%`
                                                    : rupiah(voucher.value)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {voucher.usages_count}
                                                {voucher.usage_limit === null
                                                    ? ' / ∞'
                                                    : ` / ${voucher.usage_limit}`}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                {formatDate(voucher.starts_at)}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                {formatDate(voucher.ends_at)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge
                                                    value={voucher.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {vouchers.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="text-muted-foreground p-10 text-center text-sm"
                                            >
                                                Voucher tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {vouchers.meta.from ?? 0}–
                                    {vouchers.meta.to ?? 0} dari{' '}
                                    {vouchers.meta.total} voucher
                                </p>
                                <Pagination links={vouchers.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
        </>
    );
}

VouchersIndex.layout = {
    breadcrumbs: [{ title: 'Voucher', href: admin.vouchers.index() }],
};
