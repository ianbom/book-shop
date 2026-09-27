import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { BookCard } from '@/components/customer/books/book-card';
import { BookDetailDialog } from '@/components/customer/books/book-detail-dialog';
import { BookFilters } from '@/components/customer/books/book-filters';
import { CatalogPagination } from '@/components/customer/books/catalog-pagination';
import { EmptyState } from '@/components/customer/shared/empty-state';
import { SectionContainer } from '@/components/customer/shared/section-container';
import { useDebounce } from '@/hooks/use-debounce';
import type {
    CatalogFilters,
    CustomerBook,
    CustomerCategory,
    PaginatedData,
} from '@/types';

interface CatalogPageProps {
    books: PaginatedData<CustomerBook>;
    categories: CustomerCategory[];
    filters: CatalogFilters;
}

export default function BooksIndex({
    books,
    categories,
    filters,
}: CatalogPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [detailBookId, setDetailBookId] = useState<number | null>(null);
    const debouncedSearch = useDebounce(search);
    const selectedDetailBook = useMemo(
        () => books.data.find((book) => book.id === detailBookId) ?? null,
        [books.data, detailBookId],
    );

    const navigate = (next: CatalogFilters) => {
        const payload: Record<string, string | string[]> = {
            search: next.search,
            availability: next.availability,
            sort: next.sort,
        };
        if (next.categories && next.categories.length > 0) {
            payload.categories = next.categories;
        }

        router.get('/books', payload, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            only: ['books', 'filters'],
        });
    };

    useEffect(() => setSearch(filters.search), [filters.search]);
    useEffect(() => {
        if (debouncedSearch !== filters.search)
            navigate({ ...filters, search: debouncedSearch });
    }, [debouncedSearch]);

    const updateFilter = <K extends keyof CatalogFilters>(
        key: K,
        value: CatalogFilters[K],
    ) => navigate({ ...filters, [key]: value });

    const reset = () => {
        setSearch('');
        navigate({
            search: '',
            categories: [],
            availability: '',
            sort: 'latest',
        });
    };

    return (
        <>
            <Head title="Katalog Buku" />
            <section className="bg-secondary/35 border-primary/10 overflow-hidden border-b">
                <SectionContainer className="grid items-center gap-3 py-8 sm:py-10 md:grid-cols-[1fr_.9fr]">
                    <div>
                        <p className="text-primary inline-flex items-center gap-2 text-xs font-bold tracking-[.24em] uppercase">
                            <Sparkles
                                className="text-warning size-4"
                                aria-hidden="true"
                            />
                            Wonderbook
                        </p>
                        <h1 className="font-heading text-foreground mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                            Katalog Buku
                        </h1>
                        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
                            Temukan ribuan buku inspiratif pilihan untuk
                            menemani perjalanan membaca dan berkembang.
                        </p>
                    </div>
                    <img
                        src="/dashboard-image/pesanan.png"
                        alt="Anak membaca buku dengan gembira"
                        className="hidden max-h-64 w-full object-contain md:block"
                    />
                </SectionContainer>
            </section>
            <SectionContainer className="py-8 sm:py-10">
                <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
                    <BookFilters
                        categories={categories}
                        filters={filters}
                        search={search}
                        onSearchChange={setSearch}
                        onChange={updateFilter}
                        onReset={reset}
                    />

                    <div className="min-w-0">
                        <div className="border-primary/10 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                            <h2 className="font-heading text-foreground flex items-center gap-2 text-xl font-bold sm:text-2xl">
                                <Sparkles
                                    className="text-warning size-5"
                                    aria-hidden="true"
                                />
                                Temukan Bacaanmu
                            </h2>
                            <p className="text-muted-foreground text-xs font-medium">
                                Menampilkan{' '}
                                <span className="text-foreground font-semibold">
                                    {books.meta.total}
                                </span>{' '}
                                buku
                            </p>
                        </div>
                        {books.data.length > 0 ? (
                            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
                                {books.data.map((book) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        onView={(selected) =>
                                            setDetailBookId(selected.id)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6">
                                <EmptyState onReset={reset} />
                            </div>
                        )}
                        <CatalogPagination books={books} />
                    </div>
                </div>
            </SectionContainer>
            <BookDetailDialog
                book={selectedDetailBook}
                onClose={() => setDetailBookId(null)}
            />
        </>
    );
}
