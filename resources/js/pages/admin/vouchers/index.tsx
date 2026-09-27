import type { FormEvent } from 'react';
import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Pencil,
    Plus,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated, Voucher } from '@/types/admin';

type Filters = Partial<
    Record<'search' | 'type' | 'status' | 'sort' | 'sort_direction', string>
>;
type Props = { vouchers: Paginated<Voucher>; filters: Filters };
type VoucherForm = {
    code: string;
    name: string;
    description: string;
    type: 'fixed' | 'percentage';
    value: string;
    max_discount: string;
    min_order_amount: string;
    usage_limit: string;
    per_user_limit: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

const emptyVoucher: VoucherForm = {
    code: '',
    name: '',
    description: '',
    type: 'fixed',
    value: '',
    max_discount: '',
    min_order_amount: '0',
    usage_limit: '',
    per_user_limit: '1',
    starts_at: '',
    ends_at: '',
    is_active: true,
};

function dateInput(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

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
    const [editing, setEditing] = useState<Voucher | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm<VoucherForm>(emptyVoucher);
    const openVoucher = (voucher?: Voucher) => {
        setEditing(voucher ?? null);
        form.clearErrors();
        form.setData(
            voucher
                ? {
                      code: voucher.code,
                      name: voucher.name,
                      description: voucher.description ?? '',
                      type: voucher.type,
                      value: voucher.value,
                      max_discount: voucher.max_discount ?? '',
                      min_order_amount: voucher.min_order_amount,
                      usage_limit: voucher.usage_limit?.toString() ?? '',
                      per_user_limit: voucher.per_user_limit.toString(),
                      starts_at: dateInput(voucher.starts_at),
                      ends_at: dateInput(voucher.ends_at),
                      is_active: voucher.is_active,
                  }
                : { ...emptyVoucher },
        );
        setIsOpen(true);
    };
    const saveVoucher = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            starts_at: data.starts_at
                ? new Date(data.starts_at).toISOString()
                : '',
            ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : '',
        }));
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
                setEditing(null);
                form.reset();
            },
        };
        if (editing) form.patch(`/admin/vouchers/${editing.id}`, options);
        else form.post('/admin/vouchers', options);
    };
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
                <div className="flex justify-end">
                    <Button type="button" onClick={() => openVoucher()}>
                        <Plus className="size-4" /> Tambah Voucher
                    </Button>
                </div>
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
                                        <th
                                            scope="col"
                                            className="px-4 py-4 text-right"
                                        >
                                            Aksi
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
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Edit voucher ${voucher.code}`}
                                                    onClick={() =>
                                                        openVoucher(voucher)
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {vouchers.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={9}
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
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditing(null);
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Voucher' : 'Tambah Voucher'}
                        </DialogTitle>
                        <DialogDescription>
                            Atur diskon dan batas pemakaian voucher.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveVoucher} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-code">
                                    Kode voucher
                                </Label>
                                <Input
                                    id="voucher-code"
                                    value={form.data.code}
                                    maxLength={100}
                                    required
                                    onChange={(event) =>
                                        form.setData('code', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.code)}
                                />
                                <InputError message={form.errors.code} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-name">
                                    Nama voucher
                                </Label>
                                <Input
                                    id="voucher-name"
                                    value={form.data.name}
                                    maxLength={150}
                                    required
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.name)}
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="voucher-description">
                                    Deskripsi
                                </Label>
                                <Textarea
                                    id="voucher-description"
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.description,
                                    )}
                                />
                                <InputError message={form.errors.description} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-type">Tipe</Label>
                                <select
                                    id="voucher-type"
                                    className={selectClass}
                                    value={form.data.type}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            type: event.target
                                                .value as VoucherForm['type'],
                                            max_discount:
                                                event.target.value === 'fixed'
                                                    ? ''
                                                    : data.max_discount,
                                        }))
                                    }
                                >
                                    <option value="fixed">
                                        Potongan tetap
                                    </option>
                                    <option value="percentage">
                                        Persentase
                                    </option>
                                </select>
                                <InputError message={form.errors.type} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-value">
                                    Nilai{' '}
                                    {form.data.type === 'percentage'
                                        ? '(%)'
                                        : '(Rp)'}
                                </Label>
                                <Input
                                    id="voucher-value"
                                    type="number"
                                    min="0.01"
                                    max={
                                        form.data.type === 'percentage'
                                            ? 100
                                            : undefined
                                    }
                                    step="0.01"
                                    value={form.data.value}
                                    required
                                    onChange={(event) =>
                                        form.setData(
                                            'value',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.value)}
                                />
                                <InputError message={form.errors.value} />
                            </div>
                            {form.data.type === 'percentage' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="voucher-max-discount">
                                        Maksimal diskon (Rp)
                                    </Label>
                                    <Input
                                        id="voucher-max-discount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.max_discount}
                                        onChange={(event) =>
                                            form.setData(
                                                'max_discount',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.max_discount,
                                        )}
                                    />
                                    <InputError
                                        message={form.errors.max_discount}
                                    />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-min-order">
                                    Minimum pesanan (Rp)
                                </Label>
                                <Input
                                    id="voucher-min-order"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.min_order_amount}
                                    required
                                    onChange={(event) =>
                                        form.setData(
                                            'min_order_amount',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.min_order_amount,
                                    )}
                                />
                                <InputError
                                    message={form.errors.min_order_amount}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-usage-limit">
                                    Batas pemakaian total
                                </Label>
                                <Input
                                    id="voucher-usage-limit"
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Tanpa batas"
                                    value={form.data.usage_limit}
                                    onChange={(event) =>
                                        form.setData(
                                            'usage_limit',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.usage_limit,
                                    )}
                                />
                                <InputError message={form.errors.usage_limit} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-per-user-limit">
                                    Batas per pelanggan
                                </Label>
                                <Input
                                    id="voucher-per-user-limit"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.data.per_user_limit}
                                    required
                                    onChange={(event) =>
                                        form.setData(
                                            'per_user_limit',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.per_user_limit,
                                    )}
                                />
                                <InputError
                                    message={form.errors.per_user_limit}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-starts-at">
                                    Mulai berlaku
                                </Label>
                                <Input
                                    id="voucher-starts-at"
                                    type="datetime-local"
                                    value={form.data.starts_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'starts_at',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.starts_at,
                                    )}
                                />
                                <InputError message={form.errors.starts_at} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voucher-ends-at">
                                    Berakhir
                                </Label>
                                <Input
                                    id="voucher-ends-at"
                                    type="datetime-local"
                                    min={form.data.starts_at || undefined}
                                    value={form.data.ends_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'ends_at',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.ends_at)}
                                />
                                <InputError message={form.errors.ends_at} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                className="accent-primary size-4"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                            />
                            Voucher aktif
                        </label>
                        <InputError message={form.errors.is_active} />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Menyimpan…'
                                    : 'Simpan Voucher'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

VouchersIndex.layout = {
    breadcrumbs: [{ title: 'Voucher', href: admin.vouchers.index() }],
};
