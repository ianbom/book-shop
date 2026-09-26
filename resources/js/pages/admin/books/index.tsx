import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ChevronRight,
    House,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tags,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/admin/shared/pagination';
import admin from '@/routes/admin';
import { rupiah } from '@/lib/format';
import type { Book, Category, Paginated } from '@/types/admin';

export default function BooksIndex({
    books,
    categories,
    filters,
}: {
    books: Paginated<Book>;
    categories: { data: Category[] } | Category[];
    filters: { search?: string; category?: string; status?: string };
}) {
    const categoryData = Array.isArray(categories)
        ? categories
        : categories.data;
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(admin.books.index(), Object.fromEntries(data.entries()), {
            preserveState: true,
            replace: true,
        });
    };
    return (
        <>
            <Head title="Buku" />
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
                            Buku
                        </span>
                    </nav>
                    <Button asChild size="sm">
                        <Link href={admin.books.create()}>
                            <Plus /> Tambah Buku
                        </Link>
                    </Button>
                </div>
                <section className="bg-muted/60 relative overflow-hidden rounded-2xl border border-white/80 px-5 py-6 sm:px-7 sm:py-7">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl shadow-sm">
                                <BookOpen className="size-6" />
                            </span>
                            <div>
                                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                                    Manajemen Toko
                                </p>
                                <h1 className="font-heading text-foreground text-4xl leading-none font-bold sm:text-5xl">
                                    Buku
                                </h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
                            Kelola katalog, harga, kategori, dan status buku.
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
                            onSubmit={submit}
                            className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_auto_auto] xl:items-end"
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
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Tags className="text-primary size-4" />{' '}
                                    Kategori
                                </span>
                                <select
                                    name="category"
                                    defaultValue={filters.category ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua kategori</option>
                                    {categoryData.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <BookOpen className="text-primary size-4" />{' '}
                                    Status Buku
                                </span>
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.get(admin.books.index())}
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
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Buku</th>
                                        <th className="px-4 py-4">Penulis</th>
                                        <th className="px-4 py-4">Kategori</th>
                                        <th className="px-4 py-4">Harga</th>
                                        <th className="px-4 py-4">Stok</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {books.data.map((book) => (
                                        <tr
                                            key={book.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <Link
                                                    href={admin.books.show(
                                                        book.id,
                                                    )}
                                                    className="text-primary font-medium"
                                                >
                                                    {book.title}
                                                </Link>
                                                <div className="text-muted-foreground text-xs">
                                                    {book.isbn ||
                                                        'ISBN tidak tersedia'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {book.author}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {book.categories
                                                    ?.map(
                                                        (category) =>
                                                            category.name,
                                                    )
                                                    .join(', ') || '-'}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {rupiah(book.price)}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium">
                                                {book.stock}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs ${book.is_active ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'}`}
                                                >
                                                    {book.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <Link
                                                        href={admin.books.edit(
                                                            book.id,
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!books.data.length && (
                            <p className="text-muted-foreground p-8 text-center text-sm">
                                Buku belum tersedia.
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
        </>
    );
}
BooksIndex.layout = {
    breadcrumbs: [{ title: 'Buku', href: admin.books.index() }],
};
