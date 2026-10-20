import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    TicketPercent,
    Trash2,
} from 'lucide-react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { Pagination } from '@/components/admin/shared/pagination';
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
import admin from '@/routes/admin';
import type { Book, Paginated, PreOrderCode } from '@/types/admin';

type Props = {
    preOrderCodes: Paginated<PreOrderCode>;
    filters: { search?: string };
};
type CodeBook = Pick<Book, 'id' | 'title' | 'author' | 'stock' | 'is_active'>;

function BooksDialog({
    code,
    onClose,
}: {
    code: PreOrderCode;
    onClose: () => void;
}) {
    const [page, setPage] = useState(1);
    const [attempt, setAttempt] = useState(0);
    const [books, setBooks] = useState<Paginated<CodeBook> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        fetch(admin.preOrderCodes.books.url(code.id, { query: { page } }), {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Daftar buku gagal dimuat.');
                return (await response.json()) as Paginated<CodeBook>;
            })
            .then((result) => {
                if (!controller.signal.aborted) setBooks(result);
            })
            .catch(() => {
                if (!controller.signal.aborted) setError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [code.id, page, attempt]);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent
                className="max-h-[90svh] overflow-y-auto sm:max-w-3xl"
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    document
                        .getElementById(`preorder-books-${code.id}`)
                        ?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Buku dengan kode {code.code}</DialogTitle>
                    <DialogDescription>
                        Daftar buku yang menggunakan kode preorder ini.
                    </DialogDescription>
                </DialogHeader>
                <div aria-busy={loading}>
                    {loading ? (
                        <p
                            role="status"
                            className="text-muted-foreground py-8 text-center text-sm"
                        >
                            Memuat buku...
                        </p>
                    ) : error ? (
                        <div className="space-y-3 py-8 text-center">
                            <p
                                role="alert"
                                className="text-destructive text-sm"
                            >
                                Daftar buku gagal dimuat.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setAttempt(attempt + 1)}
                            >
                                Coba lagi
                            </Button>
                        </div>
                    ) : (
                        books && (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[560px] text-left text-sm">
                                        <thead className="bg-muted/85 text-muted-foreground border-b text-xs">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    Buku
                                                </th>
                                                <th className="px-4 py-3">
                                                    Penulis
                                                </th>
                                                <th className="px-4 py-3">
                                                    Stok
                                                </th>
                                                <th className="px-4 py-3">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {books.data.map((book) => (
                                                <tr key={book.id}>
                                                    <td className="px-4 py-3">
                                                        <Link
                                                            className="text-primary font-semibold underline"
                                                            href={admin.books.show(
                                                                book.id,
                                                            )}
                                                        >
                                                            {book.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {book.author}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {book.stock}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {book.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!books.data.length && (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Belum ada buku dengan kode preorder ini.
                                    </p>
                                )}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-muted-foreground text-xs">
                                        {books.meta.total} buku - Halaman{' '}
                                        {books.meta.current_page} dari{' '}
                                        {books.meta.last_page}
                                    </p>
                                    <nav
                                        aria-label="Halaman buku"
                                        className="flex gap-2"
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                page >= books.meta.last_page
                                            }
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Berikutnya
                                        </Button>
                                    </nav>
                                </div>
                            </>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function PreOrderCodesIndex({ preOrderCodes, filters }: Props) {
    const [editing, setEditing] = useState<PreOrderCode | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [viewing, setViewing] = useState<PreOrderCode | null>(null);
    const form = useForm({ code: '' });

    const open = (code?: PreOrderCode) => {
        form.clearErrors();
        form.setData('code', code?.code ?? '');
        setEditing(code ?? null);
        setIsOpen(true);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setEditing(null);
                setIsOpen(false);
            },
        };
        if (editing)
            form.patch(admin.preOrderCodes.update.url(editing.id), options);
        else form.post(admin.preOrderCodes.store.url(), options);
    };

    return (
        <>
            <Head title="Kode Preorder" />
            <AdminListLayout
                title="Kode Preorder"
                description="Kelompokkan buku preorder berdasarkan kode dan lihat buku yang terhubung."
                icon={TicketPercent}
            >
                <div className="flex justify-end">
                    <Button
                        id="preorder-create"
                        size="sm"
                        onClick={() => open()}
                    >
                        <Plus /> Tambah Kode Preorder
                    </Button>
                </div>
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(
                                    admin.preOrderCodes.index(),
                                    {
                                        search: new FormData(
                                            event.currentTarget,
                                        ).get('search'),
                                    },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">
                                    Cari kode preorder
                                </Label>
                                <Input
                                    key={filters.search ?? ''}
                                    id="search"
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari kode preorder..."
                                />
                            </div>
                            <Button type="submit">
                                <Search /> Cari
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.get(admin.preOrderCodes.index())
                                }
                            >
                                <RotateCcw /> Reset
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[540px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">
                                            Kode Preorder
                                        </th>
                                        <th className="px-4 py-4">
                                            Jumlah Buku
                                        </th>
                                        <th className="px-4 py-4 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {preOrderCodes.data.map((code) => (
                                        <tr
                                            key={code.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="px-4 py-3.5 font-semibold">
                                                {code.code}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {code.books_count ?? 0}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Lihat buku ${code.code}`}
                                                    id={`preorder-books-${code.id}`}
                                                    onClick={() =>
                                                        setViewing(code)
                                                    }
                                                >
                                                    <BookOpen className="size-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Edit kode preorder ${code.code}`}
                                                    onClick={() => open(code)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Hapus kode preorder ${code.code}`}
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Hapus kode preorder ${code.code}? Relasi buku lama tetap disimpan.`,
                                                            )
                                                        )
                                                            router.delete(
                                                                admin.preOrderCodes.destroy(
                                                                    code.id,
                                                                ),
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                    }}
                                                >
                                                    <Trash2 className="text-destructive size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!preOrderCodes.data.length && (
                            <p className="text-muted-foreground p-10 text-center text-sm">
                                Kode preorder tidak ditemukan.
                            </p>
                        )}
                        <div className="flex flex-col gap-4 border-t bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <p className="text-muted-foreground text-xs">
                                Menampilkan {preOrderCodes.meta.from ?? 0}-
                                {preOrderCodes.meta.to ?? 0} dari{' '}
                                {preOrderCodes.meta.total} kode preorder
                            </p>
                            <Pagination links={preOrderCodes.meta.links} />
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!form.processing) setIsOpen(open);
                }}
            >
                <DialogContent
                    className="sm:max-w-md"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        document.getElementById('preorder-create')?.focus();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? 'Edit Kode Preorder'
                                : 'Tambah Kode Preorder'}
                        </DialogTitle>
                        <DialogDescription>
                            Gunakan kode unik untuk mengelompokkan buku
                            preorder.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Kode</Label>
                            <Input
                                id="code"
                                value={form.data.code}
                                onChange={(event) =>
                                    form.setData('code', event.target.value)
                                }
                                maxLength={100}
                                required
                                aria-invalid={Boolean(form.errors.code)}
                                aria-describedby={
                                    form.errors.code ? 'code-error' : undefined
                                }
                            />
                            {form.errors.code && (
                                <p
                                    id="code-error"
                                    role="alert"
                                    className="text-destructive text-sm"
                                >
                                    {form.errors.code}
                                </p>
                            )}
                        </div>
                        <Button className="w-full" disabled={form.processing}>
                            Simpan
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {viewing && (
                <BooksDialog
                    key={viewing.id}
                    code={viewing}
                    onClose={() => setViewing(null)}
                />
            )}
        </>
    );
}

PreOrderCodesIndex.layout = {
    breadcrumbs: [
        { title: 'Kode Preorder', href: admin.preOrderCodes.index() },
    ],
};
