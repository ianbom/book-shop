import assert from 'node:assert/strict';
import {
    biteshipStatusLabels,
    shipmentStatusLabel,
    shipmentStatusNotice,
} from '../resources/js/lib/shipment-status.ts';

assert.equal(Object.keys(biteshipStatusLabels).length, 15);
for (const status of Object.keys(biteshipStatusLabels)) {
    assert.ok(shipmentStatusLabel(status));
}
for (const status of [
    'on_hold',
    'rejected',
    'return_in_transit',
    'returned',
    'disposed',
    'courier_not_found',
]) {
    assert.ok(shipmentStatusNotice(status));
}
for (const status of [
    'future_status',
    '__proto__',
    'constructor',
    'toString',
]) {
    assert.equal(shipmentStatusLabel(status), status);
    assert.ok(shipmentStatusNotice(status));
}
assert.equal(shipmentStatusLabel(''), 'Tidak diketahui');
assert.equal(shipmentStatusNotice('delivered'), null);
console.log('Shipment status labels: passed');
