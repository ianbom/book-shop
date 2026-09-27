import { useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    CircleDollarSign,
    CreditCard,
    Eye,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
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
    const [selectedTopup, setSelectedTopup] = useState<WalletTopup | null>(
        null,
    );
    const [detailOpen, setDetailOpen] = useState(false);
    const form = useForm({
        status: 'approved' as 'approved' | 'rejected',
        credited_amount: '',
        admin_note: '',
    });

    const openDetail = (topup: WalletTopup) => {
        setSelectedTopup(topup);
        form.clearErrors();
        form.setData({
            status: 'approved',
            credited_amount:
                topup.credited_amount?.replace(/\.00$/, '') ??
                topup.requested_amount.replace(/\.00$/, ''),
            admin_note: topup.admin_note ?? '',
        });
        setDetailOpen(true);
    };

    const reviewTopup = (status: 'approved' | 'rejected') => {
        if (!selectedTopup) return;
        form.transform((data) =>
            status === 'approved'
                ? { ...data, status }
                : { status, admin_note: data.admin_note },
        );
        form.patch(`/admin/top-ups/${selectedTopup.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDetailOpen(false);
                setSelectedTopup(null);
                form.reset();
            },
            onFinish: () => form.transform((data) => data),
        });
    };

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
                                        <th scope="col" className="px-4 py-4">
                                            Aksi
                                        </th>
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
                                            <td className="px-4 py-3.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openDetail(topup)
                                                    }
                                                    aria-label={`Lihat detail ${topup.topup_code}`}
                                                >
                                                    <Eye /> Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {topups.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
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
            <Dialog
                open={detailOpen}
                onOpenChange={(open) => {
                    if (form.processing) return;
                    setDetailOpen(open);
                    if (!open) {
                        setSelectedTopup(null);
                        form.clearErrors();
                    }
                }}
            >
                {selectedTopup && (
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Detail {selectedTopup.topup_code}
                            </DialogTitle>
                            <DialogDescription>
                                Periksa bukti dan data transfer sebelum
                                memproses permintaan.
                            </DialogDescription>
                        </DialogHeader>
                        <dl className="grid gap-x-6 gap-y-4 rounded-md border p-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-muted-foreground text-xs">
                                    Pelanggan
                                </dt>
                                <dd className="font-semibold">
                                    {selectedTopup.user?.name ?? '—'}
                                </dd>
                                <dd className="text-muted-foreground text-xs">
                                    {selectedTopup.user?.email ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">
                                    Status
                                </dt>
                                <dd className="mt-1">
                                    <StatusBadge value={selectedTopup.status} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">
                                    Nominal diminta
                                </dt>
                                <dd className="font-semibold">
                                    {rupiah(selectedTopup.requested_amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">
                                    Saldo dikreditkan
                                </dt>
                                <dd className="font-semibold">
                                    {selectedTopup.credited_amount
                                        ? rupiah(selectedTopup.credited_amount)
                                        : 'Belum dikreditkan'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">
                                    Tanggal pengajuan
                                </dt>
                                <dd>{formatDate(selectedTopup.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">
                                    Pemeriksa
                                </dt>
                                <dd>
                                    {selectedTopup.reviewer ??
                                        'Belum diperiksa'}
                                </dd>
                            </div>
                        </dl>
                        <div className="grid gap-2">
                            <p className="text-sm font-semibold">
                                Bukti transfer
                            </p>
                            <a
                                href={selectedTopup.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-muted flex max-h-80 justify-center overflow-hidden rounded-md border"
                            >
                                <img
                                    src={selectedTopup.proof_url}
                                    alt={`Bukti transfer ${selectedTopup.topup_code}`}
                                    className="max-h-80 max-w-full object-contain"
                                />
                            </a>
                        </div>
                        {selectedTopup.status === 'pending' ? (
                            <div className="grid gap-4">
                                <label className="grid gap-2 text-sm font-semibold">
                                    Saldo aktual diterima (Rp)
                                    <Input
                                        type="number"
                                        min="1"
                                        max="9999999999999"
                                        step="1"
                                        inputMode="numeric"
                                        value={form.data.credited_amount}
                                        onChange={(event) =>
                                            form.setData(
                                                'credited_amount',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <span className="text-muted-foreground text-xs font-normal">
                                        Masukkan nominal yang benar-benar
                                        diterima; boleh berbeda dari nominal
                                        permintaan.
                                    </span>
                                    <InputError
                                        message={form.errors.credited_amount}
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                    Catatan untuk customer
                                    <Textarea
                                        maxLength={2000}
                                        value={form.data.admin_note}
                                        onChange={(event) =>
                                            form.setData(
                                                'admin_note',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Dana diterima Rp98.000."
                                    />
                                    <span className="text-muted-foreground text-xs font-normal">
                                        Catatan wajib diisi jika permintaan
                                        ditolak.
                                    </span>
                                    <InputError
                                        message={form.errors.admin_note}
                                    />
                                    <InputError message={form.errors.status} />
                                </label>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            form.processing ||
                                            !form.data.admin_note.trim()
                                        }
                                        onClick={() => reviewTopup('rejected')}
                                    >
                                        {form.processing
                                            ? 'Memproses…'
                                            : 'Tolak'}
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={
                                            form.processing ||
                                            !form.data.credited_amount ||
                                            Number(form.data.credited_amount) <
                                                1
                                        }
                                        onClick={() => reviewTopup('approved')}
                                    >
                                        {form.processing
                                            ? 'Memproses…'
                                            : 'Terima & Kreditkan Saldo'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <div className="rounded-md border p-4">
                                <p className="text-muted-foreground text-xs">
                                    Catatan admin
                                </p>
                                <p className="mt-1 text-sm whitespace-pre-wrap">
                                    {selectedTopup.admin_note ||
                                        'Tidak ada catatan.'}
                                </p>
                                {selectedTopup.reviewed_at && (
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        Diproses{' '}
                                        {formatDate(selectedTopup.reviewed_at)}
                                    </p>
                                )}
                            </div>
                        )}
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

TopupsIndex.layout = {
    breadcrumbs: [{ title: 'Permintaan Top-up', href: admin.topUps.index() }],
};
