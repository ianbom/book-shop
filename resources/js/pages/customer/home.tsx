import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    ArrowRight,
    Baby,
    BookOpen,
    BriefcaseBusiness,
    Globe2,
    Headphones,
    Laptop,
    Leaf,
    ShieldCheck,
    ShoppingBag,
    Star,
    Truck,
    Undo2,
} from 'lucide-react';
import { BookDetailDialog } from '@/components/customer/books/book-detail-dialog';
import { BookOrderDialog } from '@/components/customer/books/book-order-dialog';
import { SectionContainer } from '@/components/customer/shared/section-container';
import { Button } from '@/components/ui/button';
import { rupiah } from '@/lib/format';
import type {
    CustomerBook,
    CustomerCategory,
    CustomerStoreSettings,
} from '@/types';

interface HomeProps {
    categories: CustomerCategory[];
    featuredBooks: CustomerBook[];
    latestBooks: CustomerBook[];
    storeSettings: CustomerStoreSettings;
}

const categoryIcons = [
    Leaf,
    BookOpen,
    BriefcaseBusiness,
    Globe2,
    Laptop,
    Star,
    Baby,
];

const benefits = [
    {
        title: '100% Original',
        description: 'Buku Original & Resmi',
        icon: ShieldCheck,
    },
    {
        title: 'Pengiriman Cepat',
        description: 'Ke Seluruh Indonesia',
        icon: Truck,
    },
    {
        title: '14 Hari Pengembalian',
        description: 'Mudah & Tanpa Ribet',
        icon: Undo2,
    },
    {
        title: 'Layanan Pelanggan',
        description: 'Senin - Minggu 08.00 - 21.00',
        icon: Headphones,
    },
];

export default function Home({
    categories,
    featuredBooks,
    latestBooks,
    storeSettings,
}: HomeProps) {
    const [detailBookId, setDetailBookId] = useState<number | null>(null);
    const [orderBookId, setOrderBookId] = useState<number | null>(null);
    const books = featuredBooks.slice(0, 8);
    const categoryList = categories.slice(0, 8);

    const selectedDetailBook = useMemo(
        () => featuredBooks.find((book) => book.id === detailBookId) ?? null,
        [featuredBooks, detailBookId],
    );
    const selectedOrderBook = useMemo(
        () => featuredBooks.find((book) => book.id === orderBookId) ?? null,
        [featuredBooks, orderBookId],
    );

    return (
        <>
            <Head title={'Home'} />
            <section className="bg-background border-b border-border min-h-[calc(100svh-74px)] lg:min-h-[calc(100svh-86px)] flex flex-col justify-center overflow-hidden">
                <SectionContainer className="grid items-center gap-8 py-8 sm:py-12 lg:grid-cols-[1fr_1.2fr] lg:py-12 xl:gap-12 w-full">
                    <div className="max-w-[460px]">
                        <p className="text-primary mb-3 text-xs font-bold tracking-[0.24em] uppercase">
                            Wonderbook
                        </p>
                        <h1 className="font-heading text-foreground text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.08] tracking-tight">
                            Temukan
                            <br />
                            Buku Favoritmu
                            <br />
                            di Wonderbook
                        </h1>
                        <p className="text-muted-foreground mt-5 text-sm sm:text-base leading-relaxed">
                            Ribuan buku inspiratif, dari kisah yang menghibur
                            hingga ilmu yang mengubah hidup. Mulai petualangan
                            membacamu hari ini.
                        </p>
                        <Link
                            href="/books"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-7 inline-flex h-11 items-center gap-2.5 rounded-lg px-6 text-sm font-semibold shadow-xs transition"
                        >
                            Lihat Semua Buku <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    <div className="relative flex items-center justify-center lg:justify-end">
                        <img
                            src="/hero.png"
                            alt="Koleksi Buku di Wonderbook"
                            className="w-full max-w-[620px] lg:max-w-none h-auto object-contain select-none"
                            loading="eager"
                        />
                    </div>
                </SectionContainer>
            </section>

            <SectionContainer className="grid gap-4 py-5 md:grid-cols-3 lg:py-6">
                <PromoCard
                    title="Buku Terbaru"
                    description="Jelajahi rilis buku paling baru dan menarik."
                    image="/images/customer/home/highlight-library.jpg"
                    href="#koleksi"
                />
                <PromoCard
                    title="Pre Order Sekarang"
                    description="Dapatkan buku impianmu sebelum rilis resmi."
                    image="/images/customer/home/highlight-reading.jpg"
                    href="#koleksi"
                    badge="PRE ORDER"
                />
                <PromoCard
                    title="Buku Terlaris"
                    description="Pilihan favorit pembaca di seluruh Indonesia."
                    image="/images/customer/home/highlight-books.jpg"
                    href="#koleksi"
                />
            </SectionContainer>

            <section
                id="promo"
                className="bg-secondary/45 scroll-mt-32 border-y"
            >
                <SectionContainer className="grid min-h-[175px] items-center gap-6 py-6 lg:grid-cols-[1fr_1fr_1fr]">
                    <img
                        src="/images/customer/home/editorial.jpg"
                        alt="Buku terbuka"
                        className="hidden h-36 w-full object-cover lg:block"
                        loading="lazy"
                    />
                    <div className="text-center">
                        <p className="text-[10px] font-semibold tracking-[.2em] uppercase">
                            Khusus Hari Ini
                        </p>
                        <h2 className="font-heading mt-1 text-4xl font-semibold">
                            Diskon 20%
                        </h2>
                        <p className="text-muted-foreground mt-1 text-xs">
                            untuk Koleksi Buku Pilihan
                        </p>
                        <Link
                            href="/books"
                            className="border-foreground hover:bg-foreground hover:text-primary-foreground mt-4 inline-flex h-9 items-center gap-2 border px-4 text-xs font-bold transition"
                        >
                            Belanja Sekarang <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                    <div className="hidden items-end justify-center gap-[-1px] lg:flex">
                        {(latestBooks.length
                            ? latestBooks.slice(0, 4)
                            : books.slice(0, 4)
                        ).map((book, index) => (
                            <div
                                key={book.id}
                                className={`border-border bg-card w-28 border p-2 shadow-sm ${index % 2 ? '-rotate-2' : 'rotate-2'}`}
                            >
                                <div className="bg-muted aspect-[.68] overflow-hidden">
                                    {book.primary_image ? (
                                        <img
                                            src={book.primary_image.url}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <BookOpen className="m-auto mt-8 size-7" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionContainer>
            </section>

            <section id="koleksi" className="scroll-mt-32 py-10 lg:py-14">
                <SectionContainer>
                    <div className="flex items-end justify-between border-b pb-3">
                        <h2 className="font-heading text-3xl font-semibold">
                            Buku Pilihan Minggu Ini
                        </h2>
                        <Link
                            href="/books"
                            className="hover:text-primary hidden items-center gap-1 text-xs font-semibold sm:flex"
                        >
                            Lihat Semua <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                        {books.map((book) => (
                            <HomeBookCard
                                key={book.id}
                                book={book}
                                onView={(selected) =>
                                    setDetailBookId(selected.id)
                                }
                                onBuy={(selected) =>
                                    setOrderBookId(selected.id)
                                }
                            />
                        ))}
                    </div>
                    {!books.length && (
                        <p className="text-muted-foreground py-12 text-center text-sm">
                            Belum ada buku pilihan.
                        </p>
                    )}
                </SectionContainer>
            </section>
            <BookDetailDialog
                book={selectedDetailBook}
                onClose={() => setDetailBookId(null)}
                onBuy={(book) => setOrderBookId(book.id)}
            />
            <BookOrderDialog
                book={selectedOrderBook}
                onClose={() => setOrderBookId(null)}
            />
        </>
    );
}

function PromoCard({
    title,
    description,
    image,
    href,
    badge,
}: {
    title: string;
    description: string;
    image: string;
    href: string;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className="border-border group bg-card hover:border-primary relative min-h-[185px] overflow-hidden border p-5 transition"
        >
            <img
                src={image}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-25 transition duration-500 group-hover:scale-105"
                loading="lazy"
            />
            <div className="relative max-w-[175px]">
                <h2 className="font-heading text-2xl leading-none font-semibold">
                    {title}
                </h2>
                <p className="text-muted-foreground mt-4 text-xs leading-5">
                    {description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold">
                    Lihat Koleksi <ArrowRight className="size-3.5" />
                </span>
            </div>
            {badge && (
                <span className="bg-card absolute top-4 right-4 grid size-14 place-items-center rounded-full border text-center text-[9px] leading-3 font-bold">
                    {badge}
                </span>
            )}
        </Link>
    );
}

function HomeBookCard({
    book,
    onView,
    onBuy,
}: {
    book: CustomerBook;
    onView: (book: CustomerBook) => void;
    onBuy: (book: CustomerBook) => void;
}) {
    return (
        <article className="border-border group bg-card hover:border-primary flex min-w-0 flex-col border p-2.5 transition hover:-translate-y-1 hover:shadow-md sm:p-3">
            <button
                type="button"
                onClick={() => onView(book)}
                className="bg-muted flex aspect-[.72] w-full items-center justify-center overflow-hidden"
                aria-label={`Lihat detail ${book.title}`}
            >
                {book.primary_image ? (
                    <img
                        src={book.primary_image.url}
                        alt={`Cover ${book.title}`}
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <BookOpen className="text-muted-foreground size-8" />
                )}
            </button>
            <div className="flex flex-1 flex-col pt-3">
                <button
                    type="button"
                    onClick={() => onView(book)}
                    className="font-heading hover:text-primary line-clamp-2 min-h-10 text-left text-base leading-5 font-semibold transition-colors"
                >
                    {book.title}
                </button>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px]">
                    {book.author}
                </p>
                <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">
                        {rupiah(book.price)}
                    </p>
                    <span
                        className={`text-[10px] font-medium ${book.stock > 0 ? 'text-success' : 'text-destructive'}`}
                    >
                        {book.stock > 0 ? `Stok ${book.stock}` : 'Habis'}
                    </span>
                </div>
                <div className="mt-3 pt-1">
                    <Button
                        size="sm"
                        disabled={book.stock <= 0}
                        onClick={() => onBuy(book)}
                        className="h-8 w-full rounded-none text-xs font-medium"
                    >
                        <ShoppingBag className="size-3.5" /> Beli Buku
                    </Button>
                </div>
            </div>
        </article>
    );
}
