import type { FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    PackageCheck,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Truck,
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
import type { Paginated, Shipment } from '@/types/admin';

type Filters = Partial<
    Record<
        | 'search'
        | 'status'
        | 'delivery_type'
        | 'date_from'
        | 'date_to'
        | 'sort'
        | 'sort_direction',
        string
    >
>;
type Props = { shipments: Paginated<Shipment>; filters: Filters };

const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Dipesan', value: 'booked' },
    { label: 'Penjemputan', value: 'pickup' },
    { label: 'Pengiriman', value: 'in_transit' },
    { label: 'Terkirim', value: 'delivered' },
    { label: 'Dibatalkan', value: 'cancelled' },
    { label: 'Gagal', value: 'failed' },
];
const selectClass =
    'border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4';

export default function ShipmentsIndex({ shipments, filters }: Props) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.shipments.index(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };
    const applyStatus = (status: string) =>
        router.get(
            admin.shipments.index(),
            { ...filters, status },
            { preserveState: true, replace: true },
        );
    const sortBy = (sort: string) =>
        router.get(
            admin.shipments.index(),
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
            <Head title="Shipment" />
            <AdminListLayout
                title="Shipment"
                description="Pantau kurir, resi, dan perjalanan setiap pengiriman pelanggan."
                icon={PackageCheck}
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
                                    Kode / Pelanggan / Resi
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari shipment atau pelanggan"
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
                                    <PackageCheck className="text-primary size-4" />{' '}
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
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Truck className="text-primary size-4" />{' '}
                                    Jenis Pengiriman
                                </span>
                                <select
                                    name="delivery_type"
                                    defaultValue={filters.delivery_type ?? ''}
                                    className={selectClass}
                                >
                                    <option value="">Semua Jenis</option>
                                    <option value="now">Sekarang</option>
                                    <option value="scheduled">Terjadwal</option>
                                </select>
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    router.get(admin.shipments.index())
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
                            label="Filter status shipment"
                            tabs={tabs}
                            active={filters.status ?? ''}
                            onChange={applyStatus}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1020px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <SortableHeading
                                            label="Shipment"
                                            field="shipment_code"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Order / Pelanggan
                                        </th>
                                        <SortableHeading
                                            label="Kurir"
                                            field="courier_company"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Ongkir"
                                            field="price"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <th scope="col" className="px-4 py-4">
                                            Resi
                                        </th>
                                        <SortableHeading
                                            label="Tanggal"
                                            field="created_at"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                        <SortableHeading
                                            label="Status"
                                            field="status"
                                            sort={filters.sort}
                                            direction={filters.sort_direction}
                                            onSort={sortBy}
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {shipments.data.map((shipment) => (
                                        <tr
                                            key={shipment.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="text-foreground px-4 py-3.5 font-bold">
                                                {shipment.shipment_code}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold">
                                                    {shipment.order
                                                        ?.order_code ?? '-'}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {shipment.order
                                                        ?.customer_name ?? '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold uppercase">
                                                    {shipment.courier_company}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {shipment.courier_service_name ??
                                                        shipment.courier_type}{' '}
                                                    ·{' '}
                                                    {shipment.delivery_type ===
                                                    'scheduled'
                                                        ? 'Terjadwal'
                                                        : 'Sekarang'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold">
                                                {rupiah(shipment.price)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {shipment.waybill_id ??
                                                    shipment.tracking_id ??
                                                    '-'}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                {formatDate(
                                                    shipment.created_at,
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge
                                                    value={shipment.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {shipments.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-muted-foreground p-10 text-center text-sm"
                                            >
                                                Shipment tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {shipments.meta.from ?? 0}–
                                    {shipments.meta.to ?? 0} dari{' '}
                                    {shipments.meta.total} shipment
                                </p>
                                <Pagination links={shipments.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
        </>
    );
}

ShipmentsIndex.layout = {
    breadcrumbs: [{ title: 'Shipment', href: admin.shipments.index() }],
};
