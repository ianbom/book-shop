import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { BookForm } from '@/components/admin/books/book-form';
import admin from '@/routes/admin';
import type { Book, Category, PreOrderCode } from '@/types/admin';
export default function EditBook({
    book,
    categories,
    preOrderCodes,
}: {
    book: Book;
    categories: { data: Category[] } | Category[];
    preOrderCodes: PreOrderCode[];
}) {
    return (
        <>
            <Head title={`Edit ${book.title}`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Edit Buku"
                    description="Perbarui informasi katalog tanpa mengubah stok."
                />
                <BookForm
                    preOrderCodes={preOrderCodes}
                    book={book}
                    categories={
                        Array.isArray(categories) ? categories : categories.data
                    }
                />
            </main>
        </>
    );
}
EditBook.layout = {
    breadcrumbs: [
        { title: 'Buku', href: admin.books.index() },
        { title: 'Edit Buku', href: admin.books.index() },
    ],
};
