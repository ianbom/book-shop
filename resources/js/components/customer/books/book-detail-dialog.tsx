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
                <DialogContent className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{book.title}</DialogTitle>
                        <DialogDescription>
                            Detail buku {book.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
                        <div className="bg-muted p-6 sm:p-8">
                            <BookImageGallery book={book} />
                        </div>
                        <div className="flex flex-col p-6 sm:p-8">
                            <p className="text-muted-foreground text-sm">
                                {book.categories
                                    .map((category) => category.name)
                                    .join(' · ') || 'Buku'}
                            </p>
                            <h2 className="font-heading text-foreground mt-2 text-3xl font-semibold">
                                {book.title}
                            </h2>
                            <p className="text-muted-foreground mt-2 text-base">
                                {book.author}
                            </p>
                            <p className="text-foreground mt-5 text-2xl font-bold">
                                {rupiah(book.price)}
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {book.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="border-border text-muted-foreground border px-2.5 py-1 text-xs"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                            <dl className="border-border mt-6 grid grid-cols-[92px_1fr] gap-y-3 border-y py-5 text-sm">
                                <dt className="text-muted-foreground">ISBN</dt>
                                <dd>{book.isbn ?? '-'}</dd>
                                <dt className="text-muted-foreground">Stok</dt>
                                <dd
                                    className={
                                        book.stock > 0
                                            ? 'text-success font-medium'
                                            : 'text-destructive font-medium'
                                    }
                                >
                                    {book.stock > 0
                                        ? `Tersedia (${book.stock})`
                                        : 'Stok Habis'}
                                </dd>
                            </dl>
                            <div className="mt-6">
                                <h3 className="font-semibold">Sinopsis</h3>
                                <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-line">
                                    {book.description ||
                                        'Deskripsi belum tersedia.'}
                                </p>
                            </div>
                            <Button
                                disabled={book.stock <= 0}
                                onClick={() => {
                                    onClose();
                                    onBuy(book);
                                }}
                                className="bg-foreground hover:bg-foreground mt-8 w-full"
                            >
                                <ShoppingBag /> Beli Buku
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
