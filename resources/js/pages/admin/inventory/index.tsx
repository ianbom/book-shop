import { FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    History,
    House,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Warehouse,
} from 'lucide-react';
import { Pagination } from '@/components/admin/shared/pagination';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
import admin from '@/routes/admin';
import type { Book, Paginated, StockMovementType } from '@/types/admin';

export default function InventoryIndex({
    books,
    filters,
}: {
    books: Paginated<Book>;
    filters: { search?: string };
}) {
    const [selected, setSelected] = useState<Book | null>(null);
    const form = useForm<{
        book_id: number;
        type: Extract<StockMovementType, 'adjustment_in' | 'adjustment_out'>;
        quantity: number;
        note: string;
    }>({ book_id: 0, type: 'adjustment_in', quantity: 1, note: '' });
    const open = (book: Book) => {
        setSelected(book);
        form.setData({
            book_id: book.id,
            type: 'adjustment_in',
            quantity: 1,
            note: '',
        });
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(admin.inventory.adjustments.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setSelected(null);
                form.reset();
            },
        });
    };

    return (
        <>
            <Head title="Manajemen Stok" />
            <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-4 py-5 md:px-7 md:py-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <nav
                        className="text-muted-foreground flex items-center gap-2 text-xs"
                        aria-label="Breadcrumb"
                    >
                        <Link
                            href={admin.dashboard()}
                            className="hover:text-primary inline-flex items-center gap-1.5"
                        >
                            <House className="size-3.5" /> Dashboard
                        </Link>
                        <ChevronRight className="size-3.5" />
                        <span className="text-foreground font-semibold">
                            Manajemen Stok
                        </span>
                    </nav>
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-white"
                    >
                        <Link href={admin.inventory.history()}>
                            <History /> Riwayat Stok
                        </Link>
                    </Button>
                </div>
                <section className="bg-muted/60 relative overflow-hidden rounded-2xl border border-white/80 px-5 py-6 sm:px-7 sm:py-7">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl shadow-sm">
                                <Warehouse className="size-6" />
                            </span>
                            <div>
                                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                                    Manajemen Toko
                                </p>
                                <h1 className="font-heading text-foreground text-4xl leading-none font-bold sm:text-5xl">
                                    Manajemen Stok
                                </h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
                            Sesuaikan stok melalui transaksi yang tercatat.
                        </p>
                    </div>
                    <img
                        src="/dashboard-image/pesanan.png"
                        alt=""
                        className="pointer-events-none absolute right-0 bottom-0 hidden h-full max-w-[56%] object-contain object-right lg:block"
                    />
                </section>
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(
                                    admin.inventory.index(),
                                    {
                                        search: new FormData(
                                            event.currentTarget,
                                        ).get('search'),
                                    },
                                    { preserveState: true, replace: true },
                                );
                            }}
                            className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Judul / Penulis / ISBN
                                </span>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari buku..."
                                        className="bg-background h-10 pl-9"
                                    />
                                </div>
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    router.get(admin.inventory.index())
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
                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Buku</th>
                                        <th className="px-4 py-4">
                                            Stok Saat Ini
                                        </th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">
                                            Pergerakan Terakhir
                                        </th>
                                        <th className="px-4 py-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {books.data.map((book) => {
                                        const movement =
                                            book.stock_movements?.[0];
                                        return (
                                            <tr
                                                key={book.id}
                                                className="hover:bg-muted/45 transition-colors"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        {book.primary_image_url ? (
                                                            <img
                                                                src={
                                                                    book.primary_image_url
                                                                }
                                                                alt=""
                                                                className="size-11 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="bg-secondary size-11 rounded" />
                                                        )}
                                                        <span>
                                                            <span className="block font-medium">
                                                                {book.title}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">
                                                                {book.author}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-lg font-semibold">
                                                    {book.stock}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={
                                                            book.is_active
                                                                ? 'text-success'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {book.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {movement ? (
                                                        <div>
                                                            <StatusBadge
                                                                value={
                                                                    movement.type
                                                                }
                                                            />
                                                            <div className="text-muted-foreground mt-1 text-xs">
                                                                {formatDate(
                                                                    movement.created_at,
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            open(book)
                                                        }
                                                    >
                                                        <SlidersHorizontal className="mr-2 size-4" />
                                                        Sesuaikan
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {books.data.length === 0 && (
                            <p className="text-muted-foreground p-10 text-center text-sm">
                                Buku tidak ditemukan.
                            </p>
                        )}
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {books.meta.from ?? 0}–
                                    {books.meta.to ?? 0} dari {books.meta.total}{' '}
                                    buku
                                </p>
                                <Pagination links={books.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <Dialog
                open={selected !== null}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sesuaikan Stok</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        {selected?.title} · stok {selected?.stock}
                    </p>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Tipe</Label>
                            <select
                                id="type"
                                className="bg-background h-10 rounded-md border px-3 text-sm"
                                value={form.data.type}
                                onChange={(event) =>
                                    form.setData(
                                        'type',
                                        event.target
                                            .value as typeof form.data.type,
                                    )
                                }
                            >
                                <option value="adjustment_in">
                                    Stok Masuk
                                </option>
                                <option value="adjustment_out">
                                    Stok Keluar
                                </option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Jumlah</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={form.data.quantity}
                                onChange={(event) =>
                                    form.setData(
                                        'quantity',
                                        Number(event.target.value),
                                    )
                                }
                                required
                            />
                            <p className="text-destructive text-sm">
                                {form.errors.quantity}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="note">Catatan</Label>
                            <Textarea
                                id="note"
                                value={form.data.note}
                                onChange={(event) =>
                                    form.setData('note', event.target.value)
                                }
                            />
                        </div>
                        <Button className="w-full" disabled={form.processing}>
                            Simpan Penyesuaian
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [{ title: 'Manajemen Stok', href: admin.inventory.index() }],
};
