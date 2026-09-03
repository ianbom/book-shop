import { ArrowRight } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';

export function HeroSection() {
    return (
        <section className="relative isolate min-h-[430px] overflow-hidden bg-[#071426] sm:min-h-[500px] lg:min-h-[560px]">
            <img
                src="/images/customer/home/hero.jpg"
                alt="Pembaca menikmati buku di perpustakaan"
                className="absolute inset-0 -z-20 size-full object-cover object-[64%_center]"
                fetchPriority="high"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,13,27,.95)_0%,rgba(3,13,27,.72)_40%,rgba(3,13,27,.12)_76%,rgba(3,13,27,.3)_100%)]" />
            <SectionContainer className="flex min-h-[430px] items-center py-16 sm:min-h-[500px] lg:min-h-[560px]">
                <div className="max-w-xl text-white">
                    <h1 className="font-serif text-5xl leading-[.98] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                        Temukan
                        <br />
                        Buku Favoritmu
                    </h1>
                    <p className="mt-6 max-w-md text-base leading-7 text-slate-100 sm:text-lg">
                        Ribuan buku inspiratif menanti untuk menemani setiap
                        langkah perjalananmu.
                    </p>
                    <a
                        href="/books"
                        className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        Lihat Semua Buku <ArrowRight size={17} />
                    </a>
                </div>
            </SectionContainer>
        </section>
    );
}
