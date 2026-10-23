import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    ArrowLeft,
    Check,
    Download,
    FileSpreadsheet,
    Pencil,
    Save,
    Trash2,
    Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { rupiah } from '@/lib/format';
import bookPlaceholder from '../../../../images/book-placeholder.png';

type Field =
    | 'title'
    | 'author'
    | 'isbn'
    | 'sku'
    | 'description'
    | 'price'
    | 'initial_stock'
    | 'weight'
    | 'length'
    | 'width'
    | 'height'
    | 'categories'
    | 'sale_type'
    | 'pre_order_code'
    | 'preorder_estimated_date'
    | 'preorder_note'
    | 'is_active';
type ReferenceOption = {
    id: number | null;
    label: string;
    deleted: boolean;
    key?: string;
};
type Reference = {
    field: 'categories' | 'pre_order_code';
    key: string;
    input: string;
    match: ReferenceOption | null;
    resolved: ReferenceOption | null;
    suggestions: ReferenceOption[];
    decision: string;
    error: string | null;
};
type ImportRow = {
    id: string;
    number: number;
    data: Record<Field, string | boolean>;
    errors: Record<string, string[]>;
    references: Reference[];
    status: 'valid' | 'error' | 'saved';
    book_id: number | null;
};
type Draft = {
    id: string;
    name: string;
    expires_at: number;
    rows: ImportRow[];
    summary: { total: number; valid: number; error: number; saved: number };
    page: number;
    pages: number;
    status: string;
};
type Props = {
    draft: Draft | null;
    categories?: ReferenceOption[];
    preOrderCodes?: ReferenceOption[];
};

const fields: {
    key: Field;
    label: string;
    placeholder: string;
    required?: boolean;
    type?: string;
}[] = [
    {
        key: 'title',
        label: 'Judul',
        placeholder: 'Judul lengkap buku',
        required: true,
    },
    {
        key: 'author',
        label: 'Penulis',
        placeholder: 'Nama penulis',
        required: true,
    },
    {
        key: 'isbn',
        label: 'ISBN',
        placeholder: 'ISBN sebagai teks, misalnya 0012345678901',
    },
    {
        key: 'sku',
        label: 'SKU',
        placeholder: 'Kode unik buku, misalnya BUKU-001',
    },
    {
        key: 'price',
        label: 'Harga (Rp)',
        placeholder: '100000.00',
        required: true,
    },
    {
        key: 'initial_stock',
        label: 'Stok / kuota awal',
        placeholder: '0 atau lebih',
        required: true,
    },
    {
        key: 'weight',
        label: 'Berat (gram)',
        placeholder: '500',
        required: true,
    },
    { key: 'length', label: 'Panjang (cm)', placeholder: '20.00' },
    { key: 'width', label: 'Lebar (cm)', placeholder: '13.00' },
    { key: 'height', label: 'Tinggi (cm)', placeholder: '2.00' },
    {
        key: 'categories',
        label: 'Kategori',
        placeholder: 'Novel; Anak (pisahkan dengan ;)',
    },
    {
        key: 'pre_order_code',
        label: 'Kode preorder',
        placeholder: 'PO-001; wajib untuk preorder',
    },
    {
        key: 'preorder_estimated_date',
        label: 'Estimasi preorder',
        placeholder: '2026-11 atau 2026-11-01; wajib untuk preorder',
    },
    {
        key: 'description',
        label: 'Deskripsi',
        placeholder: 'Sinopsis atau keterangan buku',
    },
    {
        key: 'preorder_note',
        label: 'Catatan preorder',
        placeholder: 'Informasi tambahan estimasi preorder',
    },
];

const selectClass =
    'border-input bg-background h-10 w-full rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';
const statusLabels = {
    valid: 'Siap disimpan',
    error: 'Perlu koreksi',
    saved: 'Tersimpan',
};

export default function BookImport({
    draft,
    categories = [],
    preOrderCodes = [],
}: Props) {
    const upload = useForm<{ file: File | null }>({ file: null });
    const commit = useForm<{ row_id: string | null }>({ row_id: null });
    const [editingId, setEditingId] = useState<string | null>(null);
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const base = draft
        ? `/admin/books/import/${draft.id}`
        : '/admin/books/import';
    const query = draft
        ? `?page=${draft.page}&status=${encodeURIComponent(draft.status)}`
        : '';
    const editing = draft?.rows.find((row) => row.id === editingId);
    const busy = upload.processing || commit.processing;

    const save = (rowId: string | null) => {
        if (
            !rowId &&
            !window.confirm(
                `Simpan seluruh ${draft?.summary.valid ?? 0} buku yang belum tersimpan?`,
            )
        )
            return;
        commit.transform(() => ({ row_id: rowId }));
        commit.post(`${base}/commit${query}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Import Buku Excel" />
            <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-4 py-5 md:px-7 md:py-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/admin/books"
                        className="inline-flex items-center gap-2 text-sm hover:underline"
                    >
                        <ArrowLeft className="size-4" /> Daftar buku
                    </Link>
                    <Button asChild variant="outline" size="sm">
                        <a href="/admin/books/import/template">
                            <Download /> Unduh Template Excel
                        </a>
                    </Button>
                </div>
                <section className="bg-muted/60 rounded-2xl border px-5 py-6 sm:px-7">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-primary-foreground rounded-xl p-3">
                            <FileSpreadsheet className="size-6" />
                        </span>
                        <div>
                            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                                Import buku dari Excel
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Unduh template, isi data, periksa, lalu simpan
                                ke katalog.
                            </p>
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-4 max-w-3xl text-sm leading-6">
                        Unggah tidak langsung membuat buku. Kategori dan kode
                        preorder baru hanya dibuat saat Anda menyimpan buku.
                        Gambar memakai placeholder dan dapat diganti di halaman
                        edit buku.
                    </p>
                </section>
                {errors.import && (
                    <div
                        role="alert"
                        className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm"
                    >
                        {errors.import}
                    </div>
                )}
                {!draft ? (
                    <Card>
                        <CardContent className="space-y-5 p-5 sm:p-7">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Unggah template yang sudah diisi
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Format .xlsx, maksimal 5 MB dan 1.000 buku.
                                    Hanya sheet Buku yang dibaca.
                                </p>
                            </div>
                            <form
                                onSubmit={(event: FormEvent) => {
                                    event.preventDefault();
                                    upload.post('/admin/books/import', {
                                        forceFormData: true,
                                    });
                                }}
                                className="max-w-xl space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="excel-file">
                                        File Excel{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="excel-file"
                                        type="file"
                                        accept=".xlsx"
                                        required
                                        onChange={(event) =>
                                            upload.setData(
                                                'file',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    {upload.errors.file && (
                                        <p
                                            role="alert"
                                            className="text-destructive text-sm"
                                        >
                                            {upload.errors.file}
                                        </p>
                                    )}
                                </div>
                                {upload.progress && (
                                    <p
                                        role="status"
                                        className="text-muted-foreground text-sm"
                                    >
                                        Mengunggah {upload.progress.percentage}%
                                    </p>
                                )}
                                <Button
                                    disabled={
                                        !upload.data.file || upload.processing
                                    }
                                >
                                    <Upload />
                                    {upload.processing
                                        ? 'Membaca Excel...'
                                        : 'Unggah dan Lihat Pratinjau'}
                                </Button>
                            </form>
                            <div className="bg-muted rounded-xl p-4 text-sm leading-6">
                                <strong>Petunjuk singkat</strong>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    <li>
                                        Kolom wajib: judul, penulis, harga, stok
                                        awal, dan berat gram.
                                    </li>
                                    <li>
                                        Untuk preorder, isi kode dan estimasi
                                        preorder.
                                    </li>
                                    <li>
                                        Pisahkan beberapa kategori dengan titik
                                        koma (;).
                                    </li>
                                    <li>
                                        ISBN, SKU, dan kode preorder harus
                                        berupa teks. Jangan memakai formula.
                                    </li>
                                    <li>
                                        Sheet Petunjuk dan Contoh berisi panduan
                                        lengkap.
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {(
                                [
                                    ['total', 'Total buku'],
                                    ['valid', 'Siap disimpan'],
                                    ['error', 'Perlu koreksi'],
                                    ['saved', 'Tersimpan'],
                                ] as const
                            ).map(([key, label]) => (
                                <Card key={key}>
                                    <CardContent className="p-4">
                                        <p className="text-muted-foreground text-xs">
                                            {label}
                                        </p>
                                        <p
                                            className={`mt-1 text-2xl font-semibold ${key === 'error' && draft.summary.error ? 'text-destructive' : ''}`}
                                        >
                                            {draft.summary[key]}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Card>
                            <CardContent className="space-y-4 p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold break-all">
                                            {draft.name}
                                        </h2>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Draf sementara sampai{' '}
                                            {new Date(
                                                draft.expires_at * 1000,
                                            ).toLocaleString('id-ID')}
                                            , atau sampai sesi berakhir. Refresh
                                            tidak menghapus koreksi.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Link href="/admin/books/import">
                                                Unggah File Lain
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={
                                                busy ||
                                                draft.summary.error > 0 ||
                                                draft.summary.valid === 0
                                            }
                                            onClick={() => save(null)}
                                        >
                                            <Save />
                                            {commit.processing
                                                ? 'Menyimpan...'
                                                : 'Simpan Semua'}
                                        </Button>
                                    </div>
                                </div>
                                {draft.summary.error > 0 && (
                                    <p
                                        role="status"
                                        className="text-destructive text-sm"
                                    >
                                        Simpan Semua belum tersedia. Koreksi
                                        atau hapus seluruh baris bermasalah
                                        terlebih dahulu. Buku valid tetap dapat
                                        disimpan satuan.
                                    </p>
                                )}
                                {draft.summary.saved === draft.summary.total &&
                                    draft.summary.total > 0 && (
                                        <p
                                            role="status"
                                            className="text-primary flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Check className="size-4" /> Seluruh
                                            buku sudah tersimpan di katalog.
                                        </p>
                                    )}
                                <div className="max-w-xs space-y-1">
                                    <Label htmlFor="import-status">
                                        Tampilkan baris
                                    </Label>
                                    <select
                                        id="import-status"
                                        className={selectClass}
                                        value={draft.status}
                                        onChange={(event) =>
                                            router.get(
                                                base,
                                                { status: event.target.value },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            )
                                        }
                                    >
                                        <option value="">Semua status</option>
                                        <option value="valid">
                                            Siap disimpan
                                        </option>
                                        <option value="error">
                                            Perlu koreksi
                                        </option>
                                        <option value="saved">Tersimpan</option>
                                    </select>
                                </div>
                                <p className="text-muted-foreground text-xs sm:hidden">
                                    Geser tabel untuk melihat seluruh kolom dan
                                    aksi.
                                </p>
                                <div className="overflow-x-auto rounded-xl border">
                                    <table className="w-full min-w-[1150px] text-left text-sm">
                                        <thead className="bg-muted/70 text-xs">
                                            <tr>
                                                {[
                                                    'Baris',
                                                    'Buku',
                                                    'Harga / stok',
                                                    'Berat / dimensi',
                                                    'Kategori / preorder',
                                                    'Validasi',
                                                    'Aksi',
                                                ].map((title) => (
                                                    <th
                                                        key={title}
                                                        className="px-4 py-3 font-semibold"
                                                    >
                                                        {title}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {draft.rows.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="text-muted-foreground p-8 text-center"
                                                    >
                                                        Tidak ada baris untuk
                                                        status ini.
                                                    </td>
                                                </tr>
                                            )}
                                            {draft.rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="align-top"
                                                >
                                                    <td className="px-4 py-4">
                                                        {row.number}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex min-w-52 gap-3">
                                                            <img
                                                                src={
                                                                    bookPlaceholder
                                                                }
                                                                alt="Sampul placeholder"
                                                                className="h-16 w-12 rounded object-cover"
                                                            />
                                                            <div>
                                                                <p className="font-semibold">
                                                                    {String(
                                                                        row.data
                                                                            .title,
                                                                    ) ||
                                                                        '(Judul belum diisi)'}
                                                                </p>
                                                                <p className="text-muted-foreground mt-1 text-xs">
                                                                    {String(
                                                                        row.data
                                                                            .author,
                                                                    ) ||
                                                                        'Penulis belum diisi'}
                                                                </p>
                                                                <p className="text-muted-foreground mt-1 text-xs">
                                                                    SKU:{' '}
                                                                    {row.data
                                                                        .sku ||
                                                                        '-'}
                                                                    <br />
                                                                    ISBN:{' '}
                                                                    {row.data
                                                                        .isbn ||
                                                                        '-'}
                                                                </p>
                                                                <span className="mt-1 inline-block text-xs">
                                                                    {row.data
                                                                        .is_active ===
                                                                    true
                                                                        ? 'Aktif'
                                                                        : row
                                                                                .data
                                                                                .is_active ===
                                                                            false
                                                                          ? 'Nonaktif'
                                                                          : `Status tidak valid: ${row.data.is_active}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="space-y-1 px-4 py-4">
                                                        <p>
                                                            {Number.isFinite(
                                                                Number(
                                                                    row.data
                                                                        .price,
                                                                ),
                                                            ) &&
                                                            row.data.price !==
                                                                ''
                                                                ? rupiah(
                                                                      String(
                                                                          row
                                                                              .data
                                                                              .price,
                                                                      ),
                                                                  )
                                                                : String(
                                                                      row.data
                                                                          .price,
                                                                  ) || '-'}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            Stok / kuota:{' '}
                                                            {row.data
                                                                .initial_stock ||
                                                                '0'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p>
                                                            {row.data.weight ||
                                                                '-'}{' '}
                                                            gram
                                                        </p>
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {row.data.length ||
                                                                '-'}{' '}
                                                            ×{' '}
                                                            {row.data.width ||
                                                                '-'}{' '}
                                                            ×{' '}
                                                            {row.data.height ||
                                                                '-'}{' '}
                                                            cm
                                                        </p>
                                                    </td>
                                                    <td className="max-w-56 px-4 py-4">
                                                        <p>
                                                            {row.data
                                                                .categories ||
                                                                'Tanpa kategori'}
                                                        </p>
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {row.data
                                                                .sale_type ===
                                                            'preorder'
                                                                ? `Preorder: ${row.data.pre_order_code || '-'} · ${row.data.preorder_estimated_date || '-'}`
                                                                : 'Ready stock'}
                                                        </p>
                                                        {row.references
                                                            .filter(
                                                                (reference) =>
                                                                    !reference.match,
                                                            )
                                                            .map(
                                                                (reference) => (
                                                                    <p
                                                                        key={
                                                                            reference.key
                                                                        }
                                                                        className="text-primary mt-1 text-xs"
                                                                    >
                                                                        {reference.decision.startsWith(
                                                                            'use:',
                                                                        ) ||
                                                                        reference.decision.startsWith(
                                                                            'restore:',
                                                                        )
                                                                            ? `${reference.input}: menggunakan ${reference.resolved?.label ?? 'referensi pilihan'}`
                                                                            : `Baru: ${reference.input}`}
                                                                    </p>
                                                                ),
                                                            )}
                                                    </td>
                                                    <td className="max-w-72 px-4 py-4">
                                                        <span
                                                            className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${row.status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
                                                        >
                                                            {
                                                                statusLabels[
                                                                    row.status
                                                                ]
                                                            }
                                                        </span>
                                                        {Object.entries(
                                                            row.errors,
                                                        ).map(
                                                            ([
                                                                field,
                                                                messages,
                                                            ]) => (
                                                                <p
                                                                    key={field}
                                                                    className="text-destructive mt-2 text-xs leading-5"
                                                                >
                                                                    {fields.find(
                                                                        (
                                                                            item,
                                                                        ) =>
                                                                            item.key ===
                                                                            field,
                                                                    )?.label ??
                                                                        field}
                                                                    :{' '}
                                                                    {messages.join(
                                                                        ' ',
                                                                    )}
                                                                </p>
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex min-w-32 flex-col gap-2">
                                                            {row.book_id ? (
                                                                <Button
                                                                    asChild
                                                                    size="sm"
                                                                    variant="outline"
                                                                >
                                                                    <Link
                                                                        href={`/admin/books/${row.book_id}/edit`}
                                                                    >
                                                                        Edit
                                                                        Buku /
                                                                        Gambar
                                                                    </Link>
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={
                                                                            busy
                                                                        }
                                                                        onClick={() =>
                                                                            setEditingId(
                                                                                row.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Pencil />{' '}
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={
                                                                            busy ||
                                                                            row.status !==
                                                                                'valid'
                                                                        }
                                                                        onClick={() =>
                                                                            save(
                                                                                row.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Save />{' '}
                                                                        Simpan
                                                                        Buku Ini
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        disabled={
                                                                            busy
                                                                        }
                                                                        onClick={() => {
                                                                            if (
                                                                                window.confirm(
                                                                                    `Hapus baris ${row.number} dari draf? Data katalog tidak berubah.`,
                                                                                )
                                                                            )
                                                                                router.delete(
                                                                                    `${base}/rows/${row.id}${query}`,
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                    },
                                                                                );
                                                                        }}
                                                                    >
                                                                        <Trash2 />{' '}
                                                                        Hapus
                                                                        dari
                                                                        Draf
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <nav
                                    aria-label="Halaman pratinjau"
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={draft.page <= 1 || busy}
                                        onClick={() =>
                                            router.get(
                                                base,
                                                {
                                                    page: draft.page - 1,
                                                    status: draft.status,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Sebelumnya
                                    </Button>
                                    <span className="text-muted-foreground">
                                        Halaman {draft.page} / {draft.pages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            draft.page >= draft.pages || busy
                                        }
                                        onClick={() =>
                                            router.get(
                                                base,
                                                {
                                                    page: draft.page + 1,
                                                    status: draft.status,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Berikutnya
                                    </Button>
                                </nav>
                            </CardContent>
                        </Card>
                    </>
                )}
                {draft && editing && (
                    <RowEditor
                        key={editing.id}
                        row={editing}
                        url={`${base}/rows/${editing.id}${query}`}
                        categories={categories}
                        preOrderCodes={preOrderCodes}
                        onClose={() => setEditingId(null)}
                    />
                )}
            </main>
        </>
    );
}

function RowEditor({
    row,
    url,
    categories,
    preOrderCodes,
    onClose,
}: {
    row: ImportRow;
    url: string;
    categories: ReferenceOption[];
    preOrderCodes: ReferenceOption[];
    onClose: () => void;
}) {
    const values = Object.fromEntries(
        Object.entries(row.data).map(([key, value]) => [
            key,
            typeof value === 'boolean' ? (value ? 'Ya' : 'Tidak') : value,
        ]),
    ) as Record<Field, string>;
    const form = useForm<{
        data: Record<Field, string>;
        decisions: Record<string, string>;
    }>({
        data: values,
        decisions: Object.fromEntries(
            row.references.map((reference) => [
                reference.key,
                reference.decision,
            ]),
        ),
    });
    const error = (key: Field) =>
        form.errors[`data.${key}` as keyof typeof form.errors] ||
        (Array.isArray(row.errors[key])
            ? row.errors[key].join(' ')
            : undefined);
    const setValue = (field: Field, value: string) =>
        form.setData('data', { ...form.data.data, [field]: value });
    const choose = (reference: Reference, value: string) => {
        if (value.startsWith('draft:')) {
            const name = value.slice(6);
            if (reference.field === 'categories')
                setValue(
                    'categories',
                    form.data.data.categories
                        .split(';')
                        .map((part) =>
                            part.trim() === reference.input ? name : part,
                        )
                        .join('; '),
                );
            else setValue('pre_order_code', name);
            return;
        }
        form.setData('decisions', {
            ...form.data.decisions,
            [reference.key]: value,
        });
    };
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !form.processing) onClose();
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Koreksi buku · baris {row.number}</DialogTitle>
                    <DialogDescription>
                        Perubahan hanya disimpan ke draf. Setelah valid, simpan
                        buku melalui tabel pratinjau.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(url, {
                            preserveScroll: true,
                            onSuccess: (page) => {
                                const updated = (
                                    page.props.draft as Draft | undefined
                                )?.rows.find((item) => item.id === row.id);
                                if (updated?.status === 'valid') onClose();
                            },
                        });
                    }}
                    className="space-y-5"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div
                                key={field.key}
                                className={`space-y-2 ${['description', 'preorder_note', 'categories'].includes(field.key) ? 'sm:col-span-2' : ''}`}
                            >
                                <Label htmlFor={`import-${field.key}`}>
                                    {field.label}
                                    {(field.required ||
                                        (form.data.data.sale_type ===
                                            'preorder' &&
                                            [
                                                'pre_order_code',
                                                'preorder_estimated_date',
                                            ].includes(field.key))) && (
                                        <span className="text-destructive">
                                            {' '}
                                            *
                                        </span>
                                    )}
                                </Label>
                                {['description', 'preorder_note'].includes(
                                    field.key,
                                ) ? (
                                    <textarea
                                        id={`import-${field.key}`}
                                        value={form.data.data[field.key]}
                                        placeholder={field.placeholder}
                                        onChange={(event) =>
                                            setValue(
                                                field.key,
                                                event.target.value,
                                            )
                                        }
                                        className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                    />
                                ) : (
                                    <Input
                                        id={`import-${field.key}`}
                                        value={form.data.data[field.key]}
                                        placeholder={field.placeholder}
                                        onChange={(event) =>
                                            setValue(
                                                field.key,
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(error(field.key))}
                                        aria-describedby={
                                            error(field.key)
                                                ? `import-${field.key}-error`
                                                : undefined
                                        }
                                    />
                                )}
                                {error(field.key) && (
                                    <p
                                        id={`import-${field.key}-error`}
                                        role="alert"
                                        className="text-destructive text-xs"
                                    >
                                        {error(field.key)}
                                    </p>
                                )}
                            </div>
                        ))}
                        <div className="space-y-2">
                            <Label htmlFor="import-sale-type">
                                Jenis penjualan
                            </Label>
                            <select
                                id="import-sale-type"
                                className={selectClass}
                                value={form.data.data.sale_type}
                                onChange={(event) => {
                                    form.setData('data', {
                                        ...form.data.data,
                                        sale_type: event.target.value,
                                        ...(event.target.value === 'ready_stock'
                                            ? {
                                                  pre_order_code: '',
                                                  preorder_estimated_date: '',
                                                  preorder_note: '',
                                              }
                                            : {}),
                                    });
                                }}
                            >
                                <option value="ready_stock">Ready Stock</option>
                                <option value="preorder">Preorder</option>
                                {!['ready_stock', 'preorder'].includes(
                                    form.data.data.sale_type,
                                ) && (
                                    <option value={form.data.data.sale_type}>
                                        {form.data.data.sale_type} (tidak valid)
                                    </option>
                                )}
                            </select>
                            {error('sale_type') && (
                                <p className="text-destructive text-xs">
                                    {error('sale_type')}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="import-active">Status aktif</Label>
                            <select
                                id="import-active"
                                className={selectClass}
                                value={form.data.data.is_active}
                                onChange={(event) =>
                                    setValue('is_active', event.target.value)
                                }
                            >
                                <option value="Ya">Ya</option>
                                <option value="Tidak">Tidak</option>
                                {!['Ya', 'Tidak'].includes(
                                    form.data.data.is_active,
                                ) && (
                                    <option value={form.data.data.is_active}>
                                        {form.data.data.is_active} (tidak valid)
                                    </option>
                                )}
                            </select>
                            {error('is_active') && (
                                <p className="text-destructive text-xs">
                                    {error('is_active')}
                                </p>
                            )}
                        </div>
                    </div>
                    {row.references
                        .filter(
                            (reference) => reference.error || !reference.match,
                        )
                        .map((reference) => (
                            <div
                                key={reference.key}
                                className="bg-muted/60 space-y-2 rounded-xl border p-4"
                            >
                                <Label htmlFor={`reference-${reference.key}`}>
                                    {reference.field === 'categories'
                                        ? 'Kategori'
                                        : 'Kode preorder'}
                                    : {reference.input}
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                    {reference.error ??
                                        'Referensi baru akan dibuat saat buku disimpan.'}
                                </p>
                                <select
                                    id={`reference-${reference.key}`}
                                    className={selectClass}
                                    value={
                                        form.data.decisions[reference.key] ?? ''
                                    }
                                    onChange={(event) =>
                                        choose(reference, event.target.value)
                                    }
                                >
                                    <option value="">
                                        Pilih keputusan referensi
                                    </option>
                                    {!reference.match && (
                                        <option value="create">
                                            Konfirmasi: buat nama baru ini
                                        </option>
                                    )}
                                    {(reference.field === 'categories'
                                        ? categories
                                        : preOrderCodes
                                    ).map((option) => (
                                        <option
                                            key={option.id}
                                            value={`${option.deleted ? 'restore' : 'use'}:${option.id}`}
                                        >
                                            {option.deleted
                                                ? 'Pulihkan dan gunakan'
                                                : 'Gunakan'}
                                            : {option.label}
                                        </option>
                                    ))}
                                    {reference.suggestions
                                        .filter((option) => option.id === null)
                                        .map((option) => (
                                            <option
                                                key={option.label}
                                                value={`draft:${option.label}`}
                                            >
                                                Samakan dengan nama di file:{' '}
                                                {option.label}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        ))}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={form.processing}
                        >
                            Tutup
                        </Button>
                        <Button disabled={form.processing}>
                            <Check />
                            {form.processing
                                ? 'Memeriksa...'
                                : 'Simpan Koreksi dan Validasi'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
