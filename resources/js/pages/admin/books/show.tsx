import { FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ImagePlus, Pencil, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, rupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Book, BookImage, StockMovement } from '@/types/admin';

export default function BookShow({
    book,
}: {
    book: Book & { stock_movements?: StockMovement[] };
}) {
    const upload = useForm<{ images: File[] }>({ images: [] });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        upload.post(admin.books.images.store.url(book.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => upload.reset(),
        });
    };
    const updateImage = (
        image: BookImage,
        data: { alt_text: string; is_primary: boolean; image?: File | null },
    ) =>
        router.patch(
            admin.books.images.update.url({ book: book.id, image: image.id }),
            data,
            { forceFormData: true, preserveScroll: true },
        );
    const removeImage = (imageId: number) => {
        if (confirm('Hapus gambar ini?'))
            router.delete(
                admin.books.images.destroy({ book: book.id, image: imageId }),
                { preserveScroll: true },
            );
    };
    return (
        <>
            <Head title={book.title} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={book.title}
                    description={`${book.author} · ${book.isbn || 'ISBN tidak tersedia'}`}
                    actions={
                        <Button asChild>
                            <Link href={admin.books.edit(book.id)}>
                                <Pencil className="mr-2 size-4" />
                                Edit Buku
                            </Link>
                        </Button>
                    }
                />
                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gambar Buku</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {book.images?.map((image) => (
                                    <ImageCard
                                        key={image.id}
                                        image={image}
                                        title={book.title}
                                        onUpdate={updateImage}
                                        onRemove={removeImage}
                                    />
                                ))}
                                {!book.images?.length && (
                                    <p className="text-muted-foreground text-sm">
                                        Belum ada gambar.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Tambah Gambar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={submit}
                                    className="flex flex-col gap-3 sm:flex-row"
                                >
                                    <Input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={(event) =>
                                            upload.setData(
                                                'images',
                                                Array.from(
                                                    event.target.files ?? [],
                                                ),
                                            )
                                        }
                                    />
                                    <Button
                                        disabled={
                                            !upload.data.images.length ||
                                            upload.processing
                                        }
                                    >
                                        <ImagePlus className="mr-2 size-4" />
                                        Unggah
                                    </Button>
                                </form>
                                <p className="text-destructive mt-2 text-sm">
                                    {upload.errors.images}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Deskripsi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
                                    {book.description || 'Tidak ada sinopsis.'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <Info
                                    label="Harga"
                                    value={rupiah(book.price)}
                                />
                                <Info label="Stok" value={String(book.stock)} />
                                <Info
                                    label="Status"
                                    value={
                                        book.is_active ? 'Aktif' : 'Nonaktif'
                                    }
                                />
                                <Info
                                    label="Kategori"
                                    value={
                                        book.categories
                                            ?.map((category) => category.name)
                                            .join(', ') || '-'
                                    }
                                />
                                <Info
                                    label="Diperbarui"
                                    value={formatDate(book.updated_at)}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Stok Terakhir</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {book.stock_movements?.map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="border-b pb-3 last:border-0"
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium">
                                                {movement.type}
                                            </span>
                                            <span
                                                className={
                                                    movement.quantity >= 0
                                                        ? 'text-success'
                                                        : 'text-destructive'
                                                }
                                            >
                                                {movement.quantity > 0
                                                    ? '+'
                                                    : ''}
                                                {movement.quantity}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-xs">
                                            {formatDate(movement.created_at)}
                                        </p>
                                    </div>
                                ))}
                                {!book.stock_movements?.length && (
                                    <p className="text-muted-foreground text-sm">
                                        Belum ada riwayat.
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

function ImageCard({
    image,
    title,
    onUpdate,
    onRemove,
}: {
    image: BookImage;
    title: string;
    onUpdate: (
        image: BookImage,
        data: { alt_text: string; is_primary: boolean; image?: File | null },
    ) => void;
    onRemove: (id: number) => void;
}) {
    const form = useForm<{
        alt_text: string;
        is_primary: boolean;
        image: File | null;
    }>({
        alt_text: image.alt_text ?? '',
        is_primary: image.is_primary,
        image: null,
    });
    return (
        <div className="overflow-hidden rounded-lg border">
            <img
                src={image.url}
                alt={image.alt_text || title}
                className="aspect-[4/3] w-full object-cover"
            />
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onUpdate(image, form.data);
                }}
                className="space-y-2 p-3"
            >
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs">
                        <input
                            type="checkbox"
                            checked={form.data.is_primary}
                            onChange={(event) =>
                                form.setData('is_primary', event.target.checked)
                            }
                        />
                        Utama
                    </label>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemove(image.id)}
                    >
                        <Trash2 className="text-destructive size-4" />
                    </Button>
                </div>
                <Label className="sr-only" htmlFor={`alt-${image.id}`}>
                    Alt text
                </Label>
                <Input
                    id={`alt-${image.id}`}
                    value={form.data.alt_text}
                    onChange={(event) =>
                        form.setData('alt_text', event.target.value)
                    }
                    placeholder="Alt text"
                />
                <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                        form.setData('image', event.target.files?.[0] ?? null)
                    }
                />
                <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={form.processing}
                >
                    <Star className="mr-2 size-3" />
                    Simpan Gambar
                </Button>
            </form>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <strong className="text-right">{value}</strong>
        </div>
    );
}

BookShow.layout = {
    breadcrumbs: [
        { title: 'Buku', href: admin.books.index() },
        { title: 'Detail Buku', href: admin.books.index() },
    ],
};
