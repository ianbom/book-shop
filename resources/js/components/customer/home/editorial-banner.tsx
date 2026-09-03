import { ArrowRight } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';

export function EditorialBanner() {
    return (
        <SectionContainer id="tentang" className="scroll-mt-20">
            <section className="grid overflow-hidden bg-[#071426] md:grid-cols-2">
                <img
                    src="/images/customer/home/editorial.jpg"
                    alt="Buku terbuka di atas meja"
                    className="h-64 w-full object-cover md:h-full"
                    loading="lazy"
                />
                <div className="flex min-h-64 flex-col justify-center px-7 py-10 text-white sm:px-10 lg:px-14">
                    <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
                        Selamat Datang di Dunia Buku
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
                        Buku adalah jendela menuju pengetahuan, inspirasi, dan
                        perubahan. Di Buku Order, kami hadir untuk membawakan
                        bacaan terbaik yang akan menemani setiap langkah
                        perjalananmu.
                    </p>
                    <a
                        href="#tentang"
                        className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-100"
                    >
                        Lihat Selengkapnya <ArrowRight size={16} />
                    </a>
                </div>
            </section>
        </SectionContainer>
    );
}
