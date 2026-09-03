import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { OrderSummary } from '@/components/customer/track-order/order-summary';
import { StatusTimeline } from '@/components/customer/track-order/status-timeline';
import { SectionContainer } from '@/components/customer/shared/section-container';
import { Button } from '@/components/ui/button';
import type { CustomerTrackedOrder } from '@/types/customer';

interface Props {
    order: CustomerTrackedOrder | null;
    error?: string | null;
}

export default function TrackOrderShow({ order, error }: Props) {
    if (!order) {
        return (
            <>
                <Head title="Order Tidak Ditemukan" />
                <SectionContainer className="flex min-h-[calc(100vh-72px)] items-center py-20 sm:py-28">
                    <div className="border-destructive max-w-xl border-l-2 pl-5">
                        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                            Lacak Order
                        </p>
                        <h1 className="font-heading text-foreground mt-3 text-4xl font-semibold">
                            Pesanan tidak ditemukan
                        </h1>
                        <p className="text-muted-foreground mt-4 leading-7">
                            {error ??
                                'Periksa kembali kode order yang kamu masukkan.'}
                        </p>
                        <Button asChild variant="outline" className="mt-8">
                            <Link href="/track-order">
                                <ArrowLeft /> Coba Kode Lain
                            </Link>
                        </Button>
                    </div>
                </SectionContainer>
            </>
        );
    }

    return (
        <>
            <Head title={'Order ' + order.order_code} />
            <SectionContainer className="min-h-[calc(100vh-72px)] py-12 sm:py-16">
                <div className="border-border flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link
                            href="/track-order"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
                        >
                            <ArrowLeft className="size-4" /> Lacak order lain
                        </Link>
                        <p className="text-muted-foreground mt-7 text-xs font-semibold tracking-[0.18em] uppercase">
                            Detail Pelacakan
                        </p>
                        <h1 className="font-heading text-foreground mt-2 text-4xl font-semibold">
                            Order {order.order_code}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Informasi terbaru pesananmu tersedia di halaman ini.
                        </p>
                    </div>
                    {order.whatsapp_url && (
                        <Button asChild>
                            <a
                                href={order.whatsapp_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <MessageCircle /> Hubungi Admin via WhatsApp
                            </a>
                        </Button>
                    )}
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <OrderSummary order={order} />
                    <StatusTimeline order={order} />
                </div>
            </SectionContainer>
        </>
    );
}
