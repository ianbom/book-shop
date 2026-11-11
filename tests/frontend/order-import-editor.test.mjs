import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(
    new URL(
        '../../resources/js/pages/admin/orders/import.tsx',
        import.meta.url,
    ),
    'utf8',
);
const tree = ts.createSourceFile(
    'import.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
);
let handler;
function visit(node) {
    if (
        ts.isJsxOpeningElement(node) &&
        node.attributes.properties.some(
            (attribute) =>
                ts.isJsxAttribute(attribute) &&
                attribute.name.getText(tree) === 'aria-label' &&
                attribute.initializer?.text ===
                    'Tambahkan kategori dari master',
        )
    ) {
        handler = node.attributes.properties
            .find(
                (attribute) =>
                    ts.isJsxAttribute(attribute) &&
                    attribute.name.getText(tree) === 'onChange',
            )
            .initializer.expression.getText(tree);
    }
    ts.forEachChild(node, visit);
}
visit(tree);
assert.ok(handler, 'Category selector must retain its append handler');
const { outputText } = ts.transpileModule(
    `export default (form) => (${handler});`,
    {
        compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
        },
    },
);
const { default: bind } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const form = {
    data: { data: { categories: ' Bebas ; Novel; ', title: 'Keep title' } },
    setData(key, value) {
        this.data[key] = value;
    },
};
const choose = bind(form);
choose({ target: { value: 'Sejarah' } });
assert.equal(form.data.data.categories, 'Bebas; Novel; Sejarah');
choose({ target: { value: 'novel' } });
assert.equal(form.data.data.categories, 'Bebas; Novel; Sejarah');
choose({ target: { value: '' } });
assert.equal(form.data.data.categories, 'Bebas; Novel; Sejarah');
assert.equal(form.data.data.title, 'Keep title');
form.data.data.categories = '';
choose({ target: { value: 'Novel' } });
assert.equal(form.data.data.categories, 'Novel');
console.log('Order import category append checks passed.');
