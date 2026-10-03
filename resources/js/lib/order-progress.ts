import type { OrderStatus, PaymentStatus } from '@/types/admin';

export function getOrderProgress(order: {
    status: OrderStatus;
    payment_status: PaymentStatus;
    created_at: string | null;
    status_histories: { status: string; created_at: string | null }[];
}) {
    const statuses = [
        'pending',
        'processing',
        'packing',
        'shipping',
        'completed',
    ];
    const progressIndex =
        order.status === 'cancelled'
            ? Math.max(
                  0,
                  ...order.status_histories.map((history) =>
                      statuses.indexOf(history.status),
                  ),
              )
            : Math.max(0, statuses.indexOf(order.status));
    const paid = order.payment_status !== 'unpaid';
    const activeIndex =
        order.status === 'cancelled'
            ? -1
            : progressIndex === 0
              ? Number(paid)
              : progressIndex + 1;
    const dateFor = (status: OrderStatus) =>
        order.status_histories
            .flatMap((history) =>
                history.status === status && history.created_at
                    ? [history.created_at]
                    : [],
            )
            .sort()[0] ?? null;
    const paymentLabels: Record<PaymentStatus, string> = {
        unpaid: 'Belum dibayar',
        paid: 'Lunas',
        partially_refunded: 'Dikembalikan sebagian',
        refunded: 'Dikembalikan',
    };

    return [
        {
            label: 'Pesanan Dibuat',
            date: order.created_at,
            detail: null,
            reached: true,
        },
        {
            label: 'Pembayaran',
            date: null,
            detail: paymentLabels[order.payment_status],
            reached: paid,
        },
        {
            label: 'Diproses',
            date: dateFor('processing'),
            detail: null,
            reached: progressIndex >= 1,
        },
        {
            label: 'Dikemas',
            date: dateFor('packing'),
            detail: null,
            reached: progressIndex >= 2,
        },
        {
            label: 'Dikirim',
            date: dateFor('shipping'),
            detail: null,
            reached: progressIndex >= 3,
        },
        {
            label: 'Selesai',
            date: dateFor('completed'),
            detail: null,
            reached: progressIndex >= 4,
        },
    ].map((step, index) => ({
        ...step,
        state:
            index === activeIndex
                ? ('current' as const)
                : step.reached
                  ? ('complete' as const)
                  : ('upcoming' as const),
    }));
}
