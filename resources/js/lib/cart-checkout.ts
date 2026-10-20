type CartItem = {
    quantity: number;
    book: {
        stock: number;
        is_active: boolean;
        sale_type: 'ready_stock' | 'preorder';
        pre_order_code_id: number | null;
    } | null;
};

export function getCartCheckoutError(items: CartItem[]): string {
    if (!items.length)
        return 'Keranjang kosong. Tambahkan buku sebelum checkout.';

    if (items.some((item) => !item.book))
        return 'Buku tidak tersedia. Hapus item tersebut dari keranjang.';

    const preorders = items.filter(
        (item) => item.book?.sale_type === 'preorder',
    );
    if (preorders.some((item) => item.book?.pre_order_code_id === null))
        return 'Buku preorder belum memiliki kode. Hapus buku tersebut dari keranjang sebelum checkout.';

    if (
        preorders.length > 0 &&
        (preorders.length !== items.length ||
            new Set(preorders.map((item) => item.book?.pre_order_code_id))
                .size !== 1)
    )
        return 'Checkout hanya bisa untuk buku ready stock atau preorder dengan kode yang sama. Hapus item lain dari keranjang.';

    if (
        items.some(
            ({ book, quantity }) =>
                !book ||
                !book.is_active ||
                quantity < 1 ||
                quantity > book.stock,
        )
    )
        return 'Buku tidak tersedia atau stok tidak mencukupi. Kurangi jumlah atau hapus buku dari keranjang.';

    return '';
}
