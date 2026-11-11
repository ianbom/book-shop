# Get-Content tests/browser/admin-orders-table.py -Raw | browser-harness
url = 'http://127.0.0.1:8000/admin/orders'


def settle():
    cdp('Runtime.evaluate', expression='new Promise(r => setTimeout(r,500))', awaitPromise=True)


def click_button(name):
    nodes = cdp('Accessibility.getFullAXTree')['nodes']
    node = next(node for node in nodes if node.get('role', {}).get('value') == 'button'
                and node.get('name', {}).get('value') == name)
    cdp('DOM.scrollIntoViewIfNeeded', backendNodeId=node['backendDOMNodeId'])
    box = cdp('DOM.getBoxModel', backendNodeId=node['backendDOMNodeId'])['model']['content']
    click_at_xy(sum(box[0::2]) / 4, sum(box[1::2]) / 4)
    settle()


def check_actions():
    assert js('''(() => {
        const form = document.querySelector('input[name="pre_order_code"]').form;
        const buttons = Array.from(form.querySelectorAll('button'));
        const reset = buttons.find(button => button.textContent.includes('Reset')).getBoundingClientRect();
        const apply = buttons.find(button => button.textContent.includes('Terapkan Filter')).getBoundingClientRect();
        const bounds = form.getBoundingClientRect();
        return Math.abs(reset.top - apply.top) < 1 && reset.right <= apply.left
            && reset.height === 32 && apply.height === 32
            && reset.left >= bounds.left && apply.right <= bounds.right + 1;
    })()'''), 'Compact filter actions must remain side by side inside the form'


new_tab(url)
wait_for_load()
cdp('Page.bringToFront')
try:
    assert js('location.pathname') == '/admin/orders', 'Authenticated admin required'
    assert js('document.querySelector("table thead th").textContent.trim()') == 'No'
    numbers = js('Array.from(document.querySelectorAll("table tbody tr"), row => Number(row.cells[0].textContent))')
    assert numbers, 'At least one order required'
    assert numbers == list(range(1, len(numbers) + 1))
    has_next = js('Array.from(document.querySelectorAll("a")).some(a => new URL(a.href).searchParams.get("page") === "2")')
    if has_next:
        cdp('Page.navigate', url=url + '?page=2')
        wait_for_load()
        assert js('Number(document.querySelector("table tbody tr").cells[0].textContent)') == numbers[-1] + 1
        cdp('Page.navigate', url=url)
        wait_for_load()
    for width in [1536, 1280, 1024, 768, 390, 320]:
        cdp('Emulation.setDeviceMetricsOverride', width=width, height=844, deviceScaleFactor=1, mobile=False)
        settle()
        check_actions()
        assert js('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow at {width}px'
    cdp('Emulation.clearDeviceMetricsOverride')
    cdp('Page.navigate', url=url)
    wait_for_load()
    search = cdp('DOM.getDocument')['root']['nodeId']
    search = cdp('DOM.querySelector', nodeId=search, selector='form:has(input[name=pre_order_code]) input[name=search]')['nodeId']
    cdp('DOM.scrollIntoViewIfNeeded', nodeId=search)
    cdp('DOM.focus', nodeId=search)
    cdp('Input.insertText', text='__no_order_matches_this_test_739__')
    cdp('Input.dispatchKeyEvent', type='keyDown', key='Enter', code='Enter', windowsVirtualKeyCode=13, text='\r')
    cdp('Input.dispatchKeyEvent', type='keyUp', key='Enter', code='Enter', windowsVirtualKeyCode=13)
    settle()
    assert js('new URL(location.href).searchParams.get("search")') == '__no_order_matches_this_test_739__'
    assert js('document.querySelectorAll("table tbody tr").length') == 0
    click_button('Reset')
    assert js('location.search') == ''
    assert js('Number(document.querySelector("table tbody tr").cells[0].textContent)') == 1
    click_button('Terapkan Filter')
    assert js('Number(document.querySelector("table tbody tr").cells[0].textContent)') == 1
finally:
    cdp('Emulation.clearDeviceMetricsOverride')
    cdp('Page.navigate', url=url)
    wait_for_load()
print('Order table checks passed: numbering, available pagination, compact actions at six widths, Enter, apply, reset, empty search. No orders changed.')
