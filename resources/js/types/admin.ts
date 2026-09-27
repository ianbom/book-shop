export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};
export type Paginated<T> = {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        links: PaginationLink[];
    };
};
export type Category = {
    id: number;
    name: string;
    slug: string;
    books_count?: number;
};
export type BookImage = {
    id: number;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
};
export type Book = {
    id: number;
    title: string;
    slug: string;
    isbn: string | null;
    sku: string | null;
    author: string;
    description: string | null;
    price: string;
    shipping_category: string;
    weight: number;
    height: string | null;
    length: string | null;
    width: string | null;
    stock: number;
    sale_type: 'ready_stock' | 'preorder';
    preorder_estimated_date: string | null;
    preorder_note: string | null;
    is_active: boolean;
    primary_image_url?: string | null;
    images?: BookImage[];
    categories?: Category[];
    stock_movements?: StockMovement[];
    created_at: string;
    updated_at: string;
};
export type OrderStatus =
    | 'pending'
    | 'waiting_preorder'
    | 'processing'
    | 'packing'
    | 'shipping'
    | 'completed'
    | 'cancelled';
export type PaymentStatus =
    'unpaid' | 'paid' | 'partially_refunded' | 'refunded';
export type StockMovementType =
    | 'initial'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'order'
    | 'cancellation';
export type PaymentProof = {
    id: number;
    image_url: string;
    payment_amount: string | null;
    paid_at: string | null;
    note: string | null;
    uploaded_by?: { id: number | null; name: string | null };
    created_at: string;
};
export type OrderStatusHistory = {
    id: number;
    status: OrderStatus;
    note: string | null;
    changed_by?: { id: number | null; name: string | null };
    created_at: string;
};
export type StockMovement = {
    id: number;
    type: StockMovementType;
    quantity: number;
    stock_before: number;
    stock_after: number;
    note: string | null;
    created_at: string;
    book?: { id: number | null; title: string | null };
    order?: { id: number; order_code: string } | null;
    changed_by?: { id: number; name: string } | null;
};
export type Order = {
    id: number;
    order_code: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    customer_address: string;
    customer_note: string | null;
    book_id: number;
    book_title: string;
    book_isbn: string | null;
    book_author: string | null;
    unit_price: string;
    quantity: number;
    subtotal: string;
    shipping_cost: string;
    total: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    created_at: string;
    book?: { id: number | null; slug: string | null };
    payment_proofs?: PaymentProof[];
    status_histories?: OrderStatusHistory[];
    stock_movements?: StockMovement[];
};
export type BankAccount = {
    bank_name: string;
    account_holder: string;
    account_number: string;
};
export type StoreSetting = {
    id: number;
    store_name: string;
    whatsapp_number: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    couriers: string;
    shipper_contact_name: string | null;
    shipper_contact_phone: string | null;
    shipper_contact_email: string | null;
    shipper_organization: string | null;
    origin_contact_name: string;
    origin_contact_phone: string;
    origin_contact_email: string | null;
    origin_address: string;
    origin_note: string | null;
    origin_postal_code: string | null;
    origin_area_id: string | null;
    origin_location_id: string | null;
    origin_latitude: string | null;
    origin_longitude: string | null;
    bank_accounts: BankAccount[];
};

export type ShipmentStatus =
    | 'pending'
    | 'booked'
    | 'pickup'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'failed';
export type Shipment = {
    id: number;
    shipment_code: string;
    order: { order_code: string | null; customer_name: string | null };
    courier_company: string;
    courier_type: string;
    courier_service_name: string | null;
    delivery_type: 'now' | 'scheduled';
    price: string;
    tracking_id: string | null;
    waybill_id: string | null;
    status: ShipmentStatus;
    created_at: string | null;
};
export type TopupStatus = 'pending' | 'approved' | 'rejected';
export type WalletTopup = {
    id: number;
    topup_code: string;
    user: { name: string | null; email: string | null };
    requested_amount: string;
    credited_amount: string | null;
    admin_note: string | null;
    proof_url: string;
    status: TopupStatus;
    reviewer: string | null;
    reviewed_at: string | null;
    created_at: string | null;
};
export type WalletTransactionType =
    | 'topup_credit'
    | 'order_payment'
    | 'order_refund'
    | 'admin_adjustment_credit'
    | 'admin_adjustment_debit';
export type WalletTransaction = {
    id: number;
    user: { name: string | null; email: string | null };
    order_code: string | null;
    topup_code: string | null;
    type: WalletTransactionType;
    direction: 'credit' | 'debit';
    amount: string;
    balance_before: string;
    balance_after: string;
    note: string | null;
    created_at: string | null;
};
export type VoucherStatus = 'active' | 'inactive' | 'scheduled' | 'expired';
export type Voucher = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: 'fixed' | 'percentage';
    value: string;
    max_discount: string | null;
    min_order_amount: string;
    usage_limit: number | null;
    per_user_limit: number;
    is_active: boolean;
    usages_count: number;
    starts_at: string | null;
    ends_at: string | null;
    status: VoucherStatus;
    created_at: string | null;
};
export type Customer = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    orders_count: number;
    wallet_balance: string;
    email_verified_at: string | null;
    created_at: string | null;
};
