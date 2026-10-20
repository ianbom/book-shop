import base64
import json
import os
import tempfile
import time

base_url = os.environ.get('ORDERS_QA_URL', 'http://127.0.0.1:8000')
previous_target = current_tab()
target = new_tab(base_url + '/customer/dashboard/orders')
wait_for_load()
assert '/customer/dashboard/orders' in page_info()['url'], 'Login customer diperlukan.'


def click_control(role, name):
    nodes = cdp('Accessibility.getFullAXTree')['nodes']
    node = next(node for node in nodes if node.get('role', {}).get('value') == role
                and node.get('name', {}).get('value') == name)
    backend_id = node['backendDOMNodeId']
    cdp('DOM.scrollIntoViewIfNeeded', backendNodeId=backend_id)
    points = cdp('DOM.getBoxModel', backendNodeId=backend_id)['model']['content']
    click_at_xy(sum(points[0::2]) / 4, sum(points[1::2]) / 4)


for width in (249, 390, 768, 1440):
    switch_tab(target)
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=844,
        deviceScaleFactor=1, mobile=width < 768)
    time.sleep(0.2)
    metrics = js('''JSON.stringify({
        width: innerWidth,
        content: document.querySelector('main.md\\\\:hidden').getBoundingClientRect().toJSON(),
        table: !!document.querySelector('table').offsetWidth,
        cards: [...document.querySelectorAll('article')].filter(node => node.offsetWidth).length,
        total: document.querySelectorAll('article').length
    })''')
    metrics = json.loads(metrics)
    if width < 768:
        assert metrics['content']['width'] <= metrics['width'] + 1, metrics
        assert not metrics['table'], metrics
        assert metrics['cards'] == metrics['total'], metrics
    else:
        assert metrics['table'] and metrics['cards'] == 0, metrics
    image = cdp('Page.captureScreenshot', format='png', captureBeyondViewport=False)
    path = os.path.join(tempfile.gettempdir(), f'customer-orders-{width}.png')
    with open(path, 'wb') as screenshot:
        screenshot.write(base64.b64decode(image['data']))
    print(path)

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844,
    deviceScaleFactor=1, mobile=True)
click_control('searchbox', 'Cari pesanan atau judul buku')
cdp('Input.insertText', text='Petualangan')
click_control('button', 'Filter')
time.sleep(0.6)
assert js('!!document.querySelector("[role=dialog]")')
assert js('document.querySelector("[role=dialog] input[name=search]").value') == 'Petualangan'
click_control('textbox', 'Kode Preorder')
cdp('Input.insertText', text='QA-PREORDER-NOT-FOUND')
click_control('button', 'Terapkan Filter')
wait_for_load()
time.sleep(0.5)
assert 'pre_order_code=QA-PREORDER-NOT-FOUND' in page_info()['url'], page_info()
assert 'search=Petualangan' in page_info()['url']
assert not js('!!document.querySelector("[role=dialog]")')

click_control('button', 'Packing')
wait_for_load()
time.sleep(0.5)
assert 'status=packing' in page_info()['url']
assert 'pre_order_code=QA-PREORDER-NOT-FOUND' in page_info()['url']
assert 'search=Petualangan' in page_info()['url']

click_control('button', 'Filter')
time.sleep(0.6)
click_control('link', 'Reset Filter')
wait_for_load()
time.sleep(0.5)
assert '?' not in page_info()['url'], page_info()
assert js('document.querySelector("input[type=search]").value') == ''
print('PASS: mobile cards, desktop table, filter sheet, search retention, tabs, reset.')
cdp('Target.closeTarget', targetId=target)
switch_tab(previous_target)
