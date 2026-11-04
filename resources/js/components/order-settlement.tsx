import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { exactRupiah as rupiah, formatDate } from '@/lib/format';
import type { CustomerBankAccount } from '@/types/customer-dashboard';

export type Settlement = {
    archived: boolean;
    locked: boolean;
    summary: {
        subtotal: string;
        historical_dp: string;
        historical_paid: string;
        approved_paid: string;
        outstanding_books: string;
        shipping_cost: string;
        total: string;
        outstanding: string;
        weight: number;
        shipping_selected: boolean;
        books_paid: boolean;
    };
    submissions: {
        id: number;
        amount: string;
        status: 'pending' | 'approved' | 'rejected';
        reason: string | null;
        bank_account: CustomerBankAccount;
        proof_url: string;
        created_at: string | null;
        reviewed_at: string | null;
    }[];
};
export type SettlementAddress = {
    id: number;
    label: string;
    destination_contact_name: string;
    destination_contact_phone: string | null;
    destination_address: string;
    destination_postal_code: string;
};
export type SettlementBank = CustomerBankAccount & { index: number };
type Rate = {
    courier_company: string;
    courier_type: string;
    courier_service_name: string;
    price: string;
    duration: string | null;
};

export default function OrderSettlement({
    orderId,
    settlement,
    admin = false,
    addresses = [],
    banks = [],
}: {
    orderId: number;
    settlement: Settlement;
    admin?: boolean;
    addresses?: SettlementAddress[];
    banks?: SettlementBank[];
}) {
    const summary = settlement.summary;
    const labels = {
        pending: 'Menunggu pemeriksaan',
        approved: 'Disetujui',
        rejected: 'Ditolak',
    };
    return (
        <div
            className={
                admin
                    ? 'bg-card space-y-5 rounded-xl border p-4 sm:p-5'
                    : 'mt-4 space-y-5'
            }
        >
            {!admin && settlement.archived && (
                <p className="text-muted-foreground text-sm">
                    Arsip historis. Pembayaran dan pengiriman tidak dapat
                    diubah.
                </p>
            )}
            {admin && (
                <>
                    <div>
                        <h2 className="font-heading text-lg font-bold">
                            Pesanan import · Pelunasan transfer
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {settlement.archived
                                ? 'Arsip historis. Tidak menerima pembayaran atau perubahan pengiriman.'
                                : 'DP hanya informasi, bukan pengurang tagihan. Transfer diperiksa admin sebelum pesanan dapat diproses.'}
                        </p>
                    </div>
                    <dl className="grid gap-2 text-sm">
                        {[
                            ['Total net buku', rupiah(summary.subtotal)],
                            [
                                'DP historis (informasi)',
                                rupiah(summary.historical_dp),
                            ],
                            [
                                'Sudah dibayar historis',
                                rupiah(summary.historical_paid),
                            ],
                            [
                                'Transfer disetujui',
                                rupiah(summary.approved_paid),
                            ],
                            ['Sisa buku', rupiah(summary.outstanding_books)],
                            ['Berat total', `${summary.weight} gram`],
                            [
                                'Ongkos kirim',
                                summary.shipping_selected
                                    ? rupiah(summary.shipping_cost)
                                    : settlement.archived
                                      ? 'Historis tidak tersedia'
                                      : 'Belum dipilih',
                            ],
                            [
                                'Sisa pelunasan',
                                `${rupiah(summary.outstanding)}${summary.shipping_selected ? '' : ' (belum termasuk ongkir)'}`,
                            ],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex flex-wrap justify-between gap-x-4 gap-y-1"
                            >
                                <dt>{label}</dt>
                                <dd className="font-semibold">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </>
            )}
            {!admin && !settlement.locked && (
                <CustomerSettlement
                    orderId={orderId}
                    summary={summary}
                    addresses={addresses}
                    banks={banks}
                />
            )}
            {!settlement.archived && settlement.locked && (
                <p className="text-muted-foreground text-sm">
                    {settlement.submissions.some(
                        (submission) => submission.status === 'pending',
                    )
                        ? 'Bukti transfer sedang diperiksa admin.'
                        : 'Pembayaran tidak dapat diajukan untuk kondisi pesanan saat ini.'}
                </p>
            )}
            {settlement.submissions.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold">Riwayat bukti transfer</h3>
                    {settlement.submissions.map((submission) => (
                        <div
                            key={submission.id}
                            className="space-y-2 rounded-lg border p-3 text-sm"
                        >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="font-semibold">
                                    {labels[submission.status]}
                                </p>
                                <p className="font-semibold">
                                    {rupiah(submission.amount)}
                                </p>
                            </div>
                            <p>
                                {submission.bank_account.bank_name} ·{' '}
                                {submission.bank_account.account_number} ·{' '}
                                {submission.bank_account.account_holder}
                            </p>
                            <p className="text-muted-foreground">
                                Diajukan {formatDate(submission.created_at)}
                                {submission.reviewed_at &&
                                    ` · Diperiksa ${formatDate(submission.reviewed_at)}`}
                            </p>
                            {submission.reason && (
                                <p className="break-words">
                                    Alasan: {submission.reason}
                                </p>
                            )}
                            <a
                                href={submission.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                            >
                                Lihat / unduh bukti #{submission.id}
                            </a>
                            {admin &&
                                !settlement.archived &&
                                submission.status === 'pending' && (
                                    <PaymentReview
                                        submissionId={submission.id}
                                    />
                                )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PaymentReview({ submissionId }: { submissionId: number }) {
    const form = useForm({
        status: 'approved' as 'approved' | 'rejected',
        reason: '',
    });
    function submit(event: FormEvent) {
        event.preventDefault();
        if (
            !window.confirm(
                form.data.status === 'approved'
                    ? 'Setujui transfer sesuai bukti dan nominal tagihan? Keputusan tidak dapat diubah.'
                    : 'Tolak bukti transfer ini?',
            )
        )
            return;
        form.patch(`/admin/order-payments/${submissionId}`, {
            preserveScroll: true,
        });
    }
    return (
        <form onSubmit={submit} className="grid gap-2 pt-2">
            <Label htmlFor={`decision-${submissionId}`}>Keputusan</Label>
            <select
                id={`decision-${submissionId}`}
                className="bg-background min-h-10 rounded-md border px-3"
                value={form.data.status}
                onChange={(event) =>
                    form.setData(
                        'status',
                        event.target.value as 'approved' | 'rejected',
                    )
                }
                disabled={form.processing}
            >
                <option value="approved">Setujui</option>
                <option value="rejected">Tolak</option>
            </select>
            <Label htmlFor={`reason-${submissionId}`}>
                Alasan (wajib untuk penolakan, terlihat customer)
            </Label>
            <Textarea
                id={`reason-${submissionId}`}
                maxLength={2000}
                value={form.data.reason}
                onChange={(event) => form.setData('reason', event.target.value)}
                required={form.data.status === 'rejected'}
                disabled={form.processing}
            />
            <InputError message={form.errors.reason || form.errors.status} />
            <Button disabled={form.processing}>Simpan keputusan</Button>
        </form>
    );
}

function CustomerSettlement({
    orderId,
    summary,
    addresses,
    banks,
}: {
    orderId: number;
    summary: Settlement['summary'];
    addresses: SettlementAddress[];
    banks: SettlementBank[];
}) {
    const base = `/customer/dashboard/orders/${orderId}/settlement`;
    const [addressId, setAddressId] = useState('');
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const shipping = useForm({
        address_id: '',
        courier_company: '',
        courier_type: '',
        shipping_cost: '',
    });
    const payment = useForm({
        submission_key: crypto.randomUUID(),
        amount: summary.outstanding,
        bank_account_index: '',
        proof: null as File | null,
    });
    async function getRates() {
        setLoading(true);
        setError('');
        setRates([]);
        try {
            const response = await fetch(
                `${base}/rates?address_id=${encodeURIComponent(addressId)}`,
                { headers: { Accept: 'application/json' } },
            );
            const result = await response.json();
            if (!response.ok)
                throw new Error(
                    Object.values(result.errors ?? {})
                        .flat()
                        .join(' ') ||
                        result.message ||
                        'Tarif tidak tersedia. Periksa alamat lalu coba lagi.',
                );
            setRates(result.rates);
            if (!result.rates.length)
                setError('Tidak ada layanan pengiriman untuk alamat ini.');
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : 'Tarif gagal dimuat. Coba lagi.',
            );
        } finally {
            setLoading(false);
        }
    }
    function selectRate(rate: Rate) {
        shipping.transform(() => ({
            address_id: addressId,
            courier_company: rate.courier_company,
            courier_type: rate.courier_type,
            shipping_cost: rate.price,
        }));
        shipping.post(`${base}/shipping`, {
            preserveScroll: true,
            onSuccess: () => setRates([]),
        });
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        payment.transform((data) => ({ ...data, amount: summary.outstanding }));
        payment.post(`${base}/submissions`, {
            forceFormData: true,
            preserveScroll: true,
        });
    }
    return (
        <div className="space-y-4 border-t pt-4">
            {!summary.shipping_selected && (
                <div className="grid gap-2">
                    <p className="text-sm">
                        Pastikan alamat dan layanan benar. Pilihan pengiriman
                        tidak dapat diubah setelah disimpan.
                    </p>
                    <Label htmlFor="settlement-address">Alamat tujuan</Label>
                    <select
                        id="settlement-address"
                        className="bg-background min-h-10 w-full min-w-0 rounded-md border px-3"
                        value={addressId}
                        onChange={(event) => {
                            setAddressId(event.target.value);
                            setRates([]);
                            setError('');
                        }}
                        disabled={
                            loading || shipping.processing || payment.processing
                        }
                    >
                        <option value="">Pilih alamat</option>
                        {addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                                {address.label} ·{' '}
                                {address.destination_contact_name} ·{' '}
                                {address.destination_address}{' '}
                                {address.destination_postal_code}
                            </option>
                        ))}
                    </select>
                    <Link
                        className="text-primary text-sm underline"
                        href="/customer/dashboard/profile"
                    >
                        Tambah / lengkapi alamat dan nomor telepon
                    </Link>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={
                            !addressId ||
                            loading ||
                            shipping.processing ||
                            payment.processing
                        }
                        onClick={() => void getRates()}
                    >
                        {loading ? 'Memuat tarif…' : 'Cari tarif pengiriman'}
                    </Button>
                    <p role="status" className="text-destructive text-sm">
                        {error}
                    </p>
                    <InputError
                        message={Object.values(shipping.errors).join(' ')}
                    />
                    {rates.map((rate) => (
                        <Button
                            key={`${rate.courier_company}-${rate.courier_type}`}
                            type="button"
                            variant="outline"
                            className="h-auto justify-between whitespace-normal"
                            disabled={shipping.processing || payment.processing}
                            onClick={() => selectRate(rate)}
                        >
                            <span>
                                {rate.courier_company}{' '}
                                {rate.courier_service_name || rate.courier_type}{' '}
                                {rate.duration}
                            </span>
                            <span>{rupiah(rate.price)}</span>
                        </Button>
                    ))}
                </div>
            )}
            {summary.shipping_selected && summary.outstanding !== '0.00' ? (
                <form onSubmit={submit} className="grid gap-3 border-t pt-4">
                    <p className="text-sm">
                        Transfer sesuai sisa pelunasan ke rekening yang dipilih.
                        Unggah bukti setelah transfer.
                    </p>
                    <Label htmlFor="settlement-bank">
                        Rekening tujuan transfer
                    </Label>
                    <select
                        id="settlement-bank"
                        className="bg-background min-h-10 w-full min-w-0 rounded-md border px-3"
                        value={payment.data.bank_account_index}
                        onChange={(event) =>
                            payment.setData(
                                'bank_account_index',
                                event.target.value,
                            )
                        }
                        required
                        disabled={payment.processing}
                    >
                        <option value="">Pilih rekening</option>
                        {banks.map((bank) => (
                            <option key={bank.index} value={bank.index}>
                                {bank.bank_name} · {bank.account_number} ·{' '}
                                {bank.account_holder}
                            </option>
                        ))}
                    </select>
                    <Label htmlFor="settlement-proof">
                        Bukti transfer (JPG, PNG, PDF; maksimal 5 MB)
                    </Label>
                    <Input
                        id="settlement-proof"
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        required
                        disabled={payment.processing}
                        onChange={(event) =>
                            payment.setData(
                                'proof',
                                event.target.files?.[0] ?? null,
                            )
                        }
                    />
                    <InputError
                        message={Object.values(payment.errors).join(' ')}
                    />
                    {payment.progress && (
                        <p role="status" className="text-sm">
                            Mengunggah {payment.progress.percentage}%
                        </p>
                    )}
                    <Button disabled={payment.processing || !banks.length}>
                        Ajukan bukti pelunasan
                    </Button>
                </form>
            ) : (
                <p className="text-muted-foreground text-sm">
                    {summary.outstanding === '0.00'
                        ? 'Sisa tagihan nol. Hubungi admin untuk konfirmasi; tidak menerima pengajuan Rp0.'
                        : 'Pilih pengiriman sebelum mengajukan bukti transfer.'}
                </p>
            )}
        </div>
    );
}
