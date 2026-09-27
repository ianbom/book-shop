import { Badge } from '@/components/ui/badge';
import type {
    OrderStatus,
    PaymentStatus,
    ShipmentStatus,
    StockMovementType,
    TopupStatus,
    VoucherStatus,
} from '@/types/admin';

type Status =
    | OrderStatus
    | PaymentStatus
    | ShipmentStatus
    | StockMovementType
    | TopupStatus
    | VoucherStatus;

const labels: Record<Status, string> = {
    pending: 'Pending',
    waiting_preorder: 'Menunggu Preorder',
    processing: 'Diproses',
    packing: 'Proses Packing',
    shipping: 'Proses Pengiriman',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    unpaid: 'Belum Dibayar',
    paid: 'Dibayar',
    partially_refunded: 'Refund sebagian',
    refunded: 'Dikembalikan',
    rejected: 'Ditolak',
    initial: 'Stok Awal',
    adjustment_in: 'Stok Masuk',
    adjustment_out: 'Stok Keluar',
    order: 'Order',
    cancellation: 'Pembatalan',
    booked: 'Dipesan',
    pickup: 'Penjemputan',
    in_transit: 'Dalam Pengiriman',
    delivered: 'Terkirim',
    failed: 'Gagal',
    approved: 'Disetujui',
    active: 'Aktif',
    inactive: 'Nonaktif',
    scheduled: 'Terjadwal',
    expired: 'Kedaluwarsa',
};
const colors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    waiting_preorder: 'bg-warning/10 text-warning',
    processing: 'bg-secondary text-secondary-foreground',
    packing: 'bg-secondary text-secondary-foreground',
    shipping: 'bg-accent text-accent-foreground',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
    unpaid: 'bg-secondary text-foreground',
    paid: 'bg-success/10 text-success',
    partially_refunded: 'bg-warning/10 text-warning',
    refunded: 'bg-secondary text-secondary-foreground',
    rejected: 'bg-destructive/10 text-destructive',
    initial: 'bg-secondary text-secondary-foreground',
    adjustment_in: 'bg-success/10 text-success',
    adjustment_out: 'bg-warning/10 text-warning',
    order: 'bg-accent text-accent-foreground',
    cancellation: 'bg-secondary text-secondary-foreground',
    booked: 'bg-accent text-accent-foreground',
    pickup: 'bg-accent text-accent-foreground',
    in_transit: 'bg-accent text-accent-foreground',
    delivered: 'bg-success/10 text-success',
    failed: 'bg-destructive/10 text-destructive',
    approved: 'bg-success/10 text-success',
    active: 'bg-success/10 text-success',
    inactive: 'bg-secondary text-secondary-foreground',
    scheduled: 'bg-warning/10 text-warning',
    expired: 'bg-destructive/10 text-destructive',
};

export function StatusBadge({ value }: { value: Status }) {
    return (
        <Badge variant="secondary" className={colors[value]}>
            {labels[value]}
        </Badge>
    );
}
