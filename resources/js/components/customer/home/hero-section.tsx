import { ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { SectionContainer } from '@/components/customer/shared/section-container';

export function HeroSection() {
    return (
        <section className="bg-background relative isolate min-h-[calc(100svh-74px)] overflow-hidden lg:min-h-[calc(100svh-86px)]">
            <img
                src="/hero.png"
                alt="Koleksi buku Wonderbook"
                className="absolute inset-0 -z-20 size-full object-cover object-[64%_center]"
                fetchPriority="high"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,.98)_0%,rgba(255,255,255,.9)_34%,rgba(255,255,255,.36)_62%,rgba(255,255,255,0)_82%)]" />
            <SectionContainer className="flex min-h-[calc(100svh-74px)] items-center py-16 lg:min-h-[calc(100svh-86px)]">
                <div className="text-foreground max-w-xl">
                    <p className="text-primary mb-3 text-xs font-bold tracking-[0.24em] uppercase">
                        Wonderbook
                    </p>
                    <h1 className="font-heading text-5xl leading-[.98] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                        Temukan
                        <br />
                        Buku Favoritmu
                        <br />
                        di Wonderbook
                    </h1>
                    <p className="text-muted-foreground mt-6 max-w-md text-base leading-7 sm:text-lg">
                        Ribuan buku inspiratif, dari kisah yang menghibur
                        hingga ilmu yang mengubah hidup. Mulai petualangan
                        membacamu hari ini.
                    </p>
                    <Link
                        href="/books"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-foreground mt-8 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        Lihat Semua Buku <ArrowRight size={17} />
                    </Link>
                </div>
            </SectionContainer>
        </section>
    );
}
