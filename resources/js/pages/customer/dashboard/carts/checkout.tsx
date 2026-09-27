import { Head, Link, useForm } from '@inertiajs/react';
import { ShoppingCart, Truck, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { rupiah } from '@/lib/format';

const base = '/customer/dashboard';

type Address = {
    id: number;
    label: string;
    destination_contact_name: string;
    destination_address: string;
    destination_postal_code: string | null;
    city_name: string | null;
    is_default: boolean;
};

type Item = {
    id: number;
    quantity: number;
    line_subtotal: string;
    book: {
        id: number;
        title: string;
        price: string;
        primary_image: { url: string; alt_text: string | null } | null;
    } | null;
};

type Voucher = {
    id: number;
    code: string;
    name: string;
    type: 'fixed' | 'percentage';
    value: string;
    max_discount: string | null;
};

type Rate = {
    courier_company: string;
    courier_type: string;
    courier_service_name: string;
    price: string;
    duration: string | null;
};

const cents = (value: string | number) => Math.round(Number(value) * 100);
const money = (value: number) => (value / 100).toFixed(2);
const rateKey = (rate: Rate) => `${rate.courier_company}:${rate.courier_type}`;

export default function Checkout({
    addresses,
    items,
    subtotal,
    wallet_balance,
    vouchers,
}: {
    addresses: Address[];
    items: Item[];
    subtotal: string;
    wallet_balance: string;
    vouchers: Voucher[];
}) {
    const [rates, setRates] = useState<Rate[]>([]);
    const [loadingRates, setLoadingRates] = useState(false);
    const [rateError, setRateError] = useState('');
    const form = useForm({
        address_id: addresses.find((address) => address.is_default)?.id ?? addresses[0]?.id ?? 0,
        courier_company: '',
        courier_type: '',
        shipping_cost: '',
        voucher_id: null as number | null,
        customer_note: '',
    });

    useEffect(() => {
        if (!form.data.address_id) return;
        const abort = new AbortController();
        setRates([]);
        setRateError('');
        setLoadingRates(true);
        fetch(`${base}/carts/checkout/rates?address_id=${form.data.address_id}`, {
            signal: abort.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.message ?? 'Tarif gagal dimuat.');
                return result as { rates: Rate[] };
            })
            .then((result) => {
                setRates(result.rates);
                if (!result.rates.length) setRateError('Tidak ada layanan tersedia untuk alamat ini.');
            })
            .catch((error: Error) => {
                if (!abort.signal.aborted) setRateError(error.message);
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoadingRates(false);
            });
        return () => abort.abort();
    }, [form.data.address_id]);

    const selectedRate = rates.find(
        (rate) => rate.courier_company === form.data.courier_company && rate.courier_type === form.data.courier_type,
    );
    const errors = form.errors as Record<string, string | undefined>;
    const voucher = vouchers.find((entry) => entry.id === form.data.voucher_id);
    let discount = 0;
    if (voucher) {
        discount = voucher.type === 'fixed'
            ? cents(voucher.value)
            : Math.round(cents(subtotal) * Number(voucher.value) / 100);
        if (voucher.type === 'percentage' && voucher.max_discount !== null) {
            discount = Math.min(discount, cents(voucher.max_discount));
        }
        discount = Math.min(discount, cents(subtotal));
    }
    const total = cents(subtotal) - discount + (selectedRate ? cents(selectedRate.price) : 0);
    const insufficient = selectedRate !== undefined && cents(wallet_balance) < total;

    const selectRate = (key: string) => {
        const rate = rates.find((entry) => rateKey(entry) === key);
        form.setData((previous) => ({
            ...previous,
            courier_company: rate?.courier_company ?? '',
            courier_type: rate?.courier_type ?? '',
            shipping_cost: rate?.price ?? '',
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedRate || insufficient) return;
        form.post(`${base}/carts/checkout`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Checkout" />
            <AdminListLayout
                title="Checkout"
                description="Pilih pengiriman, gunakan voucher, lalu periksa saldo sebelum membayar."
                icon={ShoppingCart}
                dashboardHref={`${base}/carts`}
                eyebrow="Akun Saya"
            >
                <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        <Card>
                            <CardContent className="space-y-3 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-heading text-lg font-semibold">Alamat pengiriman</h2>
                                    <Link href={`${base}/profile`} className="text-primary text-sm underline">Kelola alamat</Link>
                                </div>
                                <Label htmlFor="checkout-address">Pilih alamat</Label>
                                <select
                                    id="checkout-address"
                                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.address_id}
                                    onChange={(event) => {
                                        form.setData((previous) => ({ ...previous, address_id: Number(event.target.value), courier_company: '', courier_type: '', shipping_cost: '' }));
                                    }}
                                >
                                    {addresses.map((address) => (
                                        <option key={address.id} value={address.id}>
                                            {address.label} — {address.destination_contact_name}, {address.destination_address}, {address.city_name} {address.destination_postal_code}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.address_id} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-4 p-5">
                                <h2 className="font-heading flex items-center gap-2 text-lg font-semibold"><Truck className="size-5" /> Jasa ekspedisi</h2>
                                {loadingRates && <p role="status" className="text-muted-foreground text-sm">Mengambil tarif Biteship…</p>}
                                {rateError && <p role="alert" className="text-destructive text-sm">{rateError}</p>}
                                {!loadingRates && rates.length > 0 && (
                                    <div className="space-y-2" role="radiogroup" aria-label="Pilih jasa ekspedisi">
                                        {rates.map((rate) => (
                                            <label key={rateKey(rate)} className="hover:border-primary flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm">
                                                <input
                                                    type="radio"
                                                    name="shipping_rate"
                                                    value={rateKey(rate)}
                                                    checked={rateKey(rate) === (selectedRate ? rateKey(selectedRate) : '')}
                                                    onChange={() => selectRate(rateKey(rate))}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block font-semibold">{rate.courier_company.toUpperCase()} · {rate.courier_service_name}</span>
                                                    {rate.duration && <span className="text-muted-foreground">Estimasi {rate.duration}</span>}
                                                </span>
                                                <strong>{rupiah(rate.price)}</strong>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <InputError message={errors.shipping_cost ?? errors.shipping} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-3 p-5">
                                <h2 className="font-heading text-lg font-semibold">Voucher</h2>
                                <Label htmlFor="checkout-voucher">Pilih voucher tersedia (opsional)</Label>
                                <select
                                    id="checkout-voucher"
                                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.voucher_id ?? ''}
                                    onChange={(event) => form.setData('voucher_id', event.target.value ? Number(event.target.value) : null)}
                                >
                                    <option value="">Tanpa voucher</option>
                                    {vouchers.map((entry) => <option key={entry.id} value={entry.id}>{entry.code} — {entry.name}</option>)}
                                </select>
                                <InputError message={form.errors.voucher_id} />
                                <Label htmlFor="checkout-note">Catatan untuk toko (opsional)</Label>
                                <textarea
                                    id="checkout-note"
                                    className="border-input bg-background min-h-20 w-full rounded-md border p-3 text-sm"
                                    value={form.data.customer_note}
                                    onChange={(event) => form.setData('customer_note', event.target.value)}
                                />
                                <InputError message={form.errors.customer_note} />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="h-fit lg:sticky lg:top-6">
                        <CardContent className="space-y-4 p-5">
                            <h2 className="font-heading text-lg font-semibold">Ringkasan pesanan</h2>
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 border-b pb-3 text-sm">
                                    {item.book?.primary_image && <img src={item.book.primary_image.url} alt={item.book.primary_image.alt_text ?? item.book.title} className="size-12 rounded object-cover" />}
                                    <span className="min-w-0 flex-1">{item.book?.title ?? 'Buku tidak tersedia'} × {item.quantity}</span>
                                    <span>{rupiah(item.line_subtotal)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm"><span>Subtotal buku</span><span>{rupiah(subtotal)}</span></div>
                            <div className="flex justify-between text-sm"><span>Diskon voucher</span><span>− {rupiah(money(discount))}</span></div>
                            <div className="flex justify-between text-sm"><span>Ongkos kirim</span><span>{selectedRate ? rupiah(selectedRate.price) : 'Pilih ekspedisi'}</span></div>
                            <div className="flex justify-between border-t pt-4 font-bold"><span>Total</span><span className="text-primary">{rupiah(money(total))}</span></div>
                            <div className="bg-secondary flex items-center justify-between rounded-lg p-3 text-sm"><span className="flex items-center gap-2"><Wallet className="size-4" /> Saldo wallet</span><strong>{rupiah(wallet_balance)}</strong></div>
                            {(insufficient || errors.wallet_balance) && (
                                <div role="alert" className="space-y-2 text-sm">
                                    <p className="text-destructive">{errors.wallet_balance ?? 'Saldo tidak mencukupi untuk membayar pesanan ini.'}</p>
                                    <Button asChild variant="outline" className="w-full"><Link href={`${base}/wallets`}>Isi ulang saldo</Link></Button>
                                </div>
                            )}
                            <InputError message={errors.items} />
                            <Button type="submit" className="w-full" disabled={!selectedRate || insufficient || loadingRates || form.processing}>
                                {form.processing ? 'Memproses checkout…' : 'Bayar dengan Saldo'}
                            </Button>
                            <p className="text-muted-foreground text-xs">Tarif dan harga divalidasi ulang saat pembayaran. Pengiriman dipesan oleh admin setelah pesanan siap.</p>
                        </CardContent>
                    </Card>
                </form>
            </AdminListLayout>
        </>
    );
}

Checkout.layout = { breadcrumbs: [
    { title: 'Keranjang', href: `${base}/carts` },
    { title: 'Checkout', href: `${base}/carts/checkout` },
] };
