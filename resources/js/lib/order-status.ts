import type {
    CustomerOrderStatus,
    CustomerPaymentStatus,
} from '@/types/customer';

export const orderStatusLabels: Record<CustomerOrderStatus, string> = {
    pending: 'Pesanan Dibuat',
    packing: 'Proses Packing',
    shipping: 'Proses Pengiriman',
    completed: 'Selesai',
    cancelled: 'Pesanan Dibatalkan',
};

export const paymentStatusLabels: Record<CustomerPaymentStatus, string> = {
    unpaid: 'Belum Dibayar',
    paid: 'Dibayar',
    rejected: 'Ditolak',
};

export const orderLifecycle: CustomerOrderStatus[] = [
    'pending',
    'packing',
    'shipping',
    'completed',
];

export function nextOrderStatus(
    status: CustomerOrderStatus,
): CustomerOrderStatus | null {
    if (status === 'cancelled') return null;
    return orderLifecycle[orderLifecycle.indexOf(status) + 1] ?? null;
}
