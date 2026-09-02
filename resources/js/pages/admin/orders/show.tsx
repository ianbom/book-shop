import { FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ExternalLink, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Order, OrderStatus, PaymentStatus } from '@/types/admin';

const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending: ['packing', 'cancelled'],
    packing: ['shipping', 'cancelled'],
    shipping: ['completed'],
};

export default function OrderShow({ order }: { order: Order }) {
    const statusForm = useForm<{ status: OrderStatus; note: string }>({
        status: transitions[order.status]?.[0] ?? order.status,
        note: '',
    });
    const paymentForm = useForm<{ payment_status: PaymentStatus }>({
        payment_status: order.payment_status,
    });
    const proofForm = useForm<{
        image: File | null;
        payment_amount: string;
        paid_at: string;
        note: string;
    }>({ image: null, payment_amount: '', paid_at: '', note: '' });
    const whatsapp = `https://wa.me/${order.customer_phone.replace(/\D/g, '').replace(/^0/, '62')}`;

    const updateStatus = (event: FormEvent) => {
        event.preventDefault();
        statusForm.patch(admin.orders.status.url(order.id), {
            preserveScroll: true,
        });
    };
    const uploadProof = (event: FormEvent) => {
        event.preventDefault();
        proofForm.post(admin.orders.paymentProofs.store.url(order.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => proofForm.reset(),
        });
    };

    return (
        <>
            <Head title={order.order_code} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={order.order_code}
                    description={`Dibuat ${formatDate(order.created_at)}`}
                    actions={
                        <Button asChild>
                            <a href={whatsapp} target="_blank" rel="noreferrer">
                                Hubungi via WhatsApp
                                <ExternalLink className="ml-2 size-4" />
                            </a>
                        </Button>
                    }
                />
                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Pesanan</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                                <Info label="Status Pesanan">
                                    <StatusBadge value={order.status} />
                                </Info>
                                <Info label="Status Pembayaran">
                                    <StatusBadge value={order.payment_status} />
                                </Info>
                                <Info
                                    label="Kode Order"
                                    value={order.order_code}
                                />
                                <Info
                                    label="Dibuat"
                                    value={formatDate(order.created_at)}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Pelanggan</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                                <Info
                                    label="Nama"
                                    value={order.customer_name}
                                />
                                <Info
                                    label="WhatsApp"
                                    value={order.customer_phone}
                                />
                                <Info
                                    label="Email"
                                    value={order.customer_email ?? '-'}
                                />
                                <div className="sm:col-span-2">
                                    <Info
                                        label="Alamat"
                                        value={order.customer_address}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Info
                                        label="Catatan"
                                        value={order.customer_note ?? '-'}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Snapshot Buku</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <Info label="Judul" value={order.book_title} />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Info
                                        label="Penulis"
                                        value={order.book_author ?? '-'}
                                    />
                                    <Info
                                        label="ISBN"
                                        value={order.book_isbn ?? '-'}
                                    />
                                    <Info
                                        label="Harga Satuan"
                                        value={rupiah(order.unit_price)}
                                    />
                                    <Info
                                        label="Jumlah"
                                        value={String(order.quantity)}
                                    />
                                    <Info
                                        label="Subtotal"
                                        value={rupiah(order.subtotal)}
                                    />
                                    <Info
                                        label="Ongkir"
                                        value={rupiah(order.shipping_cost)}
                                    />
                                </div>
                                <div className="flex justify-between border-t pt-4 text-base">
                                    <span>Total</span>
                                    <strong>{rupiah(order.total)}</strong>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Bukti Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {order.payment_proofs?.map((proof) => (
                                        <div
                                            key={proof.id}
                                            className="overflow-hidden rounded-lg border"
                                        >
                                            <a
                                                href={proof.image_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <img
                                                    src={proof.image_url}
                                                    alt={`Bukti pembayaran ${order.order_code}`}
                                                    className="aspect-video w-full object-cover"
                                                />
                                            </a>
                                            <div className="space-y-1 p-3 text-sm">
                                                <div className="flex items-start justify-between">
                                                    <strong>
                                                        {proof.payment_amount
                                                            ? rupiah(
                                                                  proof.payment_amount,
                                                              )
                                                            : 'Nominal tidak dicatat'}
                                                    </strong>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    'Hapus bukti pembayaran ini?',
                                                                )
                                                            )
                                                                router.delete(
                                                                    admin.orders.paymentProofs.destroy(
                                                                        {
                                                                            order: order.id,
                                                                            paymentProof:
                                                                                proof.id,
                                                                        },
                                                                    ),
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                        }}
                                                    >
                                                        <Trash2 className="text-destructive size-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-muted-foreground">
                                                    Dibayar:{' '}
                                                    {formatDate(proof.paid_at)}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    Diunggah:{' '}
                                                    {proof.uploaded_by?.name ??
                                                        '-'}
                                                </p>
                                                {proof.note && (
                                                    <p>{proof.note}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {!order.payment_proofs?.length && (
                                        <p className="text-muted-foreground text-sm">
                                            Belum ada bukti pembayaran.
                                        </p>
                                    )}
                                </div>
                                <form
                                    onSubmit={uploadProof}
                                    className="grid gap-4 border-t pt-5 md:grid-cols-2"
                                >
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label htmlFor="proof">
                                            Gambar Bukti
                                        </Label>
                                        <Input
                                            id="proof"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(event) =>
                                                proofForm.setData(
                                                    'image',
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                            required
                                        />
                                        <p className="text-destructive text-sm">
                                            {proofForm.errors.image}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_amount">
                                            Nominal
                                        </Label>
                                        <Input
                                            id="payment_amount"
                                            type="number"
                                            min="0"
                                            value={
                                                proofForm.data.payment_amount
                                            }
                                            onChange={(event) =>
                                                proofForm.setData(
                                                    'payment_amount',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="paid_at">
                                            Waktu Bayar
                                        </Label>
                                        <Input
                                            id="paid_at"
                                            type="datetime-local"
                                            value={proofForm.data.paid_at}
                                            onChange={(event) =>
                                                proofForm.setData(
                                                    'paid_at',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label htmlFor="proof_note">
                                            Catatan
                                        </Label>
                                        <Textarea
                                            id="proof_note"
                                            value={proofForm.data.note}
                                            onChange={(event) =>
                                                proofForm.setData(
                                                    'note',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <Button
                                        className="md:col-span-2"
                                        disabled={
                                            proofForm.processing ||
                                            !proofForm.data.image
                                        }
                                    >
                                        <Upload className="mr-2 size-4" />
                                        Unggah Bukti
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ubah Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transitions[order.status]?.length ? (
                                    <form
                                        onSubmit={updateStatus}
                                        className="space-y-4"
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="status">
                                                Status Berikutnya
                                            </Label>
                                            <select
                                                id="status"
                                                className="bg-background h-10 rounded-md border px-3 text-sm"
                                                value={statusForm.data.status}
                                                onChange={(event) =>
                                                    statusForm.setData(
                                                        'status',
                                                        event.target
                                                            .value as OrderStatus,
                                                    )
                                                }
                                            >
                                                {transitions[order.status]?.map(
                                                    (status) => (
                                                        <option
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status ===
                                                            'packing'
                                                                ? 'Proses Packing'
                                                                : status ===
                                                                    'shipping'
                                                                  ? 'Proses Pengiriman'
                                                                  : status ===
                                                                      'completed'
                                                                    ? 'Selesai'
                                                                    : 'Dibatalkan'}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="status_note">
                                                Catatan
                                            </Label>
                                            <Textarea
                                                id="status_note"
                                                value={statusForm.data.note}
                                                onChange={(event) =>
                                                    statusForm.setData(
                                                        'note',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <p className="text-destructive text-sm">
                                            {statusForm.errors.status}
                                        </p>
                                        <Button
                                            className="w-full"
                                            disabled={statusForm.processing}
                                        >
                                            Perbarui Status
                                        </Button>
                                    </form>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Status final. Tidak ada transisi
                                        lanjutan.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <select
                                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={paymentForm.data.payment_status}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'payment_status',
                                            event.target.value as PaymentStatus,
                                        )
                                    }
                                >
                                    <option value="unpaid">
                                        Belum Dibayar
                                    </option>
                                    <option value="paid">Dibayar</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    disabled={
                                        paymentForm.processing ||
                                        paymentForm.data.payment_status ===
                                            order.payment_status
                                    }
                                    onClick={() =>
                                        paymentForm.patch(
                                            admin.orders.paymentStatus.url(
                                                order.id,
                                            ),
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    Simpan Pembayaran
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                {order.status_histories?.map(
                                    (history, index) => (
                                        <div
                                            key={history.id}
                                            className="relative border-l pb-6 pl-5 last:pb-0"
                                        >
                                            <span className="ring-background absolute top-1 -left-1.5 size-3 rounded-full bg-[#2563EB] ring-4" />
                                            <StatusBadge
                                                value={history.status}
                                            />
                                            <p className="text-muted-foreground mt-2 text-xs">
                                                {formatDate(history.created_at)}{' '}
                                                ·{' '}
                                                {history.changed_by?.name ??
                                                    'Sistem'}
                                            </p>
                                            {history.note && (
                                                <p className="mt-1 text-sm">
                                                    {history.note}
                                                </p>
                                            )}
                                            {index ===
                                                (order.status_histories
                                                    ?.length ?? 0) -
                                                    1 && <span />}
                                        </div>
                                    ),
                                )}
                                {!order.status_histories?.length && (
                                    <p className="text-muted-foreground text-sm">
                                        Belum ada histori status.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    );
}

function Info({
    label,
    value,
    children,
}: {
    label: string;
    value?: string;
    children?: React.ReactNode;
}) {
    return (
        <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {label}
            </p>
            <div className="mt-1 font-medium whitespace-pre-wrap">
                {children ?? value}
            </div>
        </div>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Pesanan', href: admin.orders.index() },
        { title: 'Detail Pesanan', href: admin.orders.index() },
    ],
};
