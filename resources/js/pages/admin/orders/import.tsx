import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileSpreadsheet,
    Info,
    MoveHorizontal,
} from 'lucide-react';
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
import '../../../../css/order-import.css';

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
const columnWidths: Record<string, string> = {
    order_code: 'w-20',
    email: 'w-46',
    customer_name: 'w-24',
    title: 'w-56',
    pre_order_code: 'w-18',
    categories: 'w-24',
    address: 'w-64',
};

// ponytail: eight group colors repeat; expand the palette for more separation.
const groupColors = [
    '#eff6ff',
    '#f0fdf4',
    '#faf5ff',
    '#fefce8',
    '#fdf2f8',
    '#ecfeff',
    '#fff7ed',
    '#f1f5f9',
];

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
    const [modal, setModal] = useState<
        | { kind: 'finance'; group: Group }
        | { kind: 'detail'; row: ImportRow }
        | null
    >(null);
    const modalTrigger = useRef<HTMLButtonElement | null>(null);
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
    const totalRows =
        draft?.groups.reduce(
            (total, group) => total + group.row_ids.length,
            0,
        ) ?? 0;
    const label = (field: string) => headers[fields.indexOf(field)] ?? field;
    const groupBackgrounds = new Map(
        (draft?.groups ?? []).map((group, index) => [
            group.id,
            groupColors[index % groupColors.length],
        ]),
    );
    const save = (id: string | null) => {
        commit.transform(() => ({ group_id: id }));
        commit.post(`${base}/commit${query}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Import pesanan lawas" />
            <main className="order-import-page flex w-full min-w-0 flex-col gap-6 p-4 md:px-8 md:py-6">
                <header className="space-y-3">
                    <nav
                        aria-label="Breadcrumb"
                        className="text-muted-foreground flex items-center gap-2 text-xs"
                    >
                        <Link
                            href="/admin/orders"
                            className="hover:text-primary"
                        >
                            Pesanan
                        </Link>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                        <span aria-current="page">Import pesanan</span>
                    </nav>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                            <h1 className="text-[28px] leading-9 font-semibold tracking-tight">
                                Import pesanan lawas
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {draft
                                    ? 'Periksa data, koreksi baris yang bermasalah, lalu simpan pesanan yang siap.'
                                    : 'Unggah Excel untuk memeriksa pesanan sebelum disimpan.'}
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/admin/orders">Kembali ke pesanan</Link>
                        </Button>
                    </div>
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
                            className="bg-card space-y-3 rounded-xl border p-4 sm:p-6"
                            aria-labelledby="draft-title"
                        >
                            <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-wrap">
                                <div className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                                    <FileSpreadsheet
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2
                                        id="draft-title"
                                        className="text-base font-medium break-words"
                                    >
                                        {draft.name}
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        Draf berlaku sampai{' '}
                                        {new Date(
                                            draft.expires_at * 1000,
                                        ).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <span className="col-start-2 inline-flex items-center gap-2 justify-self-start rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                    <Clock3
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    {expired
                                        ? 'Draf kedaluwarsa'
                                        : 'Draf sementara'}
                                </span>
                                <Button
                                    variant="outline"
                                    className="col-start-2 justify-self-start"
                                    asChild
                                >
                                    <Link href="/admin/orders/import">
                                        Unggah file lain
                                    </Link>
                                </Button>
                            </div>
                            <p className="text-muted-foreground text-xs leading-5">
                                Draf bukan arsip permanen. Simpan sebelum
                                kedaluwarsa; kelompok yang sudah tersimpan tidak
                                dapat diubah.
                            </p>
                            {expired && (
                                <p
                                    role="alert"
                                    className="bg-destructive/5 text-destructive rounded-md p-3 text-sm"
                                >
                                    Draf kedaluwarsa. Unggah ulang Excel.
                                </p>
                            )}
                            {draft.warnings.length > 0 && (
                                <div
                                    role="status"
                                    className="flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800"
                                >
                                    <Info
                                        className="mt-0.5 size-3.5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        {draft.warnings.map(
                                            (warning, index) => (
                                                <span key={index}>
                                                    {index > 0 ? ' · ' : ''}
                                                    {warning}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        <section
                            className="space-y-4"
                            aria-labelledby="groups-title"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2
                                        id="groups-title"
                                        className="text-lg font-semibold"
                                    >
                                        Kelompok pesanan
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {draft.groups.length} kelompok ·{' '}
                                        {totalRows} baris sumber · {valid} siap
                                        disimpan
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
                            <p className="sr-only">
                                Penyimpanan sekaligus mencakup semua kelompok
                                yang siap, termasuk di halaman lain.
                            </p>
                            {commit.errors.group_id && (
                                <p
                                    role="alert"
                                    className="text-destructive text-sm"
                                >
                                    {commit.errors.group_id}
                                </p>
                            )}
                            {draft.groups.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    Tidak ada kelompok pesanan dalam draf.
                                </p>
                            )}
                            {draft.groups.map((group) => {
                                const invalidRows = draft.rows.filter(
                                    (row) =>
                                        row.group_id === group.id &&
                                        Object.keys(row.errors).length > 0,
                                );
                                const firstInvalid = invalidRows[0];
                                return (
                                    <article
                                        key={group.id}
                                        className="bg-card space-y-4 rounded-xl border p-4 sm:p-6"
                                    >
                                        <div className="grid grid-cols-1 gap-4 border-b pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-base font-semibold break-words">
                                                        {group.code ||
                                                            'Kode belum diisi'}
                                                    </h3>
                                                    <ImportStatus
                                                        saved={Boolean(
                                                            group.order_id,
                                                        )}
                                                        invalid={
                                                            group.errors
                                                                .length > 0
                                                        }
                                                    />
                                                </div>
                                                <p className="text-muted-foreground mt-2 text-xs">
                                                    {group.row_ids.length} baris
                                                    ·{' '}
                                                    {group.order_id
                                                        ? 'Sudah disimpan'
                                                        : 'Belum disimpan'}
                                                </p>
                                            </div>
                                            <div className="sm:text-right">
                                                <p className="text-muted-foreground text-xs">
                                                    Total buku
                                                </p>
                                                <p className="mt-1 text-lg font-semibold tabular-nums">
                                                    {rupiah(group.subtotal)}
                                                </p>
                                            </div>
                                            {group.order_id ? (
                                                <Button
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/orders/${group.order_id}`}
                                                    >
                                                        Lihat pesanan
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
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
                                        {!group.order_id &&
                                            group.errors.length > 0 && (
                                                <div
                                                    role="status"
                                                    className="bg-destructive/5 flex flex-wrap items-center gap-3 rounded-md p-4"
                                                >
                                                    <AlertTriangle
                                                        className="text-destructive size-5 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <div className="text-destructive min-w-0 flex-1">
                                                        <p className="text-sm font-medium">
                                                            {firstInvalid
                                                                ? `${Object.keys(firstInvalid.errors).length} hal perlu diperbaiki pada baris ${firstInvalid.number}`
                                                                : 'Kelompok pesanan perlu diperiksa'}
                                                        </p>
                                                        <p className="mt-1 text-xs leading-5">
                                                            {firstInvalid
                                                                ? Object.keys(
                                                                      firstInvalid.errors,
                                                                  )
                                                                      .map(
                                                                          label,
                                                                      )
                                                                      .join(
                                                                          ', ',
                                                                      ) + '.'
                                                                : group.errors.join(
                                                                      ' ',
                                                                  )}
                                                        </p>
                                                        {firstInvalid &&
                                                            group.errors
                                                                .filter(
                                                                    (error) =>
                                                                        error !==
                                                                        'Perbaiki kesalahan baris dalam kelompok.',
                                                                )
                                                                .map(
                                                                    (error) => (
                                                                        <p
                                                                            key={
                                                                                error
                                                                            }
                                                                            className="mt-1 text-xs"
                                                                        >
                                                                            {
                                                                                error
                                                                            }
                                                                        </p>
                                                                    ),
                                                                )}
                                                        {invalidRows.length >
                                                            1 && (
                                                            <p className="mt-1 text-xs">
                                                                {
                                                                    invalidRows.length
                                                                }{' '}
                                                                baris bermasalah
                                                                pada halaman
                                                                ini. Periksa
                                                                seluruh baris
                                                                sumber.
                                                            </p>
                                                        )}
                                                    </div>
                                                    {firstInvalid && (
                                                        <Button
                                                            disabled={
                                                                busy || expired
                                                            }
                                                            onClick={() =>
                                                                setEditing(
                                                                    firstInvalid,
                                                                )
                                                            }
                                                        >
                                                            Koreksi baris{' '}
                                                            {
                                                                firstInvalid.number
                                                            }
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-muted-foreground text-xs">
                                                {group.errors.length > 0
                                                    ? 'Total sementara dapat belum lengkap sampai semua baris diperbaiki.'
                                                    : 'Rincian mengikuti data pesanan yang telah diperiksa.'}
                                            </p>
                                            <button
                                                type="button"
                                                className="text-primary inline-flex items-center gap-2 rounded py-1 text-xs font-medium hover:underline"
                                                onClick={(event) => {
                                                    modalTrigger.current =
                                                        event.currentTarget;
                                                    setModal({
                                                        kind: 'finance',
                                                        group,
                                                    });
                                                }}
                                            >
                                                Rincian keuangan &amp; berat
                                                <ChevronRight
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
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
                                                    className={`text-sm ${result.status === 'saved' ? 'text-green-800' : 'text-destructive'}`}
                                                >
                                                    {result.status === 'saved'
                                                        ? 'Pesanan tersimpan.'
                                                        : result.errors.join(
                                                              ' ',
                                                          )}
                                                </p>
                                            ))}
                                    </article>
                                );
                            })}
                        </section>

                        <section
                            className="bg-card min-w-0 overflow-hidden rounded-xl border"
                            aria-labelledby="rows-title"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 sm:py-5">
                                <div>
                                    <h2
                                        id="rows-title"
                                        className="text-lg font-semibold"
                                    >
                                        Baris sumber
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {totalRows} baris dari Excel · Maksimal
                                        25 baris per halaman
                                    </p>
                                </div>
                                <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                    Geser untuk kolom lainnya
                                    <MoveHorizontal
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </p>
                            </div>
                            {draft.rows.length === 0 ? (
                                <p className="text-muted-foreground px-6 pb-6 text-sm">
                                    Tidak ada baris pada halaman ini.
                                </p>
                            ) : (
                                <div
                                    role="region"
                                    aria-labelledby="rows-title"
                                    tabIndex={0}
                                    className="relative max-h-[70vh] max-w-full overflow-auto"
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
                                                    className="bg-muted text-muted-foreground sticky left-0 z-30 min-w-16 border-r border-b px-4 py-3 text-left text-xs font-medium"
                                                >
                                                    Baris
                                                </th>
                                                {fields.map((field, index) => (
                                                    <th
                                                        key={field}
                                                        scope="col"
                                                        className="bg-muted text-muted-foreground border-r border-b px-4 py-3 text-left text-xs font-medium"
                                                    >
                                                        {headers[index]}
                                                    </th>
                                                ))}
                                                <th
                                                    scope="col"
                                                    className="bg-muted text-muted-foreground sticky right-0 z-30 w-56 min-w-56 border-b border-l px-4 py-3 text-left text-xs font-medium"
                                                >
                                                    Pemeriksaan &amp; aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {draft.rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="align-top [&>td]:bg-inherit [&>th]:bg-inherit"
                                                    style={{
                                                        backgroundColor:
                                                            groupBackgrounds.get(
                                                                row.group_id,
                                                            ),
                                                    }}
                                                >
                                                    <th
                                                        scope="row"
                                                        className="sticky left-0 z-10 border-r border-b px-4 py-4 text-left font-normal tabular-nums"
                                                    >
                                                        {row.number}
                                                    </th>
                                                    {fields.map((field) => (
                                                        <td
                                                            key={field}
                                                            className={`border-r border-b px-4 py-4 ${['quantity', 'unit_price', 'discount', 'historical_dp', 'historical_paid', 'line_total', 'weight'].includes(field) ? 'text-right tabular-nums' : ''} ${row.errors[field]?.length ? 'ring-destructive/50 ring-1 ring-inset' : ''}`}
                                                        >
                                                            <div
                                                                className={`${columnWidths[field] ?? 'w-32'} break-words whitespace-pre-wrap`}
                                                            >
                                                                {row.data[
                                                                    field
                                                                ] || (
                                                                    <span className="text-muted-foreground">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {row.errors[field]
                                                                ?.length >
                                                                0 && (
                                                                <p className="text-destructive mt-1 max-w-52 text-xs leading-5">
                                                                    {row.errors[
                                                                        field
                                                                    ].join(' ')}
                                                                </p>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="sticky right-0 z-10 border-b border-l p-4">
                                                        <div className="space-y-2">
                                                            <ImportStatus
                                                                saved={Boolean(
                                                                    row.order_id,
                                                                )}
                                                                invalid={
                                                                    Object.keys(
                                                                        row.errors,
                                                                    ).length > 0
                                                                }
                                                                row
                                                            />
                                                            <div className="flex items-center gap-3">
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
                                                                        aria-label={`Koreksi baris ${row.number}`}
                                                                    >
                                                                        Koreksi
                                                                    </Button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Detail baris ${row.number}`}
                                                                    className="text-primary rounded px-1 py-2 text-xs hover:underline"
                                                                    onClick={(
                                                                        event,
                                                                    ) => {
                                                                        modalTrigger.current =
                                                                            event.currentTarget;
                                                                        setModal(
                                                                            {
                                                                                kind: 'detail',
                                                                                row,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    Detail
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <nav
                                aria-label="Halaman baris import"
                                className="flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:px-6"
                            >
                                <span className="text-muted-foreground text-xs">
                                    {totalRows > 0
                                        ? `Menampilkan ${(draft.page - 1) * 25 + 1}–${Math.min(draft.page * 25, totalRows)} dari ${totalRows} baris`
                                        : 'Tidak ada baris'}
                                </span>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        asChild
                                        disabled={busy || draft.page <= 1}
                                    >
                                        <Link
                                            href={`${base}?page=${Math.max(1, draft.page - 1)}`}
                                            preserveScroll
                                            aria-disabled={
                                                busy || draft.page <= 1
                                            }
                                            onClick={(event) => {
                                                if (busy || draft.page <= 1)
                                                    event.preventDefault();
                                            }}
                                        >
                                            Sebelumnya
                                        </Link>
                                    </Button>
                                    <span className="text-muted-foreground text-sm tabular-nums">
                                        {draft.page} / {draft.pages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        asChild
                                        disabled={
                                            busy || draft.page >= draft.pages
                                        }
                                    >
                                        <Link
                                            href={`${base}?page=${Math.min(draft.pages, draft.page + 1)}`}
                                            preserveScroll
                                            aria-disabled={
                                                busy ||
                                                draft.page >= draft.pages
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
                                </div>
                            </nav>
                        </section>
                        <p className="text-muted-foreground text-xs leading-5">
                            Buka Detail untuk memeriksa validasi dan rencana
                            referensi. Koreksi baris sebelum menyimpan pesanan.
                        </p>
                    </>
                )}
            </main>
            <Dialog
                open={modal !== null}
                onOpenChange={(open) => {
                    if (!open) setModal(null);
                }}
            >
                <DialogContent
                    className={`order-import-dialog max-h-[90dvh] gap-0 overflow-y-auto rounded-xl p-0 ${modal?.kind === 'detail' ? 'sm:max-w-[640px]' : 'sm:max-w-[560px]'}`}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        if (!editing) modalTrigger.current?.focus();
                    }}
                >
                    <DialogHeader className="border-b p-6 pr-12 text-left">
                        <DialogTitle>
                            {modal?.kind === 'finance'
                                ? 'Rincian keuangan & berat'
                                : `Detail baris ${modal?.row.number ?? ''}`}
                        </DialogTitle>
                        <DialogDescription>
                            {modal?.kind === 'finance'
                                ? `Pesanan ${modal.group.code}`
                                : `Order ${modal?.row.data.order_code ?? ''}`}
                        </DialogDescription>
                    </DialogHeader>
                    {modal?.kind === 'finance' && (
                        <div className="space-y-5 p-6">
                            <dl className="divide-y">
                                {[
                                    [
                                        'DP (informasi)',
                                        rupiah(modal.group.historical_dp),
                                    ],
                                    [
                                        'Pembayaran historis',
                                        rupiah(modal.group.historical_paid),
                                    ],
                                    [
                                        'Sisa buku',
                                        rupiah(modal.group.outstanding_books),
                                    ],
                                    [
                                        'Berat gabungan',
                                        `${modal.group.weight.toLocaleString('id-ID')} gram`,
                                    ],
                                    ['Ongkir', 'Belum dipilih'],
                                ].map(([name, value]) => (
                                    <div
                                        key={name}
                                        className="flex flex-wrap justify-between gap-2 py-3 first:pt-0"
                                    >
                                        <dt className="text-muted-foreground">
                                            {name}
                                        </dt>
                                        <dd className="font-medium tabular-nums">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="text-muted-foreground text-xs">
                                Nilai sementara mengikuti pemeriksaan baris
                                sumber.
                            </p>
                        </div>
                    )}
                    {modal?.kind === 'detail' && (
                        <div className="space-y-5 p-6">
                            <ImportStatus
                                saved={Boolean(modal.row.order_id)}
                                invalid={
                                    Object.keys(modal.row.errors).length > 0
                                }
                                row
                            />
                            <div>
                                <h3 className="mb-3 text-sm font-semibold">
                                    Rencana referensi
                                </h3>
                                <dl className="divide-y">
                                    {[modal.row.book, ...modal.row.references]
                                        .filter(
                                            (
                                                reference,
                                            ): reference is Reference =>
                                                reference !== null,
                                        )
                                        .map((reference) => (
                                            <div
                                                key={reference.key}
                                                className="flex flex-wrap justify-between gap-2 py-3"
                                            >
                                                <dt className="min-w-0 break-words">
                                                    {reference.field ===
                                                    'categories'
                                                        ? 'Kategori buku'
                                                        : reference.field ===
                                                            'pre_order_code'
                                                          ? 'Kode PO'
                                                          : 'Buku'}{' '}
                                                    · {reference.input}
                                                </dt>
                                                <dd className="text-muted-foreground text-xs">
                                                    {reference.action ===
                                                    'reuse'
                                                        ? 'Gunakan master existing'
                                                        : 'Buat master baru'}
                                                </dd>
                                                {reference.error && (
                                                    <p className="text-destructive w-full text-xs">
                                                        {reference.error}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                </dl>
                            </div>
                            {modal.row.totals && (
                                <p className="bg-secondary rounded-md p-3 text-sm">
                                    Total hasil hitung:{' '}
                                    {exactRupiahCents(modal.row.totals.net)} ·{' '}
                                    {modal.row.totals.weight.toLocaleString(
                                        'id-ID',
                                    )}{' '}
                                    gram
                                </p>
                            )}
                            {Object.keys(modal.row.errors).length > 0 && (
                                <div className="bg-destructive/5 text-destructive rounded-md p-4">
                                    <h3 className="text-sm font-semibold">
                                        Kolom yang perlu diperbaiki
                                    </h3>
                                    <ul className="mt-2 space-y-2 text-xs">
                                        {Object.entries(modal.row.errors).map(
                                            ([field, errors]) => (
                                                <li key={field}>
                                                    <strong className="font-medium">
                                                        {label(field)}
                                                    </strong>{' '}
                                                    · {errors.join(' ')}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="border-t p-6">
                        <Button
                            variant="outline"
                            onClick={() => setModal(null)}
                        >
                            Tutup
                        </Button>
                        {modal?.kind === 'detail' && !modal.row.order_id && (
                            <Button
                                disabled={busy || expired}
                                onClick={() => {
                                    setEditing(modal.row);
                                    setModal(null);
                                }}
                            >
                                Koreksi baris {modal.row.number}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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

function ImportStatus({
    saved,
    invalid,
    row = false,
}: {
    saved: boolean;
    invalid: boolean;
    row?: boolean;
}) {
    const Icon = saved || !invalid ? CheckCircle2 : AlertTriangle;
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-medium whitespace-nowrap ${saved || !invalid ? 'bg-green-50 text-green-800' : 'bg-destructive/5 text-destructive'}`}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {saved
                ? 'Tersimpan'
                : invalid
                  ? 'Perlu koreksi'
                  : row
                    ? 'Lolos pemeriksaan baris'
                    : 'Siap disimpan'}
        </span>
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
        { title: 'Pesanan', fields: ['order_code', 'status', 'eta'] },
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
                className="order-import-dialog flex h-[min(720px,90dvh)] max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[880px]"
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    document.getElementById(`edit-row-${row.id}`)?.focus();
                }}
            >
                <DialogHeader className="shrink-0 border-b p-6 pr-12 text-left">
                    <DialogTitle>Koreksi baris {row.number}</DialogTitle>
                    <DialogDescription>
                        Semua kolom sumber dapat dikoreksi. Kelompok dan total
                        dihitung ulang; harga total Excel harus sesuai harga ×
                        qty − discount.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(url, {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                >
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                        {Object.keys(row.errors).length > 0 && (
                            <div className="bg-destructive/5 text-destructive rounded-lg p-4">
                                <p className="text-sm font-semibold">
                                    {Object.keys(row.errors).length} kolom perlu
                                    diperiksa
                                </p>
                                <p className="mt-1 text-xs">
                                    Perbaiki nilai yang ditandai. Koreksi akan
                                    diperiksa ulang sebelum pesanan dapat
                                    disimpan.
                                </p>
                            </div>
                        )}
                        {Object.entries(form.errors).length > 0 && (
                            <div
                                role="alert"
                                className="text-destructive text-sm"
                            >
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
                            <div
                                role="alert"
                                className="text-destructive text-sm"
                            >
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
                                    className="focus-visible:ring-ring text-muted-foreground aria-selected:border-primary aria-selected:text-primary shrink-0 border-b-2 border-transparent px-4 py-3 text-sm focus-visible:ring-2 aria-selected:font-semibold"
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
                                        <span className="bg-destructive/5 text-destructive ml-2 rounded px-1.5 py-0.5 text-xs">
                                            {tab.title === 'Referensi'
                                                ? references.filter(
                                                      (reference) =>
                                                          reference.error ||
                                                          row.errors[
                                                              reference.key
                                                          ] ||
                                                          form.errors[
                                                              `decisions.${reference.key}` as keyof typeof form.errors
                                                          ],
                                                  ).length
                                                : tab.fields.filter(
                                                      (field) =>
                                                          row.errors[field]
                                                              ?.length ||
                                                          form.errors[
                                                              `data.${field}` as keyof typeof form.errors
                                                          ],
                                                  ).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {tabs
                            .filter((tab) => tab.title !== 'Referensi')
                            .map((section) => {
                                const sectionFields = section.fields.filter(
                                    (field) => fields.includes(field),
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
                                        <legend className="sr-only">
                                            {section.title}
                                        </legend>
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            {sectionFields.map((field) => {
                                                const error =
                                                    form.errors[
                                                        `data.${field}` as keyof typeof form.errors
                                                    ] ||
                                                    row.errors[field]?.join(
                                                        ' ',
                                                    );
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
                                                                className="border-input bg-card h-10 w-full rounded-lg border px-3 text-sm"
                                                                value={
                                                                    form.data
                                                                        .data
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
                                                                onChange={(
                                                                    event,
                                                                ) =>
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
                                                                    form.data
                                                                        .data
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
                                                                        {form
                                                                            .data
                                                                            .data
                                                                            .status ||
                                                                            'Pilih status'}{' '}
                                                                        (tidak
                                                                        valid)
                                                                    </option>
                                                                )}
                                                                {importStatuses.map(
                                                                    (
                                                                        status,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                status
                                                                            }
                                                                            value={
                                                                                status
                                                                            }
                                                                        >
                                                                            {
                                                                                status
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        ) : (
                                                            <Input
                                                                type={
                                                                    field ===
                                                                    'eta'
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
                                                                    form.data
                                                                        .data[
                                                                        field
                                                                    ] ?? ''
                                                                }
                                                                disabled={
                                                                    form.processing
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
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
                                                                        />
                                                                    ),
                                                                )}
                                                            </datalist>
                                                        )}
                                                        {field ===
                                                            'categories' && (
                                                            <>
                                                                <p
                                                                    id="category-help"
                                                                    className="text-muted-foreground text-sm"
                                                                >
                                                                    Ketik bebas,
                                                                    pisahkan
                                                                    dengan ;
                                                                    atau
                                                                    tambahkan
                                                                    dari daftar.
                                                                </p>
                                                                <select
                                                                    aria-label="Tambahkan kategori dari master"
                                                                    aria-describedby="category-help"
                                                                    className="border-input bg-card h-10 w-full rounded-lg border px-3 text-sm"
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
                                                            form.data.data
                                                                .eta &&
                                                            !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(
                                                                form.data.data
                                                                    .eta,
                                                            ) && (
                                                                <p
                                                                    className="text-destructive text-sm"
                                                                    role="alert"
                                                                >
                                                                    Nilai sumber
                                                                    ETA:{' '}
                                                                    {
                                                                        form
                                                                            .data
                                                                            .data
                                                                            .eta
                                                                    }
                                                                    . Pilih
                                                                    bulan dan
                                                                    tahun yang
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
                                <legend className="sr-only">
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
                                                    Konfirmasi buat baru jika
                                                    nama belum ada
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
                    </div>
                    <DialogFooter className="shrink-0 border-t p-6">
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
                                : 'Simpan perubahan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
