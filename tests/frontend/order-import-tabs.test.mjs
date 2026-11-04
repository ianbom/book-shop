import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../../resources/js/pages/admin/orders/import.tsx', import.meta.url), 'utf8');
const tree = ts.createSourceFile('import.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map();
function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && ['sections', 'known', 'others', 'references', 'tabs', 'hasError', 'mappedErrors', 'otherErrors'].includes(node.name.text)) {
        declarations.set(node.name.text, node.initializer.getText(tree));
    }
    ts.forEachChild(node, visit);
}
visit(tree);
const names = ['sections', 'known', 'others', 'references', 'tabs', 'hasError', 'mappedErrors', 'otherErrors'];
for (const name of names) assert.ok(declarations.has(name), `Missing ${name}`);
const code = `export default (fields, row, form) => { ${names.map((name) => `const ${name} = ${declarations.get(name)};`).join('\n')} return { tabs, hasError, otherErrors }; }`;
const { outputText } = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { default: calculate } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const row = { book: null, references: [{ key: 'category:1', error: 'Pilih referensi' }], errors: { email: ['Email salah'], extra: ['Kolom salah'], unknown: ['Kesalahan lain'] } };
const form = { errors: { 'data.unit_price': 'Harga salah' } };
const { tabs, hasError, otherErrors } = calculate(['order_code', 'email', 'title', 'unit_price', 'extra'], row, form);
assert.deepEqual(tabs.map((tab) => tab.title), ['Pesanan', 'Customer', 'Buku', 'Pembayaran', 'Lainnya', 'Referensi']);
assert.deepEqual(tabs.map(hasError), [false, true, false, true, true, true]);
assert.deepEqual(otherErrors, [['unknown', ['Kesalahan lain']]]);
console.log('Order import tab checks passed.');
