import assert from 'node:assert/strict';
import { exactRupiah, exactRupiahCents, formatMonthYear } from '../resources/js/lib/format.ts';

assert.equal(exactRupiahCents(8500001), 'Rp85.000,01');
assert.equal(exactRupiahCents(999999999999999), 'Rp9.999.999.999.999,99');
assert.equal(exactRupiahCents(1), 'Rp0,01');

assert.equal(exactRupiah('0.00'), 'Rp0,00');
assert.equal(exactRupiah('85000.01'), 'Rp85.000,01');
assert.equal(exactRupiah('9999999999999.99'), 'Rp9.999.999.999.999,99');
assert.equal(exactRupiah('12000000000000.00'), 'Rp12.000.000.000.000,00');
assert.equal(exactRupiah('9007199254740993.10'), 'Rp9.007.199.254.740.993,10');
assert.equal(exactRupiah('1'), 'Rp1,00');
assert.equal(exactRupiah('1.5'), 'Rp1,50');
assert.equal(formatMonthYear('2026-12-01'), 'Desember 2026');
assert.equal(formatMonthYear(null), '-');
