import { useMemo, useState } from 'react';
import { BookCard } from '@/components/customer/books/book-card';
import { CategoryTabs } from '@/components/customer/home/category-tabs';
import { SectionContainer } from '@/components/customer/shared/section-container';
import type { CustomerBook, CustomerCategory } from '@/types';

export function FeaturedBooksSection({
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
        <section id="katalog" className="scroll-mt-20 py-10 lg:py-14">
            <SectionContainer>
                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onChange={setActiveCategory}
                />
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    {visibleBooks.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
                {visibleBooks.length === 0 && (
                    <p className="py-12 text-center text-sm text-slate-500">
                        Belum ada buku pada genre ini.
                    </p>
                )}
                <div className="mt-7 text-center">
                    <a
                        href="/books"
                        className="inline-flex h-10 items-center rounded-md border border-[#0B1F3A] px-8 text-sm font-semibold transition hover:bg-[#0B1F3A] hover:text-white"
                    >
                        Semua Buku
                    </a>
                </div>
            </SectionContainer>
        </section>
    );
}
