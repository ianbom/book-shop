export interface CustomerCategory {
    id: number;
    name: string;
    slug: string;
}

export interface CustomerBookImage {
    id: number;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
}

export interface CustomerBook {
    id: number;
    title: string;
    slug: string;
    isbn: string | null;
    author: string;
    description: string | null;
    price: string | number;
    stock: number;
    categories: CustomerCategory[];
    images: CustomerBookImage[];
    primary_image: CustomerBookImage | null;
}

export interface CatalogFilters {
    search: string;
    category: string;
    availability: '' | 'available' | 'out_of_stock';
    sort: 'latest' | 'title_asc' | 'title_desc' | 'price_asc' | 'price_desc';
}

export interface CustomerStoreSettings {
    store_name: string;
    whatsapp_number: string;
    email: string | null;
    address: string | null;
}

export type CustomerOrderStatus =
    | 'pending'
    | 'packing'
    | 'shipping'
    | 'completed'
    | 'cancelled';
export type CustomerPaymentStatus = 'unpaid' | 'paid' | 'rejected';

export interface CustomerOrderStatusHistory {
    status: CustomerOrderStatus;
    note: string | null;
    created_at: string | null;
}

export interface CustomerTrackedOrder {
    order_code: string;
    book_title: string;
    book_author: string | null;
    book_isbn: string | null;
    quantity: number;
    unit_price: string | number;
    subtotal: string | number;
    shipping_cost: string | number;
    total: string | number;
    status: CustomerOrderStatus;
    payment_status: CustomerPaymentStatus;
    status_histories: CustomerOrderStatusHistory[];
    whatsapp_url: string | null;
}
