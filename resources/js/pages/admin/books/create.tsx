import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { BookForm } from '@/components/admin/books/book-form';
import admin from '@/routes/admin';
import type { Category } from '@/types/admin';
export default function CreateBook({
    categories,
}: {
    categories: { data: Category[] } | Category[];
}) {
    return (
        <>
            <Head title="Tambah Buku" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Tambah Buku"
                    description="Tambahkan buku baru ke katalog."
                />
                <BookForm
                    categories={
                        Array.isArray(categories) ? categories : categories.data
                    }
                />
            </main>
        </>
    );
}
CreateBook.layout = {
    breadcrumbs: [
        { title: 'Buku', href: admin.books.index() },
        { title: 'Tambah Buku', href: admin.books.create() },
    ],
};
