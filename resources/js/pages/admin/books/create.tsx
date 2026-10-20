import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { BookForm } from '@/components/admin/books/book-form';
import admin from '@/routes/admin';
import type { Category, PreOrderCode } from '@/types/admin';
export default function CreateBook({
    categories,
    preOrderCodes,
}: {
    categories: { data: Category[] } | Category[];
    preOrderCodes: PreOrderCode[];
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
                    preOrderCodes={preOrderCodes}
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
