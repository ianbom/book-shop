import { Head } from '@inertiajs/react';
import { SearchCheck } from 'lucide-react';
import { TrackOrderForm } from '@/components/customer/track-order/track-order-form';
import { SectionContainer } from '@/components/customer/shared/section-container';

export default function TrackOrderIndex() {
    return (
        <>
            <Head title="Lacak Order" />
            <section className="border-border bg-secondary/40 flex min-h-[calc(100vh-72px)] items-center border-b">
                <SectionContainer className="py-16 sm:py-24">
                    <div className="max-w-2xl">
                        <SearchCheck
                            className="text-foreground size-8"
                            aria-hidden="true"
                        />
                        <p className="text-muted-foreground mt-6 text-xs font-semibold tracking-[0.2em] uppercase">
                            Wonder Book
                        </p>
                        <h1 className="font-heading text-foreground mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
                            Lacak Pesananmu
                        </h1>
                        <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7">
                            Masukkan kode order untuk melihat perjalanan
                            pesanan, pembayaran, dan informasi buku yang kamu
                            pesan.
                        </p>
                        <div className="mt-10 max-w-xl">
                            <TrackOrderForm />
                        </div>
                    </div>
                </SectionContainer>
            </section>
        </>
    );
}
