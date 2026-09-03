import { useMemo, useState } from 'react';
import { BookCard } from '@/components/customer/books/book-card';
import { SectionContainer } from '@/components/customer/shared/section-container';
import type { CustomerBook, CustomerCategory } from '@/types';

export function LatestBooksSection({
    books,
    categories,
}: {
    books: CustomerBook[];
    categories: CustomerCategory[];
}) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const visibleBooks = useMemo(
        () =>
            activeCategory
                ? books.filter((book) =>
                      book.categories.some(
                          (category) => category.slug === activeCategory,
                      ),
                  )
                : books,
        [activeCategory, books],
    );

    return (
        <section className="py-12 lg:py-16">
            <SectionContainer>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <h2 className="font-heading text-3xl font-semibold">
                        Buku Terbaru
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Semua', slug: null },
                            ...categories.slice(0, 3).map((category) => ({
                                label:
                                    category.name === 'Pengembangan Diri'
                                        ? 'Self Improvement'
                                        : category.name,
                                slug: category.slug,
                            })),
                        ].map((filter) => (
                            <button
                                type="button"
                                key={filter.label}
                                onClick={() => setActiveCategory(filter.slug)}
                                className={`rounded-md px-4 py-2 text-xs font-medium ${activeCategory === filter.slug ? 'bg-foreground text-primary-foreground' : 'border-border text-muted-foreground hover:border-foreground border'}`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    {visibleBooks.map((book) => (
                        <BookCard key={book.id} book={book} compact />
                    ))}
                </div>
                {visibleBooks.length === 0 && (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        Belum ada buku terbaru pada genre ini.
                    </p>
                )}
            </SectionContainer>
        </section>
    );
}
