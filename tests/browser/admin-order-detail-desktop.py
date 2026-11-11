# Get-Content tests/browser/admin-order-detail-desktop.py -Raw | browser-harness
import base64
from pathlib import Path
from tempfile import gettempdir


def settle():
    cdp('Runtime.evaluate', expression='new Promise(r => setTimeout(r,400))', awaitPromise=True)


def select_tab(label):
    node = next(n for n in cdp('Accessibility.getFullAXTree')['nodes']
                if n.get('role', {}).get('value') == 'tab'
                and n.get('name', {}).get('value') == label)
    cdp('DOM.scrollIntoViewIfNeeded', backendNodeId=node['backendDOMNodeId'])
    box = cdp('DOM.getBoxModel', backendNodeId=node['backendDOMNodeId'])['model']['content']
    click_at_xy(sum(box[0::2]) / 4, sum(box[1::2]) / 4)
    settle()


new_tab('http://127.0.0.1:8000/admin/orders/7')
wait_for_load()
cdp('Page.bringToFront')
output = Path(gettempdir()) / 'book-shop-order-detail-desktop'
output.mkdir(exist_ok=True)
try:
    assert js('location.pathname') == '/admin/orders/7', 'Authenticated admin required'
    assert js('!!document.querySelector(".order-detail-page")'), 'Detail page must load'
    for width in [1440, 1280, 1536]:
        cdp('Emulation.setDeviceMetricsOverride', width=width, height=1200, deviceScaleFactor=1, mobile=False)
        select_tab('Ringkasan')
        assert js('getComputedStyle(document.querySelector("main.order-detail-page")).backgroundColor') == 'rgb(246, 248, 251)'
        assert js('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow at {width}'
        assert js('''(() => {
            const card = name => document.querySelector(`[data-order-panel="${name}"]`).getBoundingClientRect();
            const customer = card('Data pelanggan'), address = card('Alamat pengiriman'), costs = card('Rincian biaya');
            return Math.abs(customer.top - costs.top) < 2 && costs.left > customer.right
                && address.top >= customer.bottom && Math.abs(customer.left - address.left) < 2;
        })()'''), 'Summary must show customer/address left, costs right'
    cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1200, deviceScaleFactor=1, mobile=False)
    for label, key in [('Ringkasan', 'summary'), ('Status', 'status'), ('Produk', 'items'),
                       ('Pembayaran', 'payment'), ('Pengiriman', 'shipping'), ('Riwayat', 'history'), ('Stok', 'stock')]:
        select_tab(label)
        assert js('document.querySelector("[role=tabpanel]").dataset.activeTab') == key
        assert js('document.querySelectorAll("[role=tab][aria-selected=true]").length') == 1
        assert js('document.documentElement.scrollWidth <= innerWidth'), label
        if key == 'status':
            assert js('document.querySelectorAll(".order-detail-progress li").length') == 6
        if key == 'items':
            assert js('Array.from(document.querySelectorAll(".order-detail-item")).every(item => item.querySelector(".order-detail-item-icon") && item.querySelector(".order-detail-item-costs"))')
        metrics = cdp('Page.getLayoutMetrics')['cssContentSize']
        capture = cdp('Page.captureScreenshot', format='png', captureBeyondViewport=True,
                      clip={'x': 0, 'y': 0, 'width': 1440, 'height': metrics['height'], 'scale': 1})
        (output / f'{key}.png').write_bytes(base64.b64decode(capture['data']))
    # Arrow navigation changes the selected tab without submitting a form.
    cdp('Input.dispatchKeyEvent', type='keyDown', key='ArrowRight', code='ArrowRight', windowsVirtualKeyCode=39)
    cdp('Input.dispatchKeyEvent', type='keyUp', key='ArrowRight', code='ArrowRight', windowsVirtualKeyCode=39)
    settle()
    assert js('document.querySelector("[role=tabpanel]").dataset.activeTab') == 'summary'
    for width in [1024, 390]:
        cdp('Emulation.setDeviceMetricsOverride', width=width, height=844, deviceScaleFactor=1, mobile=False)
        settle()
        assert js('Array.from(document.querySelectorAll(".order-detail-desktop")).every(el => getComputedStyle(el).display === "none")')
        assert js('getComputedStyle(document.querySelector(".order-detail-import-notice")).display') == 'block'
        assert js('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow at {width}'
finally:
    cdp('Emulation.clearDeviceMetricsOverride')
print(f'PASS: 7 desktop tabs, summary grid, keyboard navigation, mobile isolation. Screenshots: {output}. No records changed.')
