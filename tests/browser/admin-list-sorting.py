# Get-Content tests/browser/admin-list-sorting.py -Raw | browser-harness
from urllib.parse import urlparse, parse_qs


def settle():
    cdp('Runtime.evaluate', expression='new Promise(r => setTimeout(r,500))', awaitPromise=True)


def click_button(name):
    nodes = cdp('Accessibility.getFullAXTree')['nodes']
    node = next(n for n in nodes if n.get('role', {}).get('value') == 'button'
                and n.get('name', {}).get('value') == name)
    cdp('DOM.scrollIntoViewIfNeeded', backendNodeId=node['backendDOMNodeId'])
    box = cdp('DOM.getBoxModel', backendNodeId=node['backendDOMNodeId'])['model']['content']
    click_at_xy(sum(box[0::2]) / 4, sum(box[1::2]) / 4)
    settle()


new_tab('http://127.0.0.1:8000/admin/books')
wait_for_load()
cdp('Page.bringToFront')
try:
    for page, columns in [
        ('books', [('Buku', 'title'), ('Penulis', 'author'), ('Harga', 'price'), ('Stok', 'stock')]),
        ('orders', [('Order / Campaign', 'order_code'), ('Pelanggan', 'customer_name'),
                    ('Harga Produk', 'subtotal'), ('Ongkir', 'shipping_cost'), ('Total', 'total'),
                    ('Tanggal', 'created_at'), ('ETA', 'eta')]),
    ]:
        status = 'active' if page == 'books' else 'pending'
        cdp('Page.navigate', url=f'http://127.0.0.1:8000/admin/{page}?status={status}')
        wait_for_load()
        settle()
        assert js('location.pathname') == f'/admin/{page}', 'Authenticated admin required'
        for label, key in columns:
            for direction, aria in [('asc', 'ascending'), ('desc', 'descending')]:
                click_button(label)
                query = parse_qs(urlparse(js('location.href')).query)
                assert query['sort'] == [key] and query['direction'] == [direction], (page, label, query)
                assert query['status'] == [status], 'Sorting must preserve filters'
                assert 'page' not in query, 'Sorting must return to page one'
                assert js('document.querySelector("th[aria-sort]").getAttribute("aria-sort")') == aria
        click_button('Terapkan Filter')
        query = parse_qs(urlparse(js('location.href')).query)
        assert query['sort'] == [columns[-1][1]] and query['direction'] == ['desc']
        if page == 'orders':
            nodes = cdp('Accessibility.getFullAXTree')['nodes']
            tab = next(n for n in nodes if n.get('role', {}).get('value') == 'tab'
                       and n.get('name', {}).get('value', '').startswith('Semua'))
            cdp('DOM.scrollIntoViewIfNeeded', backendNodeId=tab['backendDOMNodeId'])
            box = cdp('DOM.getBoxModel', backendNodeId=tab['backendDOMNodeId'])['model']['content']
            click_at_xy(sum(box[0::2]) / 4, sum(box[1::2]) / 4)
            settle()
            assert parse_qs(urlparse(js('location.href')).query)['sort'] == ['eta']
        for width in [768, 390, 320]:
            cdp('Emulation.setDeviceMetricsOverride', width=width, height=844, deviceScaleFactor=1, mobile=False)
            settle()
            assert js('document.documentElement.scrollWidth <= innerWidth'), (page, width)
            assert js('document.querySelector("table").parentElement.scrollWidth > document.querySelector("table").parentElement.clientWidth')
        cdp('Emulation.clearDeviceMetricsOverride')
        click_button('Reset')
        query = parse_qs(urlparse(js('location.href')).query)
        assert 'sort' not in query and 'direction' not in query and 'status' not in query
finally:
    cdp('Emulation.clearDeviceMetricsOverride')
print('PASS: 11 sortable headers, both directions, aria-sort, filter submit, status tabs, reset, mobile. No records changed.')
