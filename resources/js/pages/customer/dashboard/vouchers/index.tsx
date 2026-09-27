import { Head, Link, router } from '@inertiajs/react';
import { Search, TicketPercent } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminListLayout } from '@/components/admin/shared/admin-list-layout';
import { Pagination } from '@/components/admin/shared/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, rupiah } from '@/lib/format';
import type {
    CustomerDashboardPage,
    CustomerVoucher,
} from '@/types/customer-dashboard';

const url = '/customer/dashboard/vouchers';

export default function VouchersIndex({
    vouchers,
    filters,
}: {
    vouchers: CustomerDashboardPage<CustomerVoucher>;
    filters: { search?: string };
}) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            url,
            Object.fromEntries(new FormData(event.currentTarget).entries()),
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Voucher Saya" />
            <AdminListLayout
                title="Voucher"
                description="Temukan potongan harga yang masih tersedia untuk pesanan Anda."
                icon={TicketPercent}
                dashboardHref="/customer/dashboard/orders"
                eyebrow="Akun Saya"
            >
                <Card className="border-border/90 shadow-sm">
                    <CardContent className="py-3 sm:py-1">
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <label className="text-foreground grid flex-1 gap-2 text-xs font-bold">
                                <span className="flex items-center gap-2">
                                    <Search className="text-primary size-4" />{' '}
                                    Cari Voucher
                                </span>
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Kode atau nama voucher"
                                    className="bg-background h-10"
                                />
                            </label>
                            <Button type="submit" className="h-10">
                                <Search /> Cari
                            </Button>
                            <Button
                                asChild
                                type="button"
                                variant="outline"
                                className="h-10"
                            >
                                <Link href={url}>Reset</Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="border-border/90 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="border-b bg-white px-4 py-4 sm:px-5">
                            <h2 className="font-heading text-foreground text-xl font-bold">
                                Voucher Tersedia
                            </h2>
                            <p className="text-muted-foreground text-xs">
                                Perhatikan minimum belanja sebelum menggunakan
                                kode.
                            </p>
                        </div>
                        {vouchers.data.length > 0 ? (
                            <div className="grid gap-4 bg-white p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
                                {vouchers.data.map((voucher) => (
                                    <Card
                                        key={voucher.id}
                                        className="border-border/90 overflow-hidden py-0 shadow-sm"
                                    >
                                        <CardContent className="flex h-full flex-col p-0">
                                            <div className="bg-muted/60 flex items-center justify-between gap-3 border-b px-5 py-4">
                                                <span className="text-primary text-xs font-bold tracking-widest uppercase">
                                                    Wonder Book
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-success/10 text-success"
                                                >
                                                    Tersedia
                                                </Badge>
                                            </div>
                                            <div className="flex flex-1 flex-col gap-3 px-5 py-5">
                                                <div>
                                                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
                                                        Potongan Belanja
                                                    </p>
                                                    <p className="font-heading text-foreground mt-1 text-3xl font-bold">
                                                        {voucher.type ===
                                                        'fixed'
                                                            ? rupiah(
                                                                  voucher.value,
                                                              )
                                                            : `${Number(voucher.value).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h3 className="text-foreground font-bold">
                                                        {voucher.name}
                                                    </h3>
                                                    {voucher.description && (
                                                        <p className="text-muted-foreground mt-1 text-sm leading-6">
                                                            {
                                                                voucher.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground mt-auto space-y-1 pt-3 text-xs">
                                                    <p>
                                                        Minimum belanja{' '}
                                                        {rupiah(
                                                            voucher.min_order_amount,
                                                        )}
                                                    </p>
                                                    {voucher.max_discount && (
                                                        <p>
                                                            Maksimum diskon{' '}
                                                            {rupiah(
                                                                voucher.max_discount,
                                                            )}
                                                        </p>
                                                    )}
                                                    <p>
                                                        {voucher.ends_at
                                                            ? `Berlaku sampai ${formatDate(voucher.ends_at)}`
                                                            : 'Tanpa batas tanggal'}
                                                    </p>
                                                    <p>
                                                        Dapat digunakan{' '}
                                                        {voucher.remaining_uses}{' '}
                                                        kali lagi
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="border-t bg-white px-5 py-3">
                                                <p className="text-muted-foreground text-xs">
                                                    Kode voucher
                                                </p>
                                                <p className="text-primary font-mono text-base font-bold tracking-wider select-all">
                                                    {voucher.code}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground bg-white p-10 text-center text-sm">
                                Voucher yang dapat digunakan belum tersedia.
                            </p>
                        )}
                        <div className="border-t bg-white px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Menampilkan {vouchers.from ?? 0}–
                                    {vouchers.to ?? 0} dari {vouchers.total}{' '}
                                    voucher
                                </p>
                                <Pagination links={vouchers.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminListLayout>
        </>
    );
}

VouchersIndex.layout = { breadcrumbs: [{ title: 'Voucher', href: url }] };
