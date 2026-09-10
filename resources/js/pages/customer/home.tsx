import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { BookDetailDialog } from '@/components/customer/books/book-detail-dialog';
import { BookOrderDialog } from '@/components/customer/books/book-order-dialog';
import { HeroSection } from '@/components/customer/home/hero-section';
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

export default function Home({ featuredBooks, latestBooks }: HomeProps) {
    const [detailBookId, setDetailBookId] = useState<number | null>(null);
    const [orderBookId, setOrderBookId] = useState<number | null>(null);
    const [isMarqueeCardHovered, setIsMarqueeCardHovered] = useState(false);
    const [isMarqueeCardFocused, setIsMarqueeCardFocused] = useState(false);
    const books = featuredBooks.slice(0, 8);
    const latestCollection = latestBooks.slice(0, 8);

    const selectedDetailBook = useMemo(
        () =>
            featuredBooks.find((book) => book.id === detailBookId) ??
            latestBooks.find((book) => book.id === detailBookId) ??
            null,
        [featuredBooks, latestBooks, detailBookId],
    );
    const selectedOrderBook = useMemo(
        () =>
            featuredBooks.find((book) => book.id === orderBookId) ??
            latestBooks.find((book) => book.id === orderBookId) ??
            null,
        [featuredBooks, latestBooks, orderBookId],
    );
    const isMarqueePaused =
        isMarqueeCardHovered ||
        isMarqueeCardFocused ||
        selectedDetailBook !== null ||
        selectedOrderBook !== null;

    return (
        <>
            <Head title={'Home'} />
            <HeroSection />

            {latestCollection.length > 0 && (
                <section className="overflow-hidden py-10 lg:py-14">
                    <SectionContainer>
                        <div className="flex items-end justify-between border-b pb-3">
                            <h2 className="font-heading text-3xl font-semibold">
                                Koleksi Pilihan
                            </h2>
                            <Link
                                href="/books"
                                className="hover:text-primary hidden items-center gap-1 text-xs font-semibold sm:flex"
                            >
                                Lihat Semua <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </SectionContainer>
                    <div className="book-marquee-viewport group mt-5 overflow-hidden">
                        <div
                            className="book-marquee-track flex w-max gap-4 pr-4"
                            style={{
                                animationPlayState: isMarqueePaused
                                    ? 'paused'
                                    : 'running',
                            }}
                        >
                            <MarqueeBooks
                                books={latestCollection}
                                onView={(book) => setDetailBookId(book.id)}
                                onHoverChange={setIsMarqueeCardHovered}
                                onFocusChange={setIsMarqueeCardFocused}
                            />
                            <div
                                aria-hidden="true"
                                inert
                                className="flex gap-4"
                            >
                                <MarqueeBooks
                                    books={latestCollection}
                                    onView={() => undefined}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

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

function MarqueeBooks({
    books,
    onView,
    onHoverChange,
    onFocusChange,
}: {
    books: CustomerBook[];
    onView: (book: CustomerBook) => void;
    onHoverChange?: (hovered: boolean) => void;
    onFocusChange?: (focused: boolean) => void;
}) {
    return (
        <div className="flex gap-4">
            {books.map((book) => (
                <div
                    key={book.id}
                    className="w-40 shrink-0 sm:w-48 lg:w-52"
                    onMouseEnter={() => onHoverChange?.(true)}
                    onMouseLeave={() => onHoverChange?.(false)}
                    onFocus={() => onFocusChange?.(true)}
                    onBlur={(event) => {
                        if (
                            !event.currentTarget.contains(event.relatedTarget)
                        ) {
                            onFocusChange?.(false);
                        }
                    }}
                >
                    <HomeBookCard book={book} onView={onView} />
                </div>
            ))}
        </div>
    );
}

function HomeBookCard({
    book,
    onView,
}: {
    book: CustomerBook;
    onView: (book: CustomerBook) => void;
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
                    <p className="text-foreground text-xs font-bold">
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
                        onClick={() => onView(book)}
                        className="h-8 w-full rounded-none text-xs font-medium"
                    >
                        <BookOpen className="size-3.5" /> Lihat Buku
                    </Button>
                </div>
            </div>
        </article>
    );
}
