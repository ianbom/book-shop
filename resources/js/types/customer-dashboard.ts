import type {
    OrderStatus,
    PaymentStatus,
    WalletTransactionType,
} from '@/types/admin';
import type { PaginationLink } from '@/types/pagination';

export type CustomerDashboardPage<T> = {
    data: T[];
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export type CustomerOrder = {
    id: number;
    order_code: string;
    item_summary: string;
    primary_image: { url: string; alt_text: string | null } | null;
    quantity: number;
    total: string;
    status: OrderStatus;
    can_cancel: boolean;
    payment_status: PaymentStatus;
    shipments_count: number;
    created_at: string | null;
};

export type CustomerWalletTransaction = {
    id: number;
    type: WalletTransactionType;
    direction: 'credit' | 'debit';
    amount: string;
    balance_after: string;
    order_code: string | null;
    topup_code: string | null;
    created_at: string | null;
};

export type CustomerBankAccount = {
    bank_name: string;
    account_holder: string;
    account_number: string;
};

export type CustomerWalletTopup = {
    id: number;
    topup_code: string;
    requested_amount: string;
    credited_amount: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    created_at: string | null;
    reviewed_at: string | null;
};

export type CustomerVoucher = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: 'fixed' | 'percentage';
    value: string;
    max_discount: string | null;
    min_order_amount: string;
    ends_at: string | null;
    remaining_uses: number;
};
