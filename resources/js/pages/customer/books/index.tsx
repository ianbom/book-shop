import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { BookCard } from '@/components/customer/books/book-card';
import { BookDetailDialog } from '@/components/customer/books/book-detail-dialog';
import { BookFilters } from '@/components/customer/books/book-filters';
import { BookOrderDialog } from '@/components/customer/books/book-order-dialog';
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
    const [orderBookId, setOrderBookId] = useState<number | null>(null);
    const debouncedSearch = useDebounce(search);
    const selectedDetailBook = useMemo(
        () => books.data.find((book) => book.id === detailBookId) ?? null,
        [books.data, detailBookId],
    );
    const selectedOrderBook = useMemo(
        () => books.data.find((book) => book.id === orderBookId) ?? null,
        [books.data, orderBookId],
    );

    const navigate = (next: CatalogFilters) =>
        router.get(
            '/books',
            { ...next },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['books', 'filters'],
            },
        );

    useEffect(() => setSearch(filters.search), [filters.search]);
    useEffect(() => {
        if (debouncedSearch !== filters.search)
            navigate({ ...filters, search: debouncedSearch });
    }, [debouncedSearch]);

    const updateFilter = (
        key: Exclude<keyof CatalogFilters, 'search'>,
        value: string,
    ) => navigate({ ...filters, [key]: value } as CatalogFilters);
    const reset = () => {
        setSearch('');
        navigate({
            search: '',
            category: '',
            availability: '',
            sort: 'latest',
        });
    };

    return (
        <>
            <Head title="Katalog Buku" />
            <section className="bg-[#EAF2FF] py-12 sm:py-16">
                <SectionContainer>
                    <p className="text-sm font-semibold tracking-[.18em] text-[#2563EB] uppercase">
                        Buku Order
                    </p>
                    <h1 className="mt-3 font-serif text-4xl font-semibold text-[#0B1F3A] sm:text-5xl">
                        Katalog Buku
                    </h1>
                    <p className="mt-3 max-w-2xl text-slate-600">
                        Temukan buku terbaik untuk menemani perjalanan membaca
                        dan berkembang.
                    </p>
                </SectionContainer>
            </section>
            <SectionContainer className="py-10 sm:py-14">
                <BookFilters
                    categories={categories}
                    filters={filters}
                    search={search}
                    onSearchChange={setSearch}
                    onChange={updateFilter}
                    onReset={reset}
                />
                <div className="mt-7 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        {books.meta.total} buku ditemukan
                    </p>
                </div>
                {books.data.length > 0 ? (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                        {books.data.map((book) => (
                            <BookCard
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
                ) : (
                    <div className="mt-5">
                        <EmptyState onReset={reset} />
                    </div>
                )}
                <CatalogPagination books={books} />
            </SectionContainer>
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
