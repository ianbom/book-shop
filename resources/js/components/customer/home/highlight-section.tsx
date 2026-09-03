import { ArrowRight, Bookmark, Sparkles, ThumbsUp } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';

const highlights = [
    {
        title: 'Koleksi Pilihan',
        description:
            'Pilihan terbaik dari berbagai genre yang paling dicintai pembaca.',
        image: '/images/customer/home/highlight-library.jpg',
        icon: Bookmark,
    },
    {
        title: 'Bacaan Terkurasi',
        description:
            'Bacaan berkualitas yang dikurasi oleh tim Buku Order untukmu.',
        image: '/images/customer/home/highlight-reading.jpg',
        icon: Sparkles,
    },
    {
        title: 'Rekomendasi Terbaik',
        description: 'Rekomendasi buku sesuai minat dan kebiasaan bacamu.',
        image: '/images/customer/home/highlight-books.jpg',
        icon: ThumbsUp,
    },
];

export function HighlightSection() {
    return (
        <SectionContainer className="-mt-1 grid gap-5 py-6 md:grid-cols-3 lg:py-8">
            {highlights.map(({ title, description, image, icon: Icon }) => (
                <article
                    key={title}
                    className="relative min-h-[260px] overflow-hidden rounded-md border border-slate-200 bg-[#071426] shadow-sm"
                >
                    <img
                        src={image}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-x-3 bottom-3 flex gap-3 rounded-md bg-white/95 p-4 backdrop-blur-sm">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0B1F3A] text-white">
                            <Icon size={18} />
                        </span>
                        <div>
                            <h2 className="font-semibold">{title}</h2>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                {description}
                            </p>
                            <a
                                href="#koleksi"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F3A] hover:text-[#2563EB]"
                            >
                                Lihat Koleksi <ArrowRight size={13} />
                            </a>
                        </div>
                    </div>
                </article>
            ))}
        </SectionContainer>
    );
}
