import { ShoppingBag } from 'lucide-react';
import { BookImageGallery } from '@/components/customer/books/book-image-gallery';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { rupiah } from '@/lib/format';
import type { CustomerBook } from '@/types';

interface BookDetailDialogProps {
    book: CustomerBook | null;
    onClose: () => void;
    onBuy: (book: CustomerBook) => void;
}

export function BookDetailDialog({
    book,
    onClose,
    onBuy,
}: BookDetailDialogProps) {
    return (
        <Dialog
            open={Boolean(book)}
            onOpenChange={(open) => !open && onClose()}
        >
            {book && (
                <DialogContent className="w-[94vw] max-w-[94vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden rounded-none border border-border p-0 shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{book.title}</DialogTitle>
                        <DialogDescription>
                            Detail buku {book.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col md:grid md:grid-cols-[340px_1fr] lg:grid-cols-[400px_1fr] max-h-[90vh] overflow-y-auto md:overflow-hidden">
                        {/* Left Column: Image Gallery */}
                        <div className="bg-muted/40 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border shrink-0">
                            <div className="w-full max-w-[200px] sm:max-w-[260px] md:max-w-[320px]">
                                <BookImageGallery book={book} />
                            </div>
                        </div>

                        {/* Right Column: Book Details & Actions */}
                        <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8 md:overflow-y-auto md:max-h-[90vh]">
                            {/* Categories */}
                            <div className="flex flex-wrap items-center gap-1.5 pr-8 md:pr-0">
                                {book.categories.length > 0 ? (
                                    book.categories.map((category) => (
                                        <span
                                            key={category.id}
                                            className="border border-border bg-secondary/60 text-muted-foreground px-2 py-0.5 text-[10px] sm:text-[11px] font-medium"
                                        >
                                            {category.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="border border-border bg-secondary/60 text-muted-foreground px-2 py-0.5 text-[10px] sm:text-[11px] font-medium">
                                        Buku
                                    </span>
                                )}
                            </div>

                            {/* Title & Author */}
                            <h2 className="font-heading text-foreground mt-2.5 text-xl sm:text-2xl lg:text-3xl font-semibold leading-snug">
                                {book.title}
                            </h2>
                            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                Penulis:{' '}
                                <span className="text-foreground font-medium">
                                    {book.author}
                                </span>
                            </p>

                            {/* Price & Stock status */}
                            <div className="mt-3.5 sm:mt-4 flex flex-wrap items-baseline gap-3 sm:gap-4 border-y border-border py-3">
                                <span className="text-foreground font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                                    {rupiah(book.price)}
                                </span>
                                <span
                                    className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 border ${
                                        book.stock > 0 ? 'border-black' : 'border-black'
                                    }`}
                                >
                                    {book.stock > 0
                                        ? `Stok Tersedia (${book.stock})`
                                        : 'Stok Habis'}
                                </span>
                            </div>

                            {/* Meta info / specs */}
                            <div className="mt-3.5 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 border-b border-border pb-3.5 text-xs">
                                <div>
                                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">
                                        ISBN
                                    </span>
                                    <span className="font-medium text-foreground text-xs sm:text-sm">
                                        {book.isbn || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">
                                        Kategori Utama
                                    </span>
                                    <span className="font-medium text-foreground text-xs sm:text-sm">
                                        {book.categories[0]?.name || '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Synopsis / Description */}
                            <div className="mt-3.5 sm:mt-4 flex-1">
                                <h3 className="text-[11px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Sinopsis
                                </h3>
                                <p className="text-muted-foreground mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed whitespace-pre-line max-h-36 sm:max-h-48 overflow-y-auto pr-1">
                                    {book.description ||
                                        'Sinopsis belum tersedia untuk buku ini.'}
                                </p>
                            </div>

                            {/* Action Button */}
                            <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border bg-background/95 px-4 pt-3 pb-1 backdrop-blur-xs sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-t md:bg-transparent md:px-0 md:pt-4 md:pb-0 md:backdrop-blur-none">
                                <Button
                                    size="lg"
                                    disabled={book.stock <= 0}
                                    onClick={() => {
                                        onClose();
                                        onBuy(book);
                                    }}
                                    className="w-full rounded-none h-10 sm:h-11 text-xs font-bold uppercase tracking-wider"
                                >
                                    <ShoppingBag className="size-4" /> Beli Buku
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
