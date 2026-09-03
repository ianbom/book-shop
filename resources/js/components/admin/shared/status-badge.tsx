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
    pending: 'bg-warning/10 text-warning',
    packing: 'bg-secondary text-secondary-foreground',
    shipping: 'bg-accent text-accent-foreground',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
    unpaid: 'bg-secondary text-foreground',
    paid: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    initial: 'bg-secondary text-secondary-foreground',
    adjustment_in: 'bg-success/10 text-success',
    adjustment_out: 'bg-warning/10 text-warning',
    order: 'bg-accent text-accent-foreground',
    cancellation: 'bg-secondary text-secondary-foreground',
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
