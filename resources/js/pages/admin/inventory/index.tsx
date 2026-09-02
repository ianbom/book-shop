import { FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { History, Search, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
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
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Manajemen Stok"
                    description="Sesuaikan stok melalui transaksi yang tercatat."
                    actions={
                        <Button asChild variant="outline">
                            <Link href={admin.inventory.history()}>
                                <History className="mr-2 size-4" />
                                Riwayat Stok
                            </Link>
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="p-4">
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
                            className="flex gap-3"
                        >
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Cari judul, penulis, ISBN…"
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" variant="outline">
                                Cari
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="text-muted-foreground border-b bg-slate-50 text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Buku</th>
                                        <th className="px-5 py-3">
                                            Stok Saat Ini
                                        </th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">
                                            Pergerakan Terakhir
                                        </th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {books.data.map((book) => {
                                        const movement =
                                            book.stock_movements?.[0];
                                        return (
                                            <tr key={book.id}>
                                                <td className="px-5 py-4">
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
                                                            <div className="size-11 rounded bg-slate-100" />
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
                                                <td className="px-5 py-4 text-lg font-semibold">
                                                    {book.stock}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={
                                                            book.is_active
                                                                ? 'text-emerald-700'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {book.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
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
                                                <td className="px-5 py-4 text-right">
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
                        <div className="border-t p-4">
                            <Pagination links={books.meta.links} />
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
