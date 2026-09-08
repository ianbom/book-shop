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
        <article className="border-border group bg-card hover:border-primary flex min-w-0 flex-col border p-2.5 transition hover:-translate-y-1 hover:shadow-md sm:p-3">
            <button
                type="button"
                onClick={() => onView?.(book)}
                className="bg-muted flex aspect-[.72] w-full items-center justify-center overflow-hidden"
                aria-label={`Lihat detail ${book.title}`}
            >
                {book.primary_image ? (
                    <img
                        src={book.primary_image.url}
                        alt={
                            book.primary_image.alt_text ??
                            `Cover buku ${book.title}`
                        }
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <BookOpen
                        className="text-muted-foreground size-8"
                        aria-hidden="true"
                    />
                )}
            </button>
            <div className="flex flex-1 flex-col pt-3">
                <button
                    type="button"
                    onClick={() => onView?.(book)}
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
                        onClick={(event) => {
                            event.stopPropagation();
                            onView?.(book);
                        }}
                        className="h-8 w-full rounded-none text-xs font-medium"
                    >
                        <BookOpen className="size-3.5" /> Lihat Buku
                    </Button>
                </div>
            </div>
        </article>
    );
}
