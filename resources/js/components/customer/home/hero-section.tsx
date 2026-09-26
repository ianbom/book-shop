import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    ShieldCheck,
    Sparkles,
    Truck,
} from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';

const benefits = [
    { icon: BookOpen, title: 'Buku Pilihan', detail: 'untuk Semua Usia' },
    { icon: ShieldCheck, title: '100% Original', detail: 'Garansi Keaslian' },
    { icon: Truck, title: 'Pengiriman Aman', detail: 'ke Seluruh Indonesia' },
];

export function HeroSection() {
    return (
        <section className="bg-secondary/35 relative isolate overflow-hidden">
            <div className="pointer-events-none absolute -top-24 right-[-3rem] -z-10 size-96 rounded-full bg-background/80 blur-3xl" />
            <SectionContainer className="grid min-h-[480px] items-center gap-2 py-8 md:grid-cols-[0.94fr_1.06fr] md:py-7 lg:min-h-[500px] lg:gap-0">
                <div className="relative z-10 py-5 md:py-8">
                    <p className="text-primary mb-3 text-[10px] font-extrabold tracking-[0.28em] uppercase sm:text-xs">WonderBookLibrary</p>
                    <h1 className="font-heading text-foreground max-w-2xl text-[2.8rem] leading-[0.98] font-bold tracking-tight sm:text-6xl lg:text-[4.25rem]">
                        Buka Buku,
                        <br />
                        Temukan Dunia Baru
                    </h1>
                    <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-6 sm:text-base">
                        Temukan buku-buku pilihan yang seru dan penuh inspirasi untuk menemani rasa ingin tahu, imajinasi, dan perjalanan membaca setiap hari.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/books" className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-lg px-5 text-xs font-bold shadow-sm transition">
                            Jelajahi Buku <ArrowRight className="size-4" />
                        </Link>
                        <a href="#koleksi" className="border-primary/35 bg-background text-primary hover:bg-secondary inline-flex h-11 items-center justify-center rounded-lg border px-5 text-xs font-bold transition">Lihat Koleksi</a>
                    </div>
                    <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 border-t border-primary/15 pt-5 sm:gap-4">
                        {benefits.map(({ icon: Icon, title, detail }) => (
                            <div key={title} className="flex items-center gap-2">
                                <span className="text-primary grid size-8 shrink-0 place-items-center rounded-md bg-background sm:size-9"><Icon className="size-4 sm:size-[18px]" /></span>
                                <span className="min-w-0"><span className="text-foreground block text-[9px] leading-4 font-bold sm:text-[10px]">{title}</span><span className="text-muted-foreground block text-[8px] leading-3 sm:text-[9px]">{detail}</span></span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative mx-auto flex min-h-[250px] w-full max-w-[650px] items-center justify-center md:min-h-[390px]">
                    <div className="absolute inset-6 rounded-[48%] bg-background/70 blur-2xl" />
                    <img src="/dashboard-image/pesanan.png" alt="Anak-anak membaca buku bersama" className="relative z-10 max-h-[320px] w-full object-contain sm:max-h-[390px] lg:max-h-[440px]" fetchPriority="high" />
                    <span aria-hidden="true" className="font-handwritten text-primary absolute top-5 right-2 z-20 hidden rotate-[-8deg] text-3xl leading-none md:block">Good books,<br />brighter days</span>
                    <Sparkles aria-hidden="true" className="text-warning absolute top-8 left-[12%] size-6" />
                    <Sparkles aria-hidden="true" className="text-warning absolute right-[14%] bottom-12 size-5" />
                </div>
            </SectionContainer>
        </section>
    );
}
