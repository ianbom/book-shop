import { Badge } from '@/components/ui/badge';
import { shipmentStatusLabels } from '@/lib/shipment-status';
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
    ...shipmentStatusLabels,
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
    approved: 'Disetujui',
    active: 'Aktif',
    inactive: 'Nonaktif',
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
    confirmed: 'bg-accent text-accent-foreground',
    allocated: 'bg-accent text-accent-foreground',
    picking_up: 'bg-accent text-accent-foreground',
    picked: 'bg-accent text-accent-foreground',
    dropping_off: 'bg-accent text-accent-foreground',
    on_hold: 'bg-warning/10 text-warning',
    return_in_transit: 'bg-warning/10 text-warning',
    returned: 'bg-warning/10 text-warning',
    disposed: 'bg-destructive/10 text-destructive',
    courier_not_found: 'bg-destructive/10 text-destructive',
};

export function StatusBadge({ value }: { value: string }) {
    return (
        <Badge
            variant="secondary"
            className={
                Object.hasOwn(colors, value)
                    ? colors[value]
                    : 'bg-secondary text-secondary-foreground'
            }
        >
            {Object.hasOwn(labels, value)
                ? labels[value as Status]
                : value || 'Tidak diketahui'}
        </Badge>
    );
}
