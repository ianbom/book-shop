import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rupiah } from '@/lib/format';
import type { CustomerBook } from '@/types';

export function BookCard({
    book,
    onView,
}: {
    book: CustomerBook;
    compact?: boolean;
    onView?: (book: CustomerBook) => void;
}) {
    return (
        <article className="border-border bg-card hover:border-primary/50 group flex min-w-0 flex-col rounded-lg border p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-3">
            <button
                type="button"
                onClick={() => onView?.(book)}
                className="bg-secondary/30 relative flex aspect-[.82] w-full items-center justify-center overflow-hidden rounded-md"
                aria-label={`Lihat detail ${book.title}`}
            >
                {book.primary_image ? (
                    <img
                        src={book.primary_image.url}
                        alt={
                            book.primary_image.alt_text ??
                            `Cover buku ${book.title}`
                        }
                        className="size-full object-contain transition duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <BookOpen
                        className="text-primary size-12"
                        aria-hidden="true"
                    />
                )}

            </button>
            <div className="flex flex-1 flex-col pt-2">
                <span className="bg-secondary text-primary w-fit max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    {book.categories[0]?.name ?? 'Buku'}
                </span>
                <button
                    type="button"
                    onClick={() => onView?.(book)}
                    className="hover:text-primary mt-1 line-clamp-2 min-h-10 text-left text-xs leading-5 font-bold transition-colors sm:text-sm"
                >
                    {book.title}
                </button>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px]">
                    {book.author}
                </p>
                <span
                    className={`mt-1 text-[10px] font-medium ${book.stock > 0 ? 'text-success' : 'text-destructive'}`}
                >
                    {book.stock > 0 ? `Stok ${book.stock}` : 'Habis'}
                </span>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                    <strong className="text-primary text-xs sm:text-sm">
                        {rupiah(book.price)}
                    </strong>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView?.(book)}
                        className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground h-8 rounded-md px-2 text-[10px] font-bold sm:px-3"
                    >
                        Lihat Detail
                    </Button>
                </div>
            </div>
        </article>
    );
}
