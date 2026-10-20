import assert from 'node:assert/strict';
import { getCartCheckoutError } from '../resources/js/lib/cart-checkout.ts';

const ready = {
    quantity: 1,
    book: {
        sale_type: 'ready_stock',
        pre_order_code_id: null,
        stock: 2,
        is_active: true,
    },
};
const preorder = {
    ...ready,
    book: { ...ready.book, sale_type: 'preorder', pre_order_code_id: 1 },
};
for (const item of [ready, preorder]) {
    assert.equal(getCartCheckoutError([item]), '');
    assert.equal(getCartCheckoutError([item, item]), '');
    assert.equal(getCartCheckoutError([{ ...item, quantity: 2 }]), '');
    assert.match(
        getCartCheckoutError([{ ...item, quantity: 3 }]),
        /stok tidak mencukupi/,
    );
    assert.match(
        getCartCheckoutError([{ ...item, quantity: 0 }]),
        /stok tidak mencukupi/,
    );
    assert.match(
        getCartCheckoutError([{ ...item, book: { ...item.book, stock: 0 } }]),
        /stok tidak mencukupi/,
    );
    assert.match(
        getCartCheckoutError([
            { ...item, book: { ...item.book, is_active: false } },
        ]),
        /tidak tersedia/,
    );
}
assert.match(getCartCheckoutError([ready, preorder]), /kode yang sama/);
assert.match(
    getCartCheckoutError([
        preorder,
        { ...preorder, book: { ...preorder.book, pre_order_code_id: 2 } },
    ]),
    /kode yang sama/,
);
assert.match(
    getCartCheckoutError([
        { ...preorder, book: { ...preorder.book, pre_order_code_id: null } },
    ]),
    /belum memiliki kode/,
);
assert.match(
    getCartCheckoutError([{ ...ready, book: null }]),
    /tidak tersedia/,
);
assert.match(getCartCheckoutError([]), /Keranjang kosong/);
console.log('Cart checkout validation: passed');
