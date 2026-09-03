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
            'Bacaan berkualitas yang dikurasi oleh tim Wonder Book untukmu.',
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
                    className="border-border bg-foreground relative min-h-[260px] overflow-hidden rounded-md border shadow-sm"
                >
                    <img
                        src={image}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                    />
                    <div className="bg-card/95 absolute inset-x-3 bottom-3 flex gap-3 rounded-md p-4 backdrop-blur-sm">
                        <span className="bg-foreground text-primary-foreground grid size-10 shrink-0 place-items-center rounded-full">
                            <Icon size={18} />
                        </span>
                        <div>
                            <h2 className="font-semibold">{title}</h2>
                            <p className="text-muted-foreground mt-1 text-xs leading-5">
                                {description}
                            </p>
                            <a
                                href="#koleksi"
                                className="text-foreground hover:text-primary mt-2 inline-flex items-center gap-1 text-xs font-semibold"
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
