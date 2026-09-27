import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { rupiah } from '@/lib/format';

const url = '/customer/dashboard/carts';

type CartBook = {
    id: number;
    title: string;
    author: string;
    price: string;
    stock: number;
    is_active: boolean;
    primary_image: { url: string; alt_text: string | null } | null;
};

type CartItem = {
    id: number;
    quantity: number;
    line_subtotal: string;
    book: CartBook | null;
};

export default function CartsIndex({
    items,
    subtotal,
    total,
}: {
    items: CartItem[];
    subtotal: string;
    total: string;
}) {
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<{ id: number; message: string } | null>(
        null,
    );

    const updateQuantity = (item: CartItem, quantity: number) => {
        setPendingId(item.id);
        setError(null);
        router.patch(
            '/cart/items/' + item.id,
            { quantity },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setError({
                        id: item.id,
                        message:
                            errors.quantity ?? 'Jumlah buku gagal diperbarui.',
                    }),
                onFinish: () => setPendingId(null),
            },
        );
    };

    const remove = (item: CartItem) => {
        setPendingId(item.id);
        setError(null);
        router.delete('/cart/items/' + item.id, {
            preserveScroll: true,
            onError: () =>
                setError({ id: item.id, message: 'Buku gagal dihapus.' }),
            onFinish: () => setPendingId(null),
        });
    };

    return (
        <>
            <Head title="Keranjang Saya" />
            <AdminListLayout
                title="Keranjang"
                description="Periksa buku dan jumlahnya sebelum melanjutkan belanja."
                icon={ShoppingCart}
                dashboardHref={url}
                eyebrow="Akun Saya"
            >
                {items.length === 0 ? (
                    <Card className="border-border/90 shadow-sm">
                        <CardContent className="flex flex-col items-center gap-4 px-5 py-14 text-center">
                            <span className="bg-secondary text-primary grid size-14 place-items-center rounded-xl">
                                <ShoppingCart
                                    className="size-7"
                                    aria-hidden="true"
                                />
                            </span>
                            <div>
                                <h2 className="font-heading text-xl font-semibold">
                                    Keranjang masih kosong
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Pilih buku di katalog untuk mulai mengisi
                                    keranjang.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/books">Jelajahi buku</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <Card className="border-border/90 shadow-sm">
                            <CardContent className="divide-border divide-y p-0">
                                {items.map((item) => {
                                    const book = item.book;
                                    const available = Boolean(
                                        book?.is_active && book.stock > 0,
                                    );
                                    const busy = pendingId !== null;
                                    const title = book?.title ?? 'buku';

                                    return (
                                        <article
                                            key={item.id}
                                            className="flex gap-4 p-4 sm:gap-5 sm:p-6"
                                        >
                                            <div className="bg-muted/50 grid h-28 w-20 shrink-0 place-items-center overflow-hidden rounded-md border sm:h-36 sm:w-28">
                                                {book?.primary_image ? (
                                                    <img
                                                        src={
                                                            book.primary_image
                                                                .url
                                                        }
                                                        alt={
                                                            book.primary_image
                                                                .alt_text ??
                                                            'Sampul ' + title
                                                        }
                                                        className="size-full object-contain"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <BookOpen
                                                        className="text-muted-foreground size-9"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
                                                <div className="min-w-0">
                                                    <h2 className="font-heading text-base leading-snug font-semibold">
                                                        {book?.title ??
                                                            'Buku tidak tersedia'}
                                                    </h2>
                                                    {book && (
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {book.author}
                                                        </p>
                                                    )}
                                                    <p className="text-primary mt-2 text-sm font-semibold">
                                                        {book
                                                            ? rupiah(book.price)
                                                            : 'Harga tidak tersedia'}
                                                    </p>
                                                    {book &&
                                                        (!book.is_active ||
                                                            book.stock <
                                                                item.quantity) && (
                                                            <p
                                                                className="text-destructive mt-2 text-xs"
                                                                role="status"
                                                            >
                                                                {!book.is_active
                                                                    ? 'Buku tidak tersedia.'
                                                                    : book.stock ===
                                                                        0
                                                                      ? 'Stok habis. Hapus buku ini dari keranjang.'
                                                                      : 'Stok tersedia: ' +
                                                                        book.stock +
                                                                        '. Kurangi jumlah atau hapus buku.'}
                                                            </p>
                                                        )}
                                                    {!book && (
                                                        <p className="text-destructive mt-2 text-xs">
                                                            Hapus buku ini dari
                                                            keranjang.
                                                        </p>
                                                    )}
                                                    {error?.id === item.id && (
                                                        <p
                                                            className="text-destructive mt-2 text-xs"
                                                            role="alert"
                                                        >
                                                            {error.message}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 flex-wrap items-end gap-x-5 gap-y-3 sm:flex-col sm:items-end sm:justify-between">
                                                    <p className="text-sm font-bold">
                                                        {rupiah(
                                                            item.line_subtotal,
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="border-border flex h-9 items-center border"
                                                            role="group"
                                                            aria-label={
                                                                'Jumlah ' +
                                                                title
                                                            }
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-9 rounded-none"
                                                                aria-label={
                                                                    'Kurangi jumlah ' +
                                                                    title
                                                                }
                                                                disabled={
                                                                    busy ||
                                                                    !available ||
                                                                    item.quantity <=
                                                                        1
                                                                }
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item,
                                                                        Math.min(
                                                                            item.quantity -
                                                                                1,
                                                                            book!
                                                                                .stock,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <Minus className="size-4" />
                                                            </Button>
                                                            <span
                                                                className="min-w-8 text-center text-sm tabular-nums"
                                                                aria-live="polite"
                                                            >
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-9 rounded-none"
                                                                aria-label={
                                                                    'Tambah jumlah ' +
                                                                    title
                                                                }
                                                                disabled={
                                                                    busy ||
                                                                    !available ||
                                                                    item.quantity >=
                                                                        book!
                                                                            .stock
                                                                }
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item,
                                                                        item.quantity +
                                                                            1,
                                                                    )
                                                                }
                                                            >
                                                                <Plus className="size-4" />
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive size-9"
                                                            aria-label={
                                                                'Hapus ' +
                                                                title +
                                                                ' dari keranjang'
                                                            }
                                                            disabled={busy}
                                                            onClick={() =>
                                                                remove(item)
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </CardContent>
                        </Card>
                        <Card className="border-border/90 shadow-sm lg:sticky lg:top-6">
                            <CardContent className="space-y-4 p-5">
                                <h2 className="font-heading text-lg font-semibold">
                                    Ringkasan Belanja
                                </h2>
                                <div className="border-border flex justify-between gap-3 border-b pb-4 text-sm">
                                    <span className="text-muted-foreground">
                                        Subtotal buku
                                    </span>
                                    <span>{rupiah(subtotal)}</span>
                                </div>
                                <div className="flex justify-between gap-3 font-bold">
                                    <span>Total harga buku</span>
                                    <span className="text-primary">
                                        {rupiah(total)}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-xs leading-5">
                                    Estimasi harga buku. Ongkir dan diskon
                                    dihitung saat checkout.
                                </p>
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full"
                                >
                                    <Link href="/books">Lanjut pilih buku</Link>
                                </Button>
                                <Button asChild className="w-full">
                                    <Link href="/customer/dashboard/carts/checkout">Lanjut checkout</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </AdminListLayout>
        </>
    );
}

CartsIndex.layout = { breadcrumbs: [{ title: 'Keranjang', href: url }] };
