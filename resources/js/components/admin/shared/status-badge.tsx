import { Badge } from '@/components/ui/badge';
import type {
    OrderStatus,
    PaymentStatus,
    StockMovementType,
} from '@/types/admin';

const labels: Record<OrderStatus | PaymentStatus | StockMovementType, string> =
    {
        pending: 'Pending',
        packing: 'Proses Packing',
        shipping: 'Proses Pengiriman',
        completed: 'Selesai',
        cancelled: 'Dibatalkan',
        unpaid: 'Belum Dibayar',
        paid: 'Dibayar',
        rejected: 'Ditolak',
        initial: 'Stok Awal',
        adjustment_in: 'Stok Masuk',
        adjustment_out: 'Stok Keluar',
        order: 'Order',
        cancellation: 'Pembatalan',
    };
const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    packing: 'bg-blue-100 text-blue-800',
    shipping: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    unpaid: 'bg-slate-100 text-slate-700',
    paid: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    initial: 'bg-sky-100 text-sky-800',
    adjustment_in: 'bg-emerald-100 text-emerald-800',
    adjustment_out: 'bg-orange-100 text-orange-800',
    order: 'bg-violet-100 text-violet-800',
    cancellation: 'bg-cyan-100 text-cyan-800',
};

export function StatusBadge({
    value,
}: {
    value: OrderStatus | PaymentStatus | StockMovementType;
}) {
    return (
        <Badge variant="secondary" className={colors[value]}>
            {labels[value]}
        </Badge>
    );
}
