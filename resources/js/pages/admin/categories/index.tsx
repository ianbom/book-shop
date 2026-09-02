import { FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
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
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Kategori"
                    description="Kelompokkan buku agar katalog mudah dijelajahi."
                    actions={
                        <Button onClick={() => open()}>
                            <Plus className="mr-2 size-4" />
                            Tambah Kategori
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="p-4">
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
                        >
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Cari kategori…"
                            />
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground border-b bg-slate-50 text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Nama</th>
                                        <th className="px-5 py-3">Slug</th>
                                        <th className="px-5 py-3">
                                            Jumlah Buku
                                        </th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {categories.data.map((category) => (
                                        <tr key={category.id}>
                                            <td className="px-5 py-4 font-medium">
                                                {category.name}
                                            </td>
                                            <td className="text-muted-foreground px-5 py-4">
                                                {category.slug}
                                            </td>
                                            <td className="px-5 py-4">
                                                {category.books_count ?? 0}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        open(category)
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
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
                        <div className="border-t p-4">
                            <Pagination links={categories.meta.links} />
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
