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
                        <div className="bg-slate-50 p-6 sm:p-8">
                            <BookImageGallery book={book} />
                        </div>
                        <div className="flex flex-col p-6 sm:p-8">
                            <p className="text-sm text-slate-500">
                                {book.categories
                                    .map((category) => category.name)
                                    .join(' · ') || 'Buku'}
                            </p>
                            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#0B1F3A]">
                                {book.title}
                            </h2>
                            <p className="mt-2 text-base text-slate-600">
                                {book.author}
                            </p>
                            <p className="mt-5 text-2xl font-bold text-[#0B1F3A]">
                                {rupiah(book.price)}
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {book.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                            <dl className="mt-6 grid grid-cols-[92px_1fr] gap-y-3 border-y border-slate-200 py-5 text-sm">
                                <dt className="text-slate-500">ISBN</dt>
                                <dd>{book.isbn ?? '-'}</dd>
                                <dt className="text-slate-500">Stok</dt>
                                <dd
                                    className={
                                        book.stock > 0
                                            ? 'font-medium text-emerald-700'
                                            : 'font-medium text-red-600'
                                    }
                                >
                                    {book.stock > 0
                                        ? `Tersedia (${book.stock})`
                                        : 'Stok Habis'}
                                </dd>
                            </dl>
                            <div className="mt-6">
                                <h3 className="font-semibold">Sinopsis</h3>
                                <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-600">
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
                                className="mt-8 w-full bg-[#0B1F3A] hover:bg-[#071426]"
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
