import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(
    new URL('../../resources/js/lib/order-progress.ts', import.meta.url),
    'utf8',
);
const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
    },
});
const { getOrderProgress } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const order = {
    status: 'pending',
    payment_status: 'unpaid',
    created_at: '2026-10-01T00:00:00.000Z',
    status_histories: [],
};
const states = (input) => getOrderProgress(input).map((step) => step.state);

assert.deepEqual(states(order), [
    'current',
    'upcoming',
    'upcoming',
    'upcoming',
    'upcoming',
    'upcoming',
]);
assert.deepEqual(states({ ...order, payment_status: 'paid' }), [
    'complete',
    'current',
    'upcoming',
    'upcoming',
    'upcoming',
    'upcoming',
]);
assert.deepEqual(
    states({ ...order, status: 'waiting_preorder', payment_status: 'paid' }),
    ['complete', 'current', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
);
assert.deepEqual(states({ ...order, status: 'processing' }), [
    'complete',
    'upcoming',
    'current',
    'upcoming',
    'upcoming',
    'upcoming',
]);
assert.deepEqual(
    states({ ...order, status: 'packing', payment_status: 'paid' }),
    ['complete', 'complete', 'complete', 'current', 'upcoming', 'upcoming'],
);
assert.deepEqual(
    states({ ...order, status: 'shipping', payment_status: 'paid' }),
    ['complete', 'complete', 'complete', 'complete', 'current', 'upcoming'],
);
assert.deepEqual(
    states({ ...order, status: 'completed', payment_status: 'paid' }),
    ['complete', 'complete', 'complete', 'complete', 'complete', 'current'],
);
assert.deepEqual(
    states({ ...order, status: 'cancelled', payment_status: 'refunded' }),
    ['complete', 'complete', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
);
assert.deepEqual(
    states({
        ...order,
        status: 'cancelled',
        status_histories: [{ status: 'processing', created_at: null }],
    }),
    ['complete', 'upcoming', 'complete', 'upcoming', 'upcoming', 'upcoming'],
);

const dated = getOrderProgress({
    ...order,
    status: 'packing',
    payment_status: 'paid',
    status_histories: [
        { status: 'processing', created_at: '2026-10-02T06:00:00.000Z' },
        { status: 'processing', created_at: '2026-10-02T05:00:00.000Z' },
        { status: 'packing', created_at: null },
    ],
});
assert.equal(dated[0].date, order.created_at);
assert.equal(dated[1].date, null);
assert.equal(dated[1].detail, 'Lunas');
assert.equal(dated[2].date, '2026-10-02T05:00:00.000Z');
assert.equal(dated[3].date, null);
assert.equal(
    getOrderProgress({ ...order, payment_status: 'partially_refunded' })[1]
        .detail,
    'Dikembalikan sebagian',
);
assert.equal(
    getOrderProgress({ ...order, payment_status: 'refunded' })[1].detail,
    'Dikembalikan',
);
console.log('Order progress checks passed.');
