import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatedData } from '@/types';

export function CatalogPagination<T>({ books }: { books: PaginatedData<T> }) {
    if (books.meta.last_page <= 1) return null;

    return (
        <nav
            className="mt-10 flex flex-wrap justify-center gap-1"
            aria-label="Pagination"
        >
            {books.meta.links.map((link, index) => (
                <Button
                    key={`${link.label}-${index}`}
                    asChild={Boolean(link.url)}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                    className={
                        link.active ? 'bg-[#0B1F3A] hover:bg-[#071426]' : ''
                    }
                >
                    <Link
                        href={link.url ?? '#'}
                        preserveScroll
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                </Button>
            ))}
        </nav>
    );
}
