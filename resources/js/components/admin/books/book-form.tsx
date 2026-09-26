import { FormEvent, useRef } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import admin from '@/routes/admin';
import type { Book, Category } from '@/types/admin';

type FormData = {
    title: string;
    slug: string;
    isbn: string;
    sku: string;
    author: string;
    description: string;
    price: string;
    shipping_category: string;
    weight: string;
    height: string;
    length: string;
    width: string;
    sale_type: Book['sale_type'];
    preorder_estimated_date: string;
    preorder_note: string;
    initial_stock: number;
    category_ids: number[];
    is_active: boolean;
    images: File[];
    image_alt_texts: string[];
    primary_image_index: number | null;
};
export function BookForm({
    book,
    categories,
}: {
    book?: Book;
    categories: Category[];
}) {
    const touched = useRef(Boolean(book));
    const form = useForm<FormData>({
        title: book?.title ?? '',
        slug: book?.slug ?? '',
        isbn: book?.isbn ?? '',
        sku: book?.sku ?? '',
        author: book?.author ?? '',
        description: book?.description ?? '',
        price: book?.price ?? '',
        shipping_category: book?.shipping_category ?? 'others',
        weight: book ? String(book.weight) : '',
        height: book?.height ?? '',
        length: book?.length ?? '',
        width: book?.width ?? '',
        sale_type: book?.sale_type ?? 'ready_stock',
        preorder_estimated_date: book?.preorder_estimated_date ?? '',
        preorder_note: book?.preorder_note ?? '',
        initial_stock: 0,
        category_ids: book?.categories?.map((category) => category.id) ?? [],
        is_active: book?.is_active ?? true,
        images: [],
        image_alt_texts: [],
        primary_image_index: null,
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            forceFormData: !book,
            preserveScroll: true,
            onSuccess: () =>
                book
                    ? undefined
                    : form.reset(
                          'images',
                          'image_alt_texts',
                          'primary_image_index',
                      ),
        };
        if (book) form.put(admin.books.update.url(book.id), options);
        else form.post(admin.books.store.url(), options);
    };
    const error = (key: keyof FormData) =>
        form.errors[key] as string | undefined;
    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Buku</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="title">Judul</Label>
                        <Input
                            id="title"
                            maxLength={255}
                            value={form.data.title}
                            onChange={(e) => {
                                if (!touched.current)
                                    form.setData(
                                        'slug',
                                        e.target.value
                                            .toLowerCase()
                                            .trim()
                                            .replace(/[^a-z0-9]+/g, '-'),
                                    );
                                form.setData('title', e.target.value);
                            }}
                            onBlur={() => {
                                touched.current = true;
                            }}
                            required
                        />
                        {error('title') && (
                            <p className="text-destructive text-sm">
                                {error('title')}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            maxLength={255}
                            value={form.data.slug}
                            onChange={(e) => {
                                touched.current = true;
                                form.setData('slug', e.target.value);
                            }}
                            required
                        />
                        {error('slug') && (
                            <p className="text-destructive text-sm">
                                {error('slug')}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="author">Penulis</Label>
                        <Input
                            id="author"
                            maxLength={200}
                            value={form.data.author}
                            onChange={(e) =>
                                form.setData('author', e.target.value)
                            }
                            required
                        />
                        {error('author') && (
                            <p className="text-destructive text-sm">
                                {error('author')}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="isbn">ISBN</Label>
                        <Input
                            id="isbn"
                            maxLength={50}
                            value={form.data.isbn}
                            onChange={(e) =>
                                form.setData('isbn', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">Harga</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            max="9999999999999.99"
                            step="0.01"
                            value={form.data.price}
                            onChange={(e) =>
                                form.setData('price', e.target.value)
                            }
                            required
                        />
                        {error('price') && (
                            <p className="text-destructive text-sm">
                                {error('price')}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                            id="sku"
                            maxLength={100}
                            value={form.data.sku}
                            onChange={(event) =>
                                form.setData('sku', event.target.value)
                            }
                        />
                        {error('sku') && (
                            <p className="text-destructive text-sm">
                                {error('sku')}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="description">Sinopsis</Label>
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            rows={5}
                        />
                    </div>
                    {!book && (
                        <div className="grid gap-2">
                            <Label htmlFor="initial_stock">Stok Awal</Label>
                            <Input
                                id="initial_stock"
                                type="number"
                                min="0"
                                max="2147483647"
                                value={form.data.initial_stock}
                                onChange={(e) =>
                                    form.setData(
                                        'initial_stock',
                                        Number(e.target.value),
                                    )
                                }
                                required
                            />
                        </div>
                    )}
                    <label className="flex items-center gap-3 pt-7 text-sm">
                        <Checkbox
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked === true)
                            }
                        />
                        Buku aktif dan tampil di katalog
                    </label>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Pengiriman dan Penjualan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="shipping_category">
                            Kategori Pengiriman
                        </Label>
                        <Input
                            id="shipping_category"
                            maxLength={50}
                            value={form.data.shipping_category}
                            onChange={(event) =>
                                form.setData(
                                    'shipping_category',
                                    event.target.value,
                                )
                            }
                            required
                        />
                        {error('shipping_category') && (
                            <p className="text-destructive text-sm">
                                {error('shipping_category')}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="weight">Berat (gram)</Label>
                        <Input
                            id="weight"
                            type="number"
                            min="1"
                            max="2147483647"
                            step="1"
                            value={form.data.weight}
                            onChange={(event) =>
                                form.setData('weight', event.target.value)
                            }
                            required
                        />
                        {error('weight') && (
                            <p className="text-destructive text-sm">
                                {error('weight')}
                            </p>
                        )}
                    </div>
                    {(
                        [
                            { key: 'height', label: 'Tinggi (cm)' },
                            { key: 'length', label: 'Panjang (cm)' },
                            { key: 'width', label: 'Lebar (cm)' },
                        ] as const
                    ).map((field) => (
                        <div key={field.key} className="grid gap-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            <Input
                                id={field.key}
                                type="number"
                                min="0"
                                max="999999.99"
                                step="0.01"
                                value={form.data[field.key]}
                                onChange={(event) =>
                                    form.setData(field.key, event.target.value)
                                }
                            />
                            {error(field.key) && (
                                <p className="text-destructive text-sm">
                                    {error(field.key)}
                                </p>
                            )}
                        </div>
                    ))}
                    <div className="grid gap-2">
                        <Label htmlFor="sale_type">Tipe Penjualan</Label>
                        <select
                            id="sale_type"
                            value={form.data.sale_type}
                            onChange={(event) => {
                                const saleType = event.target
                                    .value as Book['sale_type'];
                                form.setData({
                                    ...form.data,
                                    sale_type: saleType,
                                    ...(saleType === 'ready_stock'
                                        ? {
                                              preorder_estimated_date: '',
                                              preorder_note: '',
                                          }
                                        : {}),
                                });
                            }}
                            className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                            required
                        >
                            <option value="ready_stock">Ready Stock</option>
                            <option value="preorder">Preorder</option>
                        </select>
                        {error('sale_type') && (
                            <p className="text-destructive text-sm">
                                {error('sale_type')}
                            </p>
                        )}
                    </div>
                    {form.data.sale_type === 'preorder' && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="preorder_estimated_date">
                                    Tanggal Estimasi Preorder
                                </Label>
                                <Input
                                    id="preorder_estimated_date"
                                    type="date"
                                    value={form.data.preorder_estimated_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'preorder_estimated_date',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                {error('preorder_estimated_date') && (
                                    <p className="text-destructive text-sm">
                                        {error('preorder_estimated_date')}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="preorder_note">
                                    Catatan Preorder
                                </Label>
                                <Textarea
                                    id="preorder_note"
                                    value={form.data.preorder_note}
                                    onChange={(event) =>
                                        form.setData(
                                            'preorder_note',
                                            event.target.value,
                                        )
                                    }
                                    rows={3}
                                />
                                {error('preorder_note') && (
                                    <p className="text-destructive text-sm">
                                        {error('preorder_note')}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Kategori</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <label
                            key={category.id}
                            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                        >
                            <Checkbox
                                checked={form.data.category_ids.includes(
                                    category.id,
                                )}
                                onCheckedChange={(checked) =>
                                    form.setData(
                                        'category_ids',
                                        checked === true
                                            ? [
                                                  ...form.data.category_ids,
                                                  category.id,
                                              ]
                                            : form.data.category_ids.filter(
                                                  (id) => id !== category.id,
                                              ),
                                    )
                                }
                            />
                            {category.name}
                        </label>
                    ))}
                </CardContent>
            </Card>
            {!book && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gambar Buku</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) =>
                                form.setData(
                                    'images',
                                    Array.from(e.target.files ?? []),
                                )
                            }
                        />
                        <p className="text-muted-foreground text-xs">
                            Maksimal 10 gambar, 8 MB per gambar. Gambar pertama
                            menjadi utama jika tidak dipilih.
                        </p>
                    </CardContent>
                </Card>
            )}
            <div className="flex justify-end gap-3">
                <Button asChild variant="outline">
                    <Link
                        href={
                            book
                                ? admin.books.show(book.id)
                                : admin.books.index()
                        }
                    >
                        Batal
                    </Link>
                </Button>
                <Button disabled={form.processing}>
                    {form.processing
                        ? 'Menyimpan…'
                        : book
                          ? 'Simpan Perubahan'
                          : 'Tambah Buku'}
                </Button>
            </div>
        </form>
    );
}
