import { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
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
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Riwayat Stok"
                    description="Audit semua perubahan stok buku."
                    actions={
                        <Button asChild variant="outline">
                            <Link href={admin.inventory.index()}>
                                <ArrowLeft className="mr-2 size-4" />
                                Manajemen Stok
                            </Link>
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="p-4">
                        <form
                            onSubmit={submit}
                            className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
                        >
                            <select
                                name="book"
                                defaultValue={filters.book ?? ''}
                                className="bg-background h-10 rounded-md border px-3 text-sm"
                            >
                                <option value="">Semua buku</option>
                                {books.map((book) => (
                                    <option key={book.id} value={book.id}>
                                        {book.title}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="type"
                                defaultValue={filters.type ?? ''}
                                className="bg-background h-10 rounded-md border px-3 text-sm"
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
                                <option value="cancellation">Pembatalan</option>
                            </select>
                            <Input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from}
                                aria-label="Tanggal mulai"
                            />
                            <Input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to}
                                aria-label="Tanggal akhir"
                            />
                            <Button type="submit" variant="outline">
                                Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="text-muted-foreground border-b bg-slate-50 text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Tanggal</th>
                                        <th className="px-5 py-3">Buku</th>
                                        <th className="px-5 py-3">Tipe</th>
                                        <th className="px-5 py-3">Jumlah</th>
                                        <th className="px-5 py-3">Sebelum</th>
                                        <th className="px-5 py-3">Sesudah</th>
                                        <th className="px-5 py-3">Order</th>
                                        <th className="px-5 py-3">Admin</th>
                                        <th className="px-5 py-3">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {movements.data.map((movement) => (
                                        <tr key={movement.id}>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {formatDate(
                                                    movement.created_at,
                                                )}
                                            </td>
                                            <td className="px-5 py-4 font-medium">
                                                {movement.book?.title ?? '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    value={movement.type}
                                                />
                                            </td>
                                            <td
                                                className={`px-5 py-4 font-semibold ${movement.quantity >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                                            >
                                                {movement.quantity > 0
                                                    ? '+'
                                                    : ''}
                                                {movement.quantity}
                                            </td>
                                            <td className="px-5 py-4">
                                                {movement.stock_before}
                                            </td>
                                            <td className="px-5 py-4">
                                                {movement.stock_after}
                                            </td>
                                            <td className="px-5 py-4">
                                                {movement.order ? (
                                                    <Link
                                                        className="text-[#2563EB]"
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
                                            <td className="px-5 py-4">
                                                {movement.changed_by?.name ??
                                                    '-'}
                                            </td>
                                            <td className="text-muted-foreground max-w-64 px-5 py-4">
                                                {movement.note ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t p-4">
                            <Pagination links={movements.meta.links} />
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
