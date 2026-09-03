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
                <div className="border-border flex gap-3 border-y py-4">
                    {book.primary_image && (
                        <img
                            src={book.primary_image.url}
                            alt=""
                            className="h-20 w-14 object-contain"
                        />
                    )}
                    <div>
                        <h3 className="font-semibold">{book.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {book.author}
                        </p>
                        <p className="mt-2 text-sm font-bold">
                            {rupiah(book.price)}
                        </p>
                        <p className="text-success mt-1 text-xs">
                            Stok tersedia: {book.stock}
                        </p>
                    </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label="Nama Lengkap"
                        htmlFor="customer_name"
                        error={form.errors.customer_name}
                    >
                        <Input
                            id="customer_name"
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
                        htmlFor="customer_phone"
                        error={form.errors.customer_phone}
                    >
                        <Input
                            id="customer_phone"
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
                    <Field
                        label="Email"
                        htmlFor="customer_email"
                        error={form.errors.customer_email}
                    >
                        <Input
                            id="customer_email"
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
                        htmlFor="customer_address"
                        error={form.errors.customer_address}
                    >
                        <Textarea
                            id="customer_address"
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
                    <Field
                        label="Jumlah"
                        htmlFor="quantity"
                        error={form.errors.quantity}
                    >
                        <div className="border-border flex w-fit items-center border">
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
                                id="quantity"
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
                    <Field
                        label="Catatan"
                        htmlFor="customer_note"
                        error={form.errors.customer_note}
                    >
                        <Textarea
                            id="customer_note"
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
                    {(form.errors.book_id || orderError) && (
                        <p className="text-destructive text-sm">
                            {form.errors.book_id || orderError}
                        </p>
                    )}
                    <div className="border-border border-y py-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Harga</span>
                            <span>{rupiah(book.price)}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                            <span className="text-muted-foreground">
                                Jumlah
                            </span>
                            <span>{form.data.quantity}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                            <span className="text-muted-foreground">
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
                        className="bg-primary hover:bg-primary/90 w-full"
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
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
    );
}
