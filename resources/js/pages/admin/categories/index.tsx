import { FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    House,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tags,
    Trash2,
} from 'lucide-react';
import { Pagination } from '@/components/admin/shared/pagination';
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
import admin from '@/routes/admin';
import type { Category, Paginated } from '@/types/admin';

type Props = { categories: Paginated<Category>; filters: { search?: string } };

export default function CategoriesIndex({ categories, filters }: Props) {
    const [editing, setEditing] = useState<Category | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm({ name: '', slug: '' });

    const open = (category?: Category) => {
        setEditing(category ?? null);
        setIsOpen(true);
        form.setData({
            name: category?.name ?? '',
            slug: category?.slug ?? '',
        });
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
            form.patch(admin.categories.update.url(editing.id), options);
        else form.post(admin.categories.store.url(), options);
    };

    return (
        <>
            <Head title="Kategori" />
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
                            Kategori
                        </span>
                    </nav>
                    <Button onClick={() => open()} size="sm">
                        <Plus /> Tambah Kategori
                    </Button>
                </div>
                <section className="bg-muted/60 relative overflow-hidden rounded-2xl border border-white/80 px-5 py-6 sm:px-7 sm:py-7">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl shadow-sm">
                                <Tags className="size-6" />
                            </span>
                            <div>
                                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                                    Manajemen Toko
                                </p>
                                <h1 className="font-heading text-foreground text-4xl leading-none font-bold sm:text-5xl">
                                    Kategori
                                </h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
                            Kelompokkan buku agar katalog mudah dijelajahi.
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
                                    admin.categories.index(),
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
                                    Nama Kategori
                                </span>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari kategori..."
                                        className="bg-background h-10 pl-9"
                                    />
                                </div>
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    router.get(admin.categories.index())
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
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Nama</th>
                                        <th className="px-4 py-4">Slug</th>
                                        <th className="px-4 py-4">
                                            Jumlah Buku
                                        </th>
                                        <th className="px-4 py-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {categories.data.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="px-4 py-3.5 font-medium">
                                                {category.name}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3.5">
                                                {category.slug}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {category.books_count ?? 0}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Edit kategori ${category.name}`}
                                                    onClick={() =>
                                                        open(category)
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Hapus kategori ${category.name}`}
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Hapus kategori ${category.name}?`,
                                                            )
                                                        )
                                                            router.delete(
                                                                admin.categories.destroy(
                                                                    category.id,
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
                        {categories.data.length === 0 && (
                            <p className="text-muted-foreground p-10 text-center text-sm">
                                Kategori tidak ditemukan.
                            </p>
                        )}
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {categories.meta.from ?? 0}–
                                    {categories.meta.to ?? 0} dari{' '}
                                    {categories.meta.total} kategori
                                </p>
                                <Pagination links={categories.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditing(null);
                        form.reset();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Kategori' : 'Tambah Kategori'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) => {
                                    form.setData('name', event.target.value);
                                    if (!editing)
                                        form.setData(
                                            'slug',
                                            event.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9]+/g, '-')
                                                .replace(/(^-|-$)/g, ''),
                                        );
                                }}
                                required
                            />
                            <p className="text-destructive text-sm">
                                {form.errors.name}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                onChange={(event) =>
                                    form.setData('slug', event.target.value)
                                }
                                required
                            />
                            <p className="text-destructive text-sm">
                                {form.errors.slug}
                            </p>
                        </div>
                        <Button className="w-full" disabled={form.processing}>
                            Simpan
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [{ title: 'Kategori', href: admin.categories.index() }],
};
