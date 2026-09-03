import { ArrowRight } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';

export function EditorialBanner() {
    return (
        <SectionContainer id="tentang" className="scroll-mt-20">
            <section className="bg-foreground grid overflow-hidden md:grid-cols-2">
                <img
                    src="/images/customer/home/editorial.jpg"
                    alt="Buku terbuka di atas meja"
                    className="h-64 w-full object-cover md:h-full"
                    loading="lazy"
                />
                <div className="text-primary-foreground flex min-h-64 flex-col justify-center px-7 py-10 sm:px-10 lg:px-14">
                    <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
                        Selamat Datang di Dunia Buku
                    </h2>
                    <p className="text-primary-foreground/80 mt-4 max-w-md text-sm leading-6">
                        Buku adalah jendela menuju pengetahuan, inspirasi, dan
                        perubahan. Di Wonder Book, kami hadir untuk membawakan
                        bacaan terbaik yang akan menemani setiap langkah
                        perjalananmu.
                    </p>
                    <a
                        href="#tentang"
                        className="bg-card text-foreground hover:bg-secondary mt-6 inline-flex w-fit items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
                    >
                        Lihat Selengkapnya <ArrowRight size={16} />
                    </a>
                </div>
            </section>
        </SectionContainer>
    );
}
