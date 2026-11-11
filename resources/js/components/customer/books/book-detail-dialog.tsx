import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { BookImageGallery } from '@/components/customer/books/book-image-gallery';
import { BookPreOrderDetails } from '@/components/customer/books/book-preorder-details';
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
}

export function BookDetailDialog({ book, onClose }: BookDetailDialogProps) {
    const form = useForm({ book_id: book?.id ?? 0 });

    useEffect(() => {
        form.setData('book_id', book?.id ?? 0);
        form.clearErrors();
    }, [book?.id]);

    return (
        <Dialog
            open={Boolean(book)}
            onOpenChange={(open) => !open && !form.processing && onClose()}
        >
            {book && (
                <DialogContent className="border-border max-h-[90vh] w-[94vw] max-w-[94vw] overflow-hidden rounded-none border p-0 shadow-2xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{book.title}</DialogTitle>
                        <DialogDescription>
                            Detail buku {book.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex max-h-[90vh] flex-col overflow-y-auto md:grid md:grid-cols-[340px_1fr] md:overflow-hidden lg:grid-cols-[400px_1fr]">
                        {/* Left Column: Image Gallery */}
                        <div className="bg-muted/40 border-border flex shrink-0 flex-col items-center justify-center border-b p-4 sm:p-6 md:border-r md:border-b-0 lg:p-8">
                            <div className="w-full max-w-[200px] sm:max-w-[260px] md:max-w-[320px]">
                                <BookImageGallery book={book} />
                            </div>
                        </div>

                        {/* Right Column: Book Details & Actions */}
                        <div className="flex flex-1 flex-col p-4 sm:p-6 md:max-h-[90vh] md:overflow-y-auto lg:p-8">
                            {/* Categories */}
                            <div className="flex flex-wrap items-center gap-1.5 pr-8 md:pr-0">
                                {book.categories.length > 0 ? (
                                    book.categories.map((category) => (
                                        <span
                                            key={category.id}
                                            className="border-border bg-secondary/60 text-muted-foreground border px-2 py-0.5 text-[10px] font-medium sm:text-[11px]"
                                        >
                                            {category.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="border-border bg-secondary/60 text-muted-foreground border px-2 py-0.5 text-[10px] font-medium sm:text-[11px]">
                                        Buku
                                    </span>
                                )}
                            </div>

                            {/* Title & Author */}
                            <h2 className="font-heading text-foreground mt-2.5 text-xl leading-snug font-semibold sm:text-2xl lg:text-3xl">
                                {book.title}
                            </h2>
                            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                Penulis:{' '}
                                <span className="text-foreground font-medium">
                                    {book.author}
                                </span>
                            </p>
                            <BookPreOrderDetails book={book} />

                            {/* Price & Stock status */}
                            <div className="border-border mt-3.5 flex flex-wrap items-baseline gap-3 border-y py-3 sm:mt-4 sm:gap-4">
                                <span className="text-foreground font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                                    {rupiah(book.price)}
                                </span>
                                <span
                                    className={`border px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${
                                        book.stock > 0
                                            ? 'border-black'
                                            : 'border-black'
                                    }`}
                                >
                                    {book.stock > 0
                                        ? `Stok Tersedia (${book.stock})`
                                        : 'Stok Habis'}
                                </span>
                            </div>

                            {/* Meta info / specs */}
                            <div className="border-border mt-3.5 grid grid-cols-2 gap-3 border-b pb-3.5 text-xs sm:mt-4 sm:gap-4">
                                <div>
                                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">
                                        ISBN
                                    </span>
                                    <span className="text-foreground text-xs font-medium sm:text-sm">
                                        {book.isbn || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">
                                        Kategori Utama
                                    </span>
                                    <span className="text-foreground text-xs font-medium sm:text-sm">
                                        {book.categories[0]?.name || '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Synopsis / Description */}
                            <div className="mt-3.5 flex-1 sm:mt-4">
                                <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase sm:text-xs">
                                    Sinopsis
                                </h3>
                                <p className="text-muted-foreground mt-1.5 max-h-36 overflow-y-auto pr-1 text-xs leading-relaxed whitespace-pre-line sm:mt-2 sm:max-h-48 sm:text-sm">
                                    {book.description ||
                                        'Sinopsis belum tersedia untuk buku ini.'}
                                </p>
                            </div>

                            {/* Action Button */}
                            <div className="border-border bg-background/95 sticky bottom-0 -mx-4 mt-4 border-t px-4 pt-3 pb-1 backdrop-blur-xs sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-t md:bg-transparent md:px-0 md:pt-4 md:pb-0 md:backdrop-blur-none">
                                <Button
                                    size="lg"
                                    disabled={
                                        book.stock <= 0 || form.processing
                                    }
                                    onClick={() =>
                                        form.post('/cart/items', {
                                            preserveScroll: true,
                                        })
                                    }
                                    className="h-10 w-full rounded-none text-xs font-bold tracking-wider uppercase sm:h-11"
                                >
                                    <ShoppingCart className="size-4" />{' '}
                                    {form.processing
                                        ? 'Menambahkan...'
                                        : 'Masukkan ke Keranjang'}
                                </Button>
                                {form.errors.book_id && (
                                    <p
                                        role="alert"
                                        className="text-destructive mt-2 text-xs"
                                    >
                                        {form.errors.book_id}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
