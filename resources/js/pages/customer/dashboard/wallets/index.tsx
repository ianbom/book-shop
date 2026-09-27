import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    CalendarDays,
    Clock3,
    Plus,
    Search,
    SlidersHorizontal,
    Wallet,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { Pagination } from '@/components/admin/shared/pagination';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import InputError from '@/components/input-error';
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
import { formatDate, rupiah } from '@/lib/format';
import type { WalletTransactionType } from '@/types/admin';
import type {
    CustomerBankAccount,
    CustomerDashboardPage,
    CustomerWalletTopup,
    CustomerWalletTransaction,
} from '@/types/customer-dashboard';

const url = '/customer/dashboard/wallets';
const transactionTypes: Record<WalletTransactionType, string> = {
    topup_credit: 'Top-up saldo',
    order_payment: 'Pembayaran pesanan',
    order_refund: 'Pengembalian dana',
    admin_adjustment_credit: 'Penyesuaian saldo',
    admin_adjustment_debit: 'Penyesuaian saldo',
};
const topupPresets = [20000, 50000, 100000, 200000];

type Filters = Partial<
    Record<'search' | 'type' | 'direction' | 'date_from' | 'date_to', string>
>;

export default function WalletsIndex({
    balance,
    transactions,
    topups,
    bankAccounts,
    filters,
}: {
    balance: string;
    transactions: CustomerDashboardPage<CustomerWalletTransaction>;
    topups: CustomerDashboardPage<CustomerWalletTopup>;
    bankAccounts: CustomerBankAccount[];
    filters: Filters;
}) {
    const [topupOpen, setTopupOpen] = useState(false);
    const form = useForm<{
        requested_amount: string;
        proof_image: File | null;
    }>({
        requested_amount: '',
        proof_image: null,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            url,
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };

    const submitTopup = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/customer/dashboard/wallets/top-ups', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setTopupOpen(false);
            },
        });
    };

    return (
        <>
            <Head title="Saldo Saya" />
            <AdminListLayout
                title="Saldo"
                description="Pantau saldo dan setiap transaksi yang tercatat di akun Anda."
                icon={Wallet}
                dashboardHref="/customer/dashboard/orders"
                eyebrow="Akun Saya"
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <p className="text-muted-foreground text-xs font-bold tracking-[0.12em] uppercase">
                                Saldo saat ini
                            </p>
                            <p className="font-heading text-foreground mt-1 text-3xl font-bold">
                                {rupiah(balance)}
                            </p>
                        </div>
                        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
                            <Wallet className="size-6" />
                        </span>
                        <Button
                            type="button"
                            onClick={() => setTopupOpen(true)}
                        >
                            <Plus /> Top-up Saldo
                        </Button>
                    </CardContent>
                </Card>
                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="border-b px-4 py-4 sm:px-5">
                            <h2 className="font-heading text-foreground text-xl font-bold">
                                Pengajuan Top-up
                            </h2>
                            <p className="text-muted-foreground text-xs">
                                Status dan catatan verifikasi top-up Anda.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3">Kode</th>
                                        <th className="px-4 py-3">Nominal</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">
                                            Catatan Admin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y">
                                    {topups.data.map((topup) => (
                                        <tr
                                            key={topup.id}
                                            className="hover:bg-muted/45"
                                        >
                                            <td className="text-muted-foreground px-4 py-3">
                                                {topup.created_at
                                                    ? formatDate(
                                                          topup.created_at,
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {topup.topup_code}
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {rupiah(topup.requested_amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    value={topup.status}
                                                />
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3">
                                                {topup.admin_note || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {topups.data.length === 0 && (
                                <p className="text-muted-foreground p-8 text-center text-sm">
                                    Belum ada pengajuan. Ajukan top-up untuk
                                    mulai mengisi saldo.
                                </p>
                            )}
                        </div>
                        <div className="border-t px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {topups.from ?? 0}–
                                    {topups.to ?? 0} dari {topups.total}{' '}
                                    pengajuan
                                </p>
                                <Pagination links={topups.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            onSubmit={submit}
                            className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Kode Pesanan / Top-up
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Cari transaksi"
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <ArrowLeftRight className="text-primary size-4" />{' '}
                                    Jenis Transaksi
                                </span>
                                <select
                                    name="type"
                                    defaultValue={filters.type ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua Jenis</option>
                                    {Object.entries(transactionTypes).map(
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
                                    <SlidersHorizontal className="text-primary size-4" />{' '}
                                    Arah
                                </span>
                                <select
                                    name="direction"
                                    defaultValue={filters.direction ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua</option>
                                    <option value="credit">Dana masuk</option>
                                    <option value="debit">Dana keluar</option>
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Dari Tanggal
                                </span>
                                <Input
                                    type="date"
                                    name="date_from"
                                    defaultValue={filters.date_from}
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
                                    defaultValue={filters.date_to}
                                    className="bg-background h-10"
                                />
                            </label>
                            <Button type="submit" className="h-10">
                                <Search /> Cari
                            </Button>
                            <Button
                                asChild
                                type="button"
                                variant="outline"
                                className="h-10"
                            >
                                <Link href={url}>Reset</Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="border-b bg-white px-4 py-4 sm:px-5">
                            <h2 className="font-heading text-foreground text-xl font-bold">
                                Riwayat Transaksi
                            </h2>
                            <p className="text-muted-foreground text-xs">
                                Mutasi saldo masuk dan keluar.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Tanggal</th>
                                        <th className="px-4 py-4">Transaksi</th>
                                        <th className="px-4 py-4">Referensi</th>
                                        <th className="px-4 py-4">Jumlah</th>
                                        <th className="px-4 py-4">
                                            Saldo Setelahnya
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {transactions.data.map((transaction) => {
                                        const isCredit =
                                            transaction.direction === 'credit';
                                        return (
                                            <tr
                                                key={transaction.id}
                                                className="hover:bg-muted/45 transition-colors"
                                            >
                                                <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                    {formatDate(
                                                        transaction.created_at,
                                                    )}
                                                </td>
                                                <td className="text-foreground px-4 py-3.5 font-semibold">
                                                    {
                                                        transactionTypes[
                                                            transaction.type
                                                        ]
                                                    }
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5 text-xs">
                                                    {transaction.order_code ??
                                                        transaction.topup_code ??
                                                        '—'}
                                                </td>
                                                <td
                                                    className={`px-4 py-3.5 font-bold ${isCredit ? 'text-success' : 'text-destructive'}`}
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        {isCredit ? (
                                                            <ArrowDownLeft className="size-4" />
                                                        ) : (
                                                            <ArrowUpRight className="size-4" />
                                                        )}
                                                        {isCredit ? '+' : '−'}
                                                        {rupiah(
                                                            transaction.amount,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="text-foreground px-4 py-3.5 font-semibold">
                                                    {rupiah(
                                                        transaction.balance_after,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {transactions.data.length === 0 && (
                                <p className="text-muted-foreground p-10 text-center text-sm">
                                    Transaksi belum tersedia.
                                </p>
                            )}
                        </div>
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {transactions.from ?? 0}–
                                    {transactions.to ?? 0} dari{' '}
                                    {transactions.total} transaksi
                                </p>
                                <Pagination links={transactions.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
            <Dialog
                open={topupOpen}
                onOpenChange={(open) => {
                    setTopupOpen(open);
                    if (!open) form.clearErrors();
                }}
            >
                <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajukan Top-up Saldo</DialogTitle>
                        <DialogDescription>
                            Pilih nominal, lalu unggah bukti transfer untuk
                            dikirim ke admin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="border-warning/40 bg-warning/10 text-foreground flex gap-3 rounded-md border p-3 text-sm">
                        <Clock3 className="text-warning mt-0.5 size-4 shrink-0" />
                        {bankAccounts.length > 0 ? (
                            <div className="grid w-full gap-3">
                                <p>Transfer ke salah satu rekening berikut:</p>
                                <ul className="grid gap-2">
                                    {bankAccounts.map((account, index) => (
                                        <li
                                            key={`${account.bank_name}-${account.account_number}-${index}`}
                                            className="bg-background/80 grid gap-2 rounded-md border p-3 sm:grid-cols-2"
                                        >
                                            <p className="font-semibold sm:col-span-2">
                                                {account.bank_name}
                                            </p>
                                            <p>
                                                <span className="text-muted-foreground block text-xs">
                                                    Pemilik rekening
                                                </span>
                                                {account.account_holder}
                                            </p>
                                            <p>
                                                <span className="text-muted-foreground block text-xs">
                                                    Nomor rekening
                                                </span>
                                                <span className="font-mono tabular-nums">
                                                    {account.account_number}
                                                </span>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p>
                                Rekening toko belum tersedia. Gunakan instruksi
                                pembayaran resmi dari admin; pengajuan dan bukti
                                tetap dapat dikirim.
                            </p>
                        )}
                    </div>
                    <form onSubmit={submitTopup} className="grid gap-5">
                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-semibold">
                                Pilih nominal
                            </legend>
                            <div className="grid grid-cols-2 gap-2">
                                {topupPresets.map((amount) => (
                                    <Button
                                        key={amount}
                                        type="button"
                                        variant={
                                            form.data.requested_amount ===
                                            String(amount)
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'requested_amount',
                                                String(amount),
                                            )
                                        }
                                    >
                                        {rupiah(amount)}
                                    </Button>
                                ))}
                            </div>
                        </fieldset>
                        <label className="grid gap-2 text-sm font-semibold">
                            Nominal lain (Rp)
                            <Input
                                type="number"
                                min="1"
                                max="9999999999999"
                                step="1"
                                inputMode="numeric"
                                value={form.data.requested_amount}
                                onChange={(event) =>
                                    form.setData(
                                        'requested_amount',
                                        event.target.value,
                                    )
                                }
                                placeholder="Masukkan nominal"
                                required
                            />
                            <InputError
                                message={form.errors.requested_amount}
                            />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                            Foto bukti transfer
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                required
                                onChange={(event) =>
                                    form.setData(
                                        'proof_image',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <span className="text-muted-foreground text-xs font-normal">
                                JPG, PNG, atau WebP; maksimal 5 MB.
                            </span>
                            <InputError message={form.errors.proof_image} />
                        </label>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={
                                    form.processing || !form.data.proof_image
                                }
                            >
                                {form.processing
                                    ? 'Mengirim…'
                                    : 'Kirim Pengajuan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

WalletsIndex.layout = { breadcrumbs: [{ title: 'Saldo', href: url }] };
