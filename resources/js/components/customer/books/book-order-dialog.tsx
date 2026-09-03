import { useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { rupiah } from '@/lib/format';
import type { CustomerBook } from '@/types';

interface OrderForm {
    book_id: number;
    quantity: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    customer_address: string;
    customer_note: string;
}

const initialForm: OrderForm = {
    book_id: 0,
    quantity: 1,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_note: '',
};

export function BookOrderDialog({
    book,
    onClose,
}: {
    book: CustomerBook | null;
    onClose: () => void;
}) {
    const form = useForm<OrderForm>(initialForm);

    useEffect(() => {
        if (book) {
            form.clearErrors();
            form.setData({ ...initialForm, book_id: book.id });
        }
    }, [book]);

    if (!book) return null;

    const subtotal = Number(book.price) * form.data.quantity;
    const setQuantity = (quantity: number) =>
        form.setData('quantity', Math.max(1, Math.min(book.stock, quantity)));
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/orders', {
            preserveScroll: true,
            onError: (errors) => {
                if (errors.quantity || errors.book_id)
                    router.reload({ only: ['books'], preserveUrl: true });
            },
        });
    };

    const orderError = (form.errors as Record<string, string | undefined>)
        .order;
    return (
        <Dialog
            open
            onOpenChange={(open) => !open && !form.processing && onClose()}
        >
            <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Buat Pesanan</DialogTitle>
                    <DialogDescription>
                        Lengkapi data untuk melanjutkan pesanan melalui
                        WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 border-y border-slate-200 py-4">
                    {book.primary_image && (
                        <img
                            src={book.primary_image.url}
                            alt=""
                            className="h-20 w-14 object-contain"
                        />
                    )}
                    <div>
                        <h3 className="font-semibold">{book.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {book.author}
                        </p>
                        <p className="mt-2 text-sm font-bold">
                            {rupiah(book.price)}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                            Stok tersedia: {book.stock}
                        </p>
                    </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label="Nama Lengkap"
                        error={form.errors.customer_name}
                    >
                        <Input
                            value={form.data.customer_name}
                            onChange={(event) =>
                                form.setData(
                                    'customer_name',
                                    event.target.value,
                                )
                            }
                            autoComplete="name"
                        />
                    </Field>
                    <Field
                        label="Nomor WhatsApp"
                        error={form.errors.customer_phone}
                    >
                        <Input
                            value={form.data.customer_phone}
                            onChange={(event) =>
                                form.setData(
                                    'customer_phone',
                                    event.target.value,
                                )
                            }
                            inputMode="tel"
                            placeholder="0812..."
                        />
                    </Field>
                    <Field label="Email" error={form.errors.customer_email}>
                        <Input
                            value={form.data.customer_email}
                            onChange={(event) =>
                                form.setData(
                                    'customer_email',
                                    event.target.value,
                                )
                            }
                            type="email"
                            autoComplete="email"
                        />
                    </Field>
                    <Field
                        label="Alamat Lengkap"
                        error={form.errors.customer_address}
                    >
                        <Textarea
                            value={form.data.customer_address}
                            onChange={(event) =>
                                form.setData(
                                    'customer_address',
                                    event.target.value,
                                )
                            }
                            autoComplete="street-address"
                        />
                    </Field>
                    <Field label="Jumlah" error={form.errors.quantity}>
                        <div className="flex w-fit items-center border border-slate-200">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={
                                    form.processing || form.data.quantity <= 1
                                }
                                onClick={() =>
                                    setQuantity(form.data.quantity - 1)
                                }
                                aria-label="Kurangi jumlah"
                            >
                                <Minus />
                            </Button>
                            <Input
                                type="number"
                                min={1}
                                max={book.stock}
                                value={form.data.quantity}
                                onChange={(event) =>
                                    setQuantity(Number(event.target.value) || 1)
                                }
                                className="h-9 w-16 border-y-0 text-center shadow-none"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={
                                    form.processing ||
                                    form.data.quantity >= book.stock
                                }
                                onClick={() =>
                                    setQuantity(form.data.quantity + 1)
                                }
                                aria-label="Tambah jumlah"
                            >
                                <Plus />
                            </Button>
                        </div>
                    </Field>
                    <Field label="Catatan" error={form.errors.customer_note}>
                        <Textarea
                            value={form.data.customer_note}
                            onChange={(event) =>
                                form.setData(
                                    'customer_note',
                                    event.target.value,
                                )
                            }
                            placeholder="Opsional"
                        />
                    </Field>
                    {orderError && (
                        <p className="text-sm text-red-600">{orderError}</p>
                    )}
                    <div className="border-y border-slate-200 py-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Harga</span>
                            <span>{rupiah(book.price)}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                            <span className="text-slate-500">Jumlah</span>
                            <span>{form.data.quantity}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                            <span className="text-slate-500">
                                Biaya Pengiriman
                            </span>
                            <span>{rupiah(0)}</span>
                        </div>
                        <div className="mt-3 flex justify-between text-base font-bold">
                            <span>Total</span>
                            <span>{rupiah(subtotal)}</span>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={form.processing || book.stock <= 0}
                        className="w-full bg-[#2563EB] hover:bg-blue-700"
                    >
                        {form.processing ? 'Memproses...' : 'Buat Pesanan'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
