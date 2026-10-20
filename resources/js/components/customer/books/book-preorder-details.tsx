import { formatMonthYear } from '@/lib/format';
import type { CustomerBook } from '@/types';

export function BookPreOrderDetails({ book }: { book: CustomerBook }) {
    if (book.sale_type !== 'preorder') return null;

    return (
        <div className="mt-1.5 grid gap-0.5 text-[10px] leading-4">
            <p>
                <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-semibold">
                    Pre Order
                </span>
            </p>
            <p className="text-muted-foreground">
                Estimasi: {formatMonthYear(book.preorder_estimated_date)}
            </p>
            <p className="text-muted-foreground break-all">
                Kode: {book.pre_order_code?.code ?? '-'}
            </p>
        </div>
    );
}
