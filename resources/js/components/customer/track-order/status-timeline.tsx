import { Check, Circle, Clock3, XCircle } from 'lucide-react';
import { nextOrderStatus, orderStatusLabels } from '@/lib/order-status';
import type { CustomerTrackedOrder } from '@/types/customer';

function formatDate(value: string | null): string {
    if (!value) return 'Waktu belum tersedia';
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function StatusTimeline({ order }: { order: CustomerTrackedOrder }) {
    const currentHistoryIndex =
        order.status_histories
            .map((history, index) => ({ history, index }))
            .reverse()
            .find(({ history }) => history.status === order.status)?.index ??
        -1;
    const upcoming = nextOrderStatus(order.status);

    return (
        <section
            className="border-border bg-background border p-5 sm:p-7"
            aria-labelledby="timeline-title"
        >
            <div className="border-border flex items-end justify-between gap-4 border-b pb-5">
                <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                        Perjalanan Pesanan
                    </p>
                    <h2
                        id="timeline-title"
                        className="font-heading text-foreground mt-2 text-2xl font-semibold"
                    >
                        Riwayat Status
                    </h2>
                </div>
                <Clock3 className="text-foreground size-6" aria-hidden="true" />
            </div>
            {order.status_histories.length ? (
                <ol className="mt-6 space-y-0">
                    {order.status_histories.map((history, index) => {
                        const isCurrent = index === currentHistoryIndex;
                        const isCancelled = history.status === 'cancelled';
                        const markerClass = isCancelled
                            ? 'border-destructive text-destructive'
                            : isCurrent
                              ? 'border-foreground text-foreground'
                              : 'border-muted-foreground text-muted-foreground';
                        return (
                            <li
                                key={[
                                    history.status,
                                    history.created_at,
                                    index,
                                ].join('-')}
                                className="relative flex gap-4 pb-7 last:pb-0"
                            >
                                {index < order.status_histories.length - 1 && (
                                    <span
                                        className="bg-border absolute top-7 left-[11px] h-full w-px"
                                        aria-hidden="true"
                                    />
                                )}
                                <span
                                    className={
                                        'bg-background relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ' +
                                        markerClass
                                    }
                                    aria-hidden="true"
                                >
                                    {isCancelled ? (
                                        <XCircle className="size-4" />
                                    ) : isCurrent ? (
                                        <Circle className="size-3 fill-current" />
                                    ) : (
                                        <Check className="size-4" />
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3
                                            className={
                                                'font-semibold ' +
                                                (isCurrent
                                                    ? 'text-foreground'
                                                    : 'text-foreground')
                                            }
                                        >
                                            {orderStatusLabels[history.status]}
                                        </h3>
                                        {isCurrent && (
                                            <span className="border-foreground text-foreground border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                                                Saat ini
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {formatDate(history.created_at)}
                                    </p>
                                    {history.note && (
                                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                                            {history.note}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            ) : (
                <p className="border-border text-muted-foreground mt-6 border border-dashed p-5 text-sm">
                    Riwayat status belum tersedia. Status saat ini:{' '}
                    <strong className="text-foreground">
                        {orderStatusLabels[order.status]}
                    </strong>
                    .
                </p>
            )}
            {order.status !== 'cancelled' && upcoming && (
                <p className="border-border text-muted-foreground mt-7 border-t pt-4 text-sm">
                    Tahap berikutnya:{' '}
                    <strong className="text-foreground">
                        {orderStatusLabels[upcoming]}
                    </strong>
                </p>
            )}
            {order.status === 'cancelled' && (
                <p className="border-border text-destructive mt-7 border-t pt-4 text-sm">
                    Pesanan ini telah dibatalkan.
                </p>
            )}
        </section>
    );
}
