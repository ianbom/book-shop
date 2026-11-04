import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exactRupiah as rupiah, exactRupiahCents } from '@/lib/format';

type Reference = {
    key: string;
    field: string;
    input: string;
    id: number | null;
    action: 'create' | 'reuse';
    error: string | null;
    suggestions: { id: number; label: string; deleted: boolean }[];
};
type ImportRow = {
    id: string;
    number: number;
    group_id: string;
    data: Record<string, string>;
    errors: Record<string, string[]>;
    decisions: Record<string, string>;
    references: Reference[];
    book: Reference | null;
    order_id: number | null;
    totals: { net: number; weight: number } | null;
};
type Group = {
    id: string;
    code: string;
    row_ids: string[];
    order_id: number | null;
    errors: string[];
    subtotal: string;
    historical_dp: string;
    historical_paid: string;
    outstanding_books: string;
    weight: number;
};
type Draft = {
    id: string;
    name: string;
    expires_at: number;
    rows: ImportRow[];
    groups: Group[];
    warnings: string[];
    results: { group_id: string; status: string; errors: string[] }[];
    page: number;
    pages: number;
};
type ReferenceOption = { id: number; label: string };
type Props = {
    draft: Draft | null;
    fields: string[];
    headers: string[];
    preOrderCodes?: ReferenceOption[];
    categories?: ReferenceOption[];
};
const importStatuses = ['processing', 'delivered', 'completed'];

export default function OrderImport({
    draft,
    fields,
    headers,
    preOrderCodes = [],
    categories = [],
}: Props) {
    const upload = useForm<{ file: File | null }>({ file: null });
    const commit = useForm<{ group_id: string | null }>({ group_id: null });
    const [editing, setEditing] = useState<ImportRow | null>(null);
    const base = draft
        ? `/admin/orders/import/${draft.id}`
        : '/admin/orders/import';
    const query = draft ? `?page=${draft.page}` : '';
    const busy = upload.processing || commit.processing;
    const expired = draft !== null && draft.expires_at * 1000 <= Date.now();
    const valid =
        draft?.groups.filter(
            (group) => !group.order_id && group.errors.length === 0,
        ).length ?? 0;
    const save = (id: string | null) => {
        commit.transform(() => ({ group_id: id }));
        commit.post(`${base}/commit${query}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Import pesanan lawas" />
            <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8 p-4 md:p-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Import pesanan lawas
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {draft
                                ? 'Periksa dan koreksi data sebelum menyimpan pesanan.'
                                : 'Unggah Excel untuk memeriksa pesanan sebelum disimpan.'}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/admin/orders">Kembali ke pesanan</Link>
                    </Button>
                </header>

                {!draft ? (
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
                        <section
                            className="bg-card rounded-lg border p-5 sm:p-6"
                            aria-labelledby="upload-title"
                        >
                            <h2
                                id="upload-title"
                                className="text-lg font-semibold"
                            >
                                Pilih file Excel
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Format XLSX, maksimal 5 MB dan 1.000 baris pada
                                Sheet1.
                            </p>
                            <form
                                className="mt-6 space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    upload.post('/admin/orders/import', {
                                        forceFormData: true,
                                    });
                                }}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="order-file">
                                        File Excel (wajib)
                                    </Label>
                                    <Input
                                        id="order-file"
                                        type="file"
                                        accept=".xlsx"
                                        required
                                        disabled={busy}
                                        onChange={(event) =>
                                            upload.setData(
                                                'file',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            upload.errors.file,
                                        )}
                                        aria-describedby={
                                            upload.errors.file
                                                ? 'upload-error'
                                                : undefined
                                        }
                                    />
                                    {upload.errors.file && (
                                        <p
                                            id="upload-error"
                                            role="alert"
                                            className="text-destructive text-sm"
                                        >
                                            {upload.errors.file}
                                        </p>
                                    )}
                                </div>
                                <Button disabled={busy || !upload.data.file}>
                                    {upload.processing
                                        ? 'Membaca Excel…'
                                        : 'Buka draf pemeriksaan'}
                                </Button>
                            </form>
                        </section>
                        <aside className="space-y-4 text-sm">
                            <div>
                                <h2 className="font-semibold">Siapkan data</h2>
                                <p className="text-muted-foreground mt-2 leading-relaxed">
                                    Gunakan ETA YYYY-MM, berat dalam gram, dan
                                    nominal tanpa pemisah ribuan. Tulis nilai
                                    nol secara eksplisit.
                                </p>
                                <a
                                    href="/admin/orders/import/template"
                                    className="mt-3 inline-block font-medium underline underline-offset-4"
                                >
                                    Unduh template dan contoh
                                </a>
                            </div>
                            <p className="text-muted-foreground border-t pt-4 leading-relaxed">
                                Import tidak mengubah stok atau wallet. DP hanya
                                informasi; pembayaran historis mengurangi
                                tagihan. Status hanya processing, delivered,
                                atau completed. Processing boleh tanpa
                                alamat/kode pos; customer wajib memilih
                                pengiriman dan membayar sisa buku beserta
                                ongkir. Delivered/completed wajib alamat, kode
                                pos 5 digit, dan pembayaran penuh sesuai harga
                                total tiap baris; customer tidak mengubahnya
                                lagi. Delivered disimpan sebagai shipping, lalu
                                diselesaikan manual oleh admin. Ongkir historis
                                tidak dicatat.
                            </p>
                        </aside>
                    </div>
                ) : (
                    <>
                        <section
                            className="space-y-3 border-b pb-6"
                            aria-labelledby="draft-title"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2
                                        id="draft-title"
                                        className="text-lg font-semibold break-words"
                                    >
                                        {draft.name}
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Draf berlaku sampai{' '}
                                        {new Date(
                                            draft.expires_at * 1000,
                                        ).toLocaleString('id-ID')}
                                        . Kelompok yang tersimpan tidak dapat
                                        diubah.
                                    </p>
                                </div>
                                <Link
                                    href="/admin/orders/import"
                                    className="text-sm font-medium underline underline-offset-4"
                                >
                                    Unggah file lain
                                </Link>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Draf bukan arsip permanen. Simpan pesanan yang
                                siap sebelum draf kedaluwarsa.
                            </p>
                            {expired && (
                                <p
                                    role="alert"
                                    className="text-destructive text-sm"
                                >
                                    Draf kedaluwarsa. Unggah ulang Excel.
                                </p>
                            )}
                            {draft.warnings.map((warning, index) => (
                                <p
                                    key={index}
                                    role="status"
                                    className="text-sm"
                                >
                                    {warning}
                                </p>
                            ))}
                        </section>

                        <section
                            className="space-y-4"
                            aria-labelledby="groups-title"
                        >
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <h2
                                        id="groups-title"
                                        className="text-lg font-semibold"
                                    >
                                        Kelompok pesanan
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {draft.groups.length} kelompok di
                                        seluruh draf. Penyimpanan sekaligus
                                        mencakup semua kelompok yang siap,
                                        termasuk di halaman lain.
                                    </p>
                                </div>
                                <Button
                                    disabled={busy || expired || valid === 0}
                                    onClick={() => save(null)}
                                >
                                    {commit.processing
                                        ? 'Menyimpan…'
                                        : `Simpan semua yang siap (${valid})`}
                                </Button>
                            </div>
                            {draft.groups.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    Tidak ada kelompok pesanan dalam draf.
                                </p>
                            )}
                            <div className="divide-y rounded-lg border">
                                {draft.groups.map((group) => (
                                    <article
                                        key={group.id}
                                        className="space-y-4 p-4 sm:p-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold break-words">
                                                    {group.code ||
                                                        'Kode belum diisi'}
                                                </h3>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {group.row_ids.length} baris
                                                    ·{' '}
                                                    <span
                                                        className={
                                                            group.errors
                                                                .length &&
                                                            !group.order_id
                                                                ? 'text-destructive font-medium'
                                                                : 'font-medium'
                                                        }
                                                    >
                                                        {group.order_id
                                                            ? 'Tersimpan'
                                                            : group.errors
                                                                    .length
                                                              ? 'Perlu koreksi'
                                                              : 'Siap disimpan'}
                                                    </span>
                                                </p>
                                            </div>
                                            {group.order_id ? (
                                                <Link
                                                    className="text-sm font-medium underline underline-offset-4"
                                                    href={`/admin/orders/${group.order_id}`}
                                                >
                                                    Lihat pesanan
                                                </Link>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={
                                                        busy ||
                                                        expired ||
                                                        group.errors.length > 0
                                                    }
                                                    onClick={() =>
                                                        save(group.id)
                                                    }
                                                >
                                                    Simpan pesanan ini
                                                </Button>
                                            )}
                                        </div>
                                        <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                                            {[
                                                [
                                                    'Total buku',
                                                    rupiah(group.subtotal),
                                                ],
                                                [
                                                    'DP (informasi)',
                                                    rupiah(group.historical_dp),
                                                ],
                                                [
                                                    'Pembayaran historis',
                                                    rupiah(
                                                        group.historical_paid,
                                                    ),
                                                ],
                                                [
                                                    'Sisa buku',
                                                    rupiah(
                                                        group.outstanding_books,
                                                    ),
                                                ],
                                                [
                                                    'Berat gabungan',
                                                    `${group.weight.toLocaleString('id-ID')} gram`,
                                                ],
                                                ['Ongkir', 'Belum dipilih'],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="min-w-0"
                                                >
                                                    <dt className="text-muted-foreground">
                                                        {label}
                                                    </dt>
                                                    <dd className="mt-1 font-medium break-words">
                                                        {value}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {group.errors.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-muted-foreground text-sm">
                                                    Total sementara dapat belum
                                                    lengkap sampai semua baris
                                                    diperbaiki.
                                                </p>
                                                <ul
                                                    className="text-destructive list-inside list-disc space-y-1 text-sm"
                                                    role="alert"
                                                >
                                                    {group.errors.map(
                                                        (error, index) => (
                                                            <li key={index}>
                                                                {error}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                        {draft.results
                                            .filter(
                                                (result) =>
                                                    result.group_id ===
                                                    group.id,
                                            )
                                            .map((result, index) => (
                                                <p
                                                    key={index}
                                                    role="status"
                                                    className="text-sm"
                                                >
                                                    {result.status === 'saved'
                                                        ? 'Pesanan tersimpan.'
                                                        : result.errors.join(
                                                              ' ',
                                                          )}
                                                </p>
                                            ))}
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section
                            className="min-w-0 space-y-4"
                            aria-labelledby="rows-title"
                        >
                            <div>
                                <h2
                                    id="rows-title"
                                    className="text-lg font-semibold"
                                >
                                    Baris sumber
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Halaman {draft.page} dari {draft.pages},
                                    maksimal 25 baris per halaman. Geser tabel
                                    untuk melihat semua kolom. Buka detail untuk
                                    memeriksa validasi dan referensi.
                                </p>
                            </div>
                            {draft.rows.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Tidak ada baris pada halaman ini.
                                </p>
                            ) : (
                                <div
                                    role="region"
                                    aria-labelledby="rows-title"
                                    tabIndex={0}
                                    className="focus-visible:outline-ring relative max-h-[70vh] max-w-full overflow-auto rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <table className="w-full border-separate border-spacing-0 text-sm">
                                        <caption className="sr-only">
                                            Baris sumber Excel dan hasil
                                            pemeriksaan import
                                        </caption>
                                        <thead className="sticky top-0 z-20">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="bg-muted text-muted-foreground sticky left-0 z-30 min-w-14 border-r border-b px-3 py-2 text-center"
                                                >
                                                    Baris
                                                </th>
                                                {fields.map((field, index) => (
                                                    <th
                                                        key={field}
                                                        scope="col"
                                                        className="bg-muted min-w-40 border-r border-b px-3 py-2 text-left font-medium"
                                                    >
                                                        {headers[index]}
                                                    </th>
                                                ))}
                                                <th
                                                    scope="col"
                                                    className="bg-muted min-w-80 border-b px-3 py-2 text-left font-medium"
                                                >
                                                    Pemeriksaan dan aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {draft.rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="align-top"
                                                >
                                                    <th
                                                        scope="row"
                                                        className="bg-muted text-muted-foreground sticky left-0 z-10 border-r border-b px-3 py-3 text-center font-normal tabular-nums"
                                                    >
                                                        {row.number}
                                                    </th>
                                                    {fields.map((field) => (
                                                        <td
                                                            key={field}
                                                            className={`border-r border-b px-3 py-3 ${['quantity', 'unit_price', 'discount', 'historical_dp', 'historical_paid', 'line_total', 'weight'].includes(field) ? 'text-right tabular-nums' : ''} ${row.errors[field]?.length ? 'bg-destructive/10' : 'bg-background'}`}
                                                        >
                                                            <div
                                                                className={`${['title', 'address'].includes(field) ? 'w-64' : 'w-40'} break-words whitespace-pre-wrap`}
                                                            >
                                                                {row.data[
                                                                    field
                                                                ] || '—'}
                                                            </div>
                                                            {row.errors[field]
                                                                ?.length >
                                                                0 && (
                                                                <p className="text-destructive mt-2 text-xs">
                                                                    {row.errors[
                                                                        field
                                                                    ].join(' ')}
                                                                </p>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="bg-background border-b p-3">
                                                        <div className="space-y-2">
                                                            <p className="font-medium">
                                                                {row.order_id
                                                                    ? 'Tersimpan'
                                                                    : Object.keys(
                                                                            row.errors,
                                                                        ).length
                                                                      ? 'Perlu koreksi'
                                                                      : 'Lolos pemeriksaan baris'}
                                                            </p>
                                                            {!row.order_id && (
                                                                <Button
                                                                    id={`edit-row-${row.id}`}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        busy ||
                                                                        expired
                                                                    }
                                                                    onClick={() =>
                                                                        setEditing(
                                                                            row,
                                                                        )
                                                                    }
                                                                >
                                                                    Koreksi
                                                                    baris{' '}
                                                                    {row.number}
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <details className="mt-4 text-sm">
                                                            <summary className="cursor-pointer font-medium underline underline-offset-4">
                                                                Detail baris{' '}
                                                                {row.number}
                                                            </summary>
                                                            <div className="mt-4 space-y-4 border-t pt-4">
                                                                <div className="space-y-1">
                                                                    <h4 className="font-medium">
                                                                        Rencana
                                                                        referensi
                                                                    </h4>
                                                                    {[
                                                                        row.book,
                                                                        ...row.references,
                                                                    ]
                                                                        .filter(
                                                                            (
                                                                                reference,
                                                                            ): reference is Reference =>
                                                                                reference !==
                                                                                null,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                reference,
                                                                            ) => (
                                                                                <p
                                                                                    key={
                                                                                        reference.key
                                                                                    }
                                                                                    className="break-words"
                                                                                >
                                                                                    {
                                                                                        reference.input
                                                                                    }
                                                                                    :{' '}
                                                                                    {reference.action ===
                                                                                    'reuse'
                                                                                        ? 'Gunakan master existing'
                                                                                        : 'Buat master baru'}
                                                                                    {reference.error && (
                                                                                        <span className="text-destructive">
                                                                                            {' '}
                                                                                            ·{' '}
                                                                                            {
                                                                                                reference.error
                                                                                            }
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                            ),
                                                                        )}
                                                                    {row.totals && (
                                                                        <p>
                                                                            Total
                                                                            hasil
                                                                            hitung:{' '}
                                                                            {exactRupiahCents(
                                                                                row
                                                                                    .totals
                                                                                    .net,
                                                                            )}
                                                                            ;{' '}
                                                                            {row.totals.weight.toLocaleString(
                                                                                'id-ID',
                                                                            )}{' '}
                                                                            gram
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </details>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <nav
                                aria-label="Halaman baris import"
                                className="flex items-center justify-between gap-3"
                            >
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={busy || draft.page <= 1}
                                >
                                    <Link
                                        href={`${base}?page=${Math.max(1, draft.page - 1)}`}
                                        preserveScroll
                                        aria-disabled={busy || draft.page <= 1}
                                        onClick={(event) => {
                                            if (busy || draft.page <= 1)
                                                event.preventDefault();
                                        }}
                                    >
                                        Sebelumnya
                                    </Link>
                                </Button>
                                <span className="text-sm">
                                    {draft.page} / {draft.pages}
                                </span>
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={busy || draft.page >= draft.pages}
                                >
                                    <Link
                                        href={`${base}?page=${Math.min(draft.pages, draft.page + 1)}`}
                                        preserveScroll
                                        aria-disabled={
                                            busy || draft.page >= draft.pages
                                        }
                                        onClick={(event) => {
                                            if (
                                                busy ||
                                                draft.page >= draft.pages
                                            )
                                                event.preventDefault();
                                        }}
                                    >
                                        Berikutnya
                                    </Link>
                                </Button>
                            </nav>
                        </section>
                    </>
                )}
            </main>
            {editing && (
                <RowEditor
                    key={editing.id}
                    row={editing}
                    preOrderCodes={preOrderCodes}
                    categories={categories}
                    fields={fields}
                    headers={headers}
                    url={`${base}/rows/${editing.id}${query}`}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function RowEditor({
    row,
    preOrderCodes,
    categories,
    fields,
    headers,
    url,
    onClose,
}: {
    row: ImportRow;
    preOrderCodes: ReferenceOption[];
    categories: ReferenceOption[];
    fields: string[];
    headers: string[];
    url: string;
    onClose: () => void;
}) {
    const form = useForm({
        data: { ...row.data },
        decisions: { ...row.decisions },
    });
    const [activeTab, setActiveTab] = useState('Pesanan');
    const sections = [
        { title: 'Pesanan', fields: ['order_code', 'status'] },
        {
            title: 'Customer',
            fields: ['email', 'customer_name', 'postal_code', 'address'],
        },
        {
            title: 'Buku',
            fields: [
                'title',
                'pre_order_code',
                'categories',
                'eta',
                'weight',
                'quantity',
            ],
        },
        {
            title: 'Pembayaran',
            fields: [
                'unit_price',
                'discount',
                'historical_dp',
                'historical_paid',
                'line_total',
            ],
        },
    ];
    const known = sections.flatMap((section) => section.fields);
    const others = fields.filter((field) => !known.includes(field));
    const references = [row.book, ...row.references].filter(
        (reference): reference is Reference => reference !== null,
    );
    const tabs = [
        ...sections,
        ...(others.length ? [{ title: 'Lainnya', fields: others }] : []),
        ...(references.length ? [{ title: 'Referensi', fields: [] }] : []),
    ];
    const hasError = (tab: (typeof tabs)[number]) =>
        tab.title === 'Referensi'
            ? references.some((reference) =>
                  Boolean(
                      reference.error ||
                      row.errors[reference.key] ||
                      form.errors[
                          `decisions.${reference.key}` as keyof typeof form.errors
                      ],
                  ),
              )
            : tab.fields.some((field) =>
                  Boolean(
                      row.errors[field]?.length ||
                      form.errors[`data.${field}` as keyof typeof form.errors],
                  ),
              );
    const mappedErrors = new Set([
        ...fields,
        ...references.map((reference) => reference.key),
    ]);
    const otherErrors = Object.entries(row.errors).filter(
        ([key]) => !mappedErrors.has(key),
    );
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !form.processing) onClose();
            }}
        >
            <DialogContent
                className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    document.getElementById(`edit-row-${row.id}`)?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Koreksi baris {row.number}</DialogTitle>
                    <DialogDescription>
                        Semua kolom sumber dapat dikoreksi. Kelompok dan total
                        dihitung ulang; harga total Excel harus sesuai harga ×
                        qty − discount.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(url, {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                >
                    {Object.entries(form.errors).length > 0 && (
                        <div role="alert" className="text-destructive text-sm">
                            <p>Periksa kembali data yang dikirim:</p>
                            <ul className="list-inside list-disc">
                                {Object.entries(form.errors).map(
                                    ([field, error]) => (
                                        <li key={field}>{error}</li>
                                    ),
                                )}
                            </ul>
                        </div>
                    )}
                    {otherErrors.length > 0 && (
                        <div role="alert" className="text-destructive text-sm">
                            {otherErrors.map(([key, errors]) => (
                                <p key={key}>{errors.join(' ')}</p>
                            ))}
                        </div>
                    )}
                    <div
                        role="tablist"
                        aria-label="Bagian koreksi"
                        className="flex gap-1 overflow-x-auto border-b"
                    >
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.title}
                                type="button"
                                role="tab"
                                id={`tab-${tab.title}`}
                                aria-controls={`panel-${tab.title}`}
                                aria-selected={activeTab === tab.title}
                                tabIndex={activeTab === tab.title ? 0 : -1}
                                className="focus-visible:ring-ring shrink-0 border-b-2 border-transparent px-3 py-2 text-sm focus-visible:ring-2 aria-selected:border-current aria-selected:font-semibold"
                                onClick={() => setActiveTab(tab.title)}
                                onKeyDown={(event) => {
                                    let next = index;
                                    if (event.key === 'ArrowRight')
                                        next = (index + 1) % tabs.length;
                                    else if (event.key === 'ArrowLeft')
                                        next =
                                            (index + tabs.length - 1) %
                                            tabs.length;
                                    else if (event.key === 'Home') next = 0;
                                    else if (event.key === 'End')
                                        next = tabs.length - 1;
                                    else return;
                                    event.preventDefault();
                                    setActiveTab(tabs[next].title);
                                    document
                                        .getElementById(
                                            `tab-${tabs[next].title}`,
                                        )
                                        ?.focus();
                                }}
                            >
                                {tab.title}
                                {hasError(tab) && (
                                    <span className="text-destructive">
                                        {' '}
                                        (periksa)
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {tabs
                        .filter((tab) => tab.title !== 'Referensi')
                        .map((section) => {
                            const sectionFields = fields.filter((field) =>
                                section.fields.includes(field),
                            );
                            if (!sectionFields.length) return null;
                            return (
                                <fieldset
                                    key={section.title}
                                    role="tabpanel"
                                    id={`panel-${section.title}`}
                                    aria-labelledby={`tab-${section.title}`}
                                    hidden={activeTab !== section.title}
                                    className="space-y-3"
                                >
                                    <legend className="mb-3 w-full border-b pb-2 font-semibold">
                                        {section.title}
                                    </legend>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {sectionFields.map((field) => {
                                            const error =
                                                form.errors[
                                                    `data.${field}` as keyof typeof form.errors
                                                ] ||
                                                row.errors[field]?.join(' ');
                                            return (
                                                <div
                                                    key={field}
                                                    className="min-w-0 space-y-2"
                                                >
                                                    <Label
                                                        htmlFor={`source-${field}`}
                                                    >
                                                        {
                                                            headers[
                                                                fields.indexOf(
                                                                    field,
                                                                )
                                                            ]
                                                        }
                                                    </Label>
                                                    {field === 'status' ? (
                                                        <select
                                                            id={`source-${field}`}
                                                            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                                            value={
                                                                form.data.data
                                                                    .status
                                                            }
                                                            disabled={
                                                                form.processing
                                                            }
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            aria-describedby={
                                                                error
                                                                    ? `error-${field}`
                                                                    : undefined
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    'data',
                                                                    {
                                                                        ...form
                                                                            .data
                                                                            .data,
                                                                        status: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            {!importStatuses.includes(
                                                                form.data.data
                                                                    .status,
                                                            ) && (
                                                                <option
                                                                    value={
                                                                        form
                                                                            .data
                                                                            .data
                                                                            .status
                                                                    }
                                                                    disabled
                                                                >
                                                                    {form.data
                                                                        .data
                                                                        .status ||
                                                                        'Pilih status'}{' '}
                                                                    (tidak
                                                                    valid)
                                                                </option>
                                                            )}
                                                            {importStatuses.map(
                                                                (status) => (
                                                                    <option
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {status}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    ) : (
                                                        <Input
                                                            type={
                                                                field === 'eta'
                                                                    ? 'month'
                                                                    : 'text'
                                                            }
                                                            list={
                                                                field ===
                                                                'pre_order_code'
                                                                    ? 'import-po-options'
                                                                    : undefined
                                                            }
                                                            id={`source-${field}`}
                                                            value={
                                                                form.data.data[
                                                                    field
                                                                ] ?? ''
                                                            }
                                                            disabled={
                                                                form.processing
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    'data',
                                                                    {
                                                                        ...form
                                                                            .data
                                                                            .data,
                                                                        [field]:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            aria-describedby={
                                                                error
                                                                    ? `error-${field}`
                                                                    : undefined
                                                            }
                                                        />
                                                    )}
                                                    {field ===
                                                        'pre_order_code' && (
                                                        <datalist id="import-po-options">
                                                            {preOrderCodes.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.id
                                                                        }
                                                                        value={
                                                                            option.label
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </datalist>
                                                    )}
                                                    {field === 'categories' && (
                                                        <>
                                                            <p
                                                                id="category-help"
                                                                className="text-muted-foreground text-sm"
                                                            >
                                                                Ketik bebas,
                                                                pisahkan dengan
                                                                ; atau tambahkan
                                                                dari daftar.
                                                            </p>
                                                            <select
                                                                aria-label="Tambahkan kategori dari master"
                                                                aria-describedby="category-help"
                                                                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                                                disabled={
                                                                    form.processing
                                                                }
                                                                value=""
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    const selected =
                                                                        event
                                                                            .target
                                                                            .value;
                                                                    const current =
                                                                        (
                                                                            form
                                                                                .data
                                                                                .data
                                                                                .categories ??
                                                                            ''
                                                                        )
                                                                            .split(
                                                                                ';',
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    value,
                                                                                ) =>
                                                                                    value.trim(),
                                                                            )
                                                                            .filter(
                                                                                Boolean,
                                                                            );
                                                                    if (
                                                                        selected &&
                                                                        !current.some(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                value.toLowerCase() ===
                                                                                selected.toLowerCase(),
                                                                        )
                                                                    ) {
                                                                        form.setData(
                                                                            'data',
                                                                            {
                                                                                ...form
                                                                                    .data
                                                                                    .data,
                                                                                categories:
                                                                                    [
                                                                                        ...current,
                                                                                        selected,
                                                                                    ].join(
                                                                                        '; ',
                                                                                    ),
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">
                                                                    Tambahkan
                                                                    kategori…
                                                                </option>
                                                                {categories.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                option.id
                                                                            }
                                                                            value={
                                                                                option.label
                                                                            }
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </>
                                                    )}
                                                    {field === 'eta' &&
                                                        form.data.data.eta &&
                                                        !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(
                                                            form.data.data.eta,
                                                        ) && (
                                                            <p
                                                                className="text-destructive text-sm"
                                                                role="alert"
                                                            >
                                                                Nilai sumber
                                                                ETA:{' '}
                                                                {
                                                                    form.data
                                                                        .data
                                                                        .eta
                                                                }
                                                                . Pilih bulan
                                                                dan tahun yang
                                                                valid.
                                                            </p>
                                                        )}
                                                    {error && (
                                                        <p
                                                            id={`error-${field}`}
                                                            role="alert"
                                                            className="text-destructive text-sm"
                                                        >
                                                            {error}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            );
                        })}
                    {references.length > 0 && (
                        <fieldset
                            role="tabpanel"
                            id="panel-Referensi"
                            aria-labelledby="tab-Referensi"
                            hidden={activeTab !== 'Referensi'}
                            className="space-y-4"
                        >
                            <legend className="mb-3 w-full border-b pb-2 font-semibold">
                                Keputusan referensi
                            </legend>
                            {[row.book, ...row.references]
                                .filter(
                                    (reference): reference is Reference =>
                                        reference !== null,
                                )
                                .map((reference) => (
                                    <div
                                        key={reference.key}
                                        className="space-y-2"
                                    >
                                        <Label
                                            htmlFor={`decision-${reference.key}`}
                                        >
                                            Referensi: {reference.input}
                                        </Label>
                                        <select
                                            id={`decision-${reference.key}`}
                                            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            disabled={form.processing}
                                            value={
                                                form.data.decisions[
                                                    reference.key
                                                ] ?? ''
                                            }
                                            onChange={(event) =>
                                                form.setData('decisions', {
                                                    ...form.data.decisions,
                                                    [reference.key]:
                                                        event.target.value,
                                                })
                                            }
                                            aria-invalid={Boolean(
                                                reference.error,
                                            )}
                                            aria-describedby={
                                                reference.error
                                                    ? `decision-error-${reference.key}`
                                                    : undefined
                                            }
                                        >
                                            <option value="">
                                                Gunakan pemeriksaan otomatis
                                            </option>
                                            <option value="create">
                                                Konfirmasi buat baru jika nama
                                                belum ada
                                            </option>
                                            {reference.id && (
                                                <option
                                                    value={`use:${reference.id}`}
                                                >
                                                    Gunakan master cocok #
                                                    {reference.id}
                                                </option>
                                            )}
                                            {reference.suggestions
                                                .filter(
                                                    (option) =>
                                                        option.id !==
                                                        reference.id,
                                                )
                                                .map((option) => (
                                                    <option
                                                        key={option.id}
                                                        value={`use:${option.id}`}
                                                        disabled={
                                                            option.deleted
                                                        }
                                                    >
                                                        {option.label}
                                                        {option.deleted
                                                            ? ' (diarsipkan)'
                                                            : ''}
                                                    </option>
                                                ))}
                                        </select>
                                        {reference.error && (
                                            <p
                                                id={`decision-error-${reference.key}`}
                                                className="text-destructive text-sm"
                                            >
                                                {reference.error}
                                            </p>
                                        )}
                                    </div>
                                ))}
                        </fieldset>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button disabled={form.processing}>
                            {form.processing
                                ? 'Memeriksa…'
                                : 'Simpan koreksi dan periksa ulang'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
