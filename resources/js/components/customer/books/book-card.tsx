import { BookOpen, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rupiah } from '@/lib/format';
import type { CustomerBook } from '@/types';

export function BookCard({
    book,
    compact = false,
    onView,
    onBuy,
}: {
    book: CustomerBook;
    compact?: boolean;
    onView?: (book: CustomerBook) => void;
    onBuy?: (book: CustomerBook) => void;
}) {
    const catalogCard = Boolean(onView);

    return (
        <article className="group flex min-w-0 flex-col rounded-md border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
            <button
                type="button"
                onClick={() => onView?.(book)}
                className={`grid place-items-center overflow-hidden bg-slate-50 ${compact ? 'h-48 sm:h-52' : 'h-60 sm:h-64'}`}
                aria-label={`Lihat ${book.title}`}
            >
                {book.primary_image ? (
                    <img
                        src={book.primary_image.url}
                        alt={
                            book.primary_image.alt_text ??
                            `Cover buku ${book.title}`
                        }
                        className="h-full max-w-full object-contain p-2 drop-shadow-md"
                        loading="lazy"
                    />
                ) : (
                    <BookOpen
                        className="size-10 text-slate-300"
                        aria-hidden="true"
                    />
                )}
            </button>
            <div className="pt-3">
                <button
                    type="button"
                    onClick={() => onView?.(book)}
                    className="line-clamp-1 text-left text-sm font-semibold text-[#0B1F3A] hover:text-[#2563EB]"
                >
                    {book.title}
                </button>
                {!compact && (
                    <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                        {book.description ?? book.author}
                    </p>
                )}
                <p className="mt-2 text-sm font-bold text-[#0B1F3A]">
                    {rupiah(book.price)}
                </p>
                {catalogCard && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                            className={`text-xs font-medium ${book.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}
                        >
                            {book.stock > 0
                                ? `Stok ${book.stock}`
                                : 'Stok Habis'}
                        </span>
                        <Button
                            size="sm"
                            disabled={book.stock <= 0}
                            onClick={(event) => {
                                event.stopPropagation();
                                onBuy?.(book);
                            }}
                        >
                            <ShoppingBag className="size-3.5" /> Beli
                        </Button>
                    </div>
                )}
            </div>
        </article>
    );
}
