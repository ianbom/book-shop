import { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    ChevronRight,
    History,
    House,
    RotateCcw,
    SlidersHorizontal,
} from 'lucide-react';
import { Pagination } from '@/components/admin/shared/pagination';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated, StockMovement } from '@/types/admin';

type BookOption = { id: number; title: string };
export default function InventoryHistory({
    movements,
    books,
    filters,
}: {
    movements: Paginated<StockMovement>;
    books: BookOption[];
    filters: Record<
        'book' | 'type' | 'date_from' | 'date_to',
        string | undefined
    >;
}) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.inventory.history(),
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };
    return (
        <>
            <Head title="Riwayat Stok" />
            <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-4 py-5 md:px-7 md:py-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <nav
                        className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
                        aria-label="Breadcrumb"
                    >
                        <Link
                            href={admin.dashboard()}
                            className="hover:text-primary inline-flex items-center gap-1.5"
                        >
                            <House className="size-3.5" /> Dashboard
                        </Link>
                        <ChevronRight className="size-3.5" />
                        <Link
                            href={admin.inventory.index()}
                            className="hover:text-primary"
                        >
                            Manajemen Stok
                        </Link>
                        <ChevronRight className="size-3.5" />
                        <span className="text-foreground font-semibold">
                            Riwayat Stok
                        </span>
                    </nav>
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-white"
                    >
                        <Link href={admin.inventory.index()}>
                            <ArrowLeft /> Manajemen Stok
                        </Link>
                    </Button>
                </div>
                <section className="bg-muted/60 relative overflow-hidden rounded-2xl border border-white/80 px-5 py-6 sm:px-7 sm:py-7">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl shadow-sm">
                                <History className="size-6" />
                            </span>
                            <div>
                                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                                    Manajemen Toko
                                </p>
                                <h1 className="font-heading text-foreground text-4xl leading-none font-bold sm:text-5xl">
                                    Riwayat Stok
                                </h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
                            Audit semua perubahan stok buku.
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
                            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] xl:items-end"
                        >
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <BookOpen className="text-primary size-4" />{' '}
                                    Buku
                                </span>
                                <select
                                    name="book"
                                    defaultValue={filters.book ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua buku</option>
                                    {books.map((book) => (
                                        <option key={book.id} value={book.id}>
                                            {book.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <History className="text-primary size-4" />{' '}
                                    Tipe Pergerakan
                                </span>
                                <select
                                    name="type"
                                    defaultValue={filters.type ?? ''}
                                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 rounded-md border px-3 text-sm outline-none focus:ring-4"
                                >
                                    <option value="">Semua tipe</option>
                                    <option value="initial">Stok Awal</option>
                                    <option value="adjustment_in">
                                        Stok Masuk
                                    </option>
                                    <option value="adjustment_out">
                                        Stok Keluar
                                    </option>
                                    <option value="order">Order</option>
                                    <option value="cancellation">
                                        Pembatalan
                                    </option>
                                </select>
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Tanggal Mulai
                                </span>
                                <Input
                                    type="date"
                                    name="date_from"
                                    defaultValue={filters.date_from}
                                    className="bg-background h-10"
                                />
                            </label>
                            <label className="text-foreground grid gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="text-primary size-4" />{' '}
                                    Tanggal Akhir
                                </span>
                                <Input
                                    type="date"
                                    name="date_to"
                                    defaultValue={filters.date_to}
                                    className="bg-background h-10"
                                />
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    router.get(admin.inventory.history())
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
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-muted/85 text-muted-foreground border-b text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-4">Tanggal</th>
                                        <th className="px-4 py-4">Buku</th>
                                        <th className="px-4 py-4">Tipe</th>
                                        <th className="px-4 py-4">Jumlah</th>
                                        <th className="px-4 py-4">Sebelum</th>
                                        <th className="px-4 py-4">Sesudah</th>
                                        <th className="px-4 py-4">Order</th>
                                        <th className="px-4 py-4">Admin</th>
                                        <th className="px-4 py-4">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border/80 divide-y bg-white">
                                    {movements.data.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className="hover:bg-muted/45 transition-colors"
                                        >
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {formatDate(
                                                    movement.created_at,
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium">
                                                {movement.book?.title ?? '-'}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge
                                                    value={movement.type}
                                                />
                                            </td>
                                            <td
                                                className={`px-4 py-3.5 font-semibold ${movement.quantity >= 0 ? 'text-success' : 'text-destructive'}`}
                                            >
                                                {movement.quantity > 0
                                                    ? '+'
                                                    : ''}
                                                {movement.quantity}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {movement.stock_before}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {movement.stock_after}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {movement.order ? (
                                                    <Link
                                                        className="text-primary"
                                                        href={admin.orders.show(
                                                            movement.order.id,
                                                        )}
                                                    >
                                                        {
                                                            movement.order
                                                                .order_code
                                                        }
                                                    </Link>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {movement.changed_by?.name ??
                                                    '-'}
                                            </td>
                                            <td className="text-muted-foreground max-w-64 px-4 py-3.5">
                                                {movement.note ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {movements.data.length === 0 && (
                            <p className="text-muted-foreground p-10 text-center text-sm">
                                Riwayat stok tidak ditemukan.
                            </p>
                        )}
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {movements.meta.from ?? 0}–
                                    {movements.meta.to ?? 0} dari{' '}
                                    {movements.meta.total} pergerakan
                                </p>
                                <Pagination links={movements.meta.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

InventoryHistory.layout = {
    breadcrumbs: [
        { title: 'Manajemen Stok', href: admin.inventory.index() },
        { title: 'Riwayat Stok', href: admin.inventory.history() },
    ],
};
