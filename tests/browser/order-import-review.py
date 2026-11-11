# Run in an authenticated local admin browser:
# Get-Content tests/browser/order-import-review.py -Raw | browser-harness
# IMPORT_REVIEW_URL may point to another active draft; this check never saves it.
import base64
import os
from pathlib import Path

url = os.environ.get(
    'IMPORT_REVIEW_URL',
    'http://127.0.0.1:8000/admin/orders/import/3f508d7a-419a-488a-8d50-a66bd9e9ea90',
)
artifacts = Path('.omx/artifacts/visual-ralph/order-import')
artifacts.mkdir(parents=True, exist_ok=True)


def settle():
    cdp('Runtime.evaluate', expression='new Promise(r => setTimeout(r, 350))', awaitPromise=True)


def click_named(name, role='button', prefix=False):
    nodes = cdp('Accessibility.getFullAXTree')['nodes']
    node = next(n for n in nodes if n.get('role', {}).get('value') == role
                and (n.get('name', {}).get('value', '').startswith(name) if prefix
                     else n.get('name', {}).get('value') == name))
    cdp('DOM.scrollIntoViewIfNeeded', backendNodeId=node['backendDOMNodeId'])
    box = cdp('DOM.getBoxModel', backendNodeId=node['backendDOMNodeId'])['model']['content']
    click_at_xy(sum(box[0::2]) / 4, sum(box[1::2]) / 4)
    settle()


def escape():
    for event in ['keyDown', 'keyUp']:
        cdp('Input.dispatchKeyEvent', type=event, key='Escape', code='Escape', windowsVirtualKeyCode=27)
    settle()


def capture(name):
    (artifacts / f'{name}.png').write_bytes(base64.b64decode(cdp('Page.captureScreenshot')['data']))


def navigation_styles():
    return js('''JSON.stringify([
        '.admin-topbar', '.admin-topbar input', '[data-sidebar="sidebar"]',
        '[data-sidebar="header"]', '[data-sidebar="header"] img',
        '[data-sidebar="group-label"]'
    ].map(selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const style = getComputedStyle(element);
        return ['height', 'minHeight', 'padding', 'backgroundColor', 'color',
                'fontFamily', 'fontSize', 'borderRadius'].map(key => style[key]);
    }))''')


def assert_group_colors():
    rows = js('''Array.from(document.querySelectorAll('table tbody tr')).map(row => ({
        code: row.cells[1].innerText.trim(),
        background: getComputedStyle(row).backgroundColor,
        cells: Array.from(row.cells).map(cell => getComputedStyle(cell).backgroundColor),
        errors: Array.from(row.querySelectorAll('td')).filter(cell => cell.querySelector(':scope > p.text-destructive')).map(cell => getComputedStyle(cell).boxShadow)
    }))''')
    colors = {}
    for row in rows:
        assert row['background'] != 'rgba(0, 0, 0, 0)', 'Order rows need an opaque background'
        assert all(color == row['background'] for color in row['cells']), 'Sticky and error cells must retain the group color'
        assert colors.setdefault(row['code'], row['background']) == row['background'], 'Same order must retain its color'
        assert all(shadow != 'none' for shadow in row['errors']), 'Errors must retain a visible outline'
    if len(colors) <= 8:
        assert len(set(colors.values())) == len(colors), 'First eight orders need distinct colors'
    return colors


def assert_page_scroll():
    js('window.scrollTo(0, 0)')
    settle()
    height = js('document.documentElement.scrollHeight')
    assert height > js('innerHeight'), 'Short viewport must exercise page overflow'
    x = js('innerWidth - 24')
    cdp('Input.dispatchMouseEvent', type='mouseWheel', x=x, y=100, deltaX=0, deltaY=height)
    settle()
    assert js('scrollY > 0'), 'Wheel must scroll the page after closing a dialog'
    assert js('document.querySelector("footer").getBoundingClientRect().bottom <= innerHeight + 1'), 'Footer must be reachable'
    cdp('Input.dispatchMouseEvent', type='mouseWheel', x=x, y=100, deltaX=0, deltaY=-height)
    settle()
    assert js('scrollY === 0'), 'Wheel must return to the top'


new_tab(url)
wait_for_load()
cdp('Page.bringToFront')
try:
    cdp('Emulation.setDeviceMetricsOverride', width=1536, height=1181, deviceScaleFactor=1, mobile=False)
    settle()
    assert js('!!document.querySelector(".order-import-page")'), 'Active admin import draft required'
    assert js('getComputedStyle(document.querySelector("h1")).fontFamily.includes("Manrope")')
    assert js('document.querySelector("table tbody tr") !== null'), 'Draft must contain at least one source row'
    import_navigation = navigation_styles()
    js('window.scrollTo(0, 0)')
    desktop_colors = assert_group_colors()
    capture('desktop')

    click_named('Rincian keuangan & berat')
    assert js('document.querySelector("[role=dialog]").innerText.includes("Pembayaran historis")')
    capture('finance')
    escape()
    assert js('document.activeElement.textContent.includes("Rincian keuangan")'), 'Finance focus must return'
    assert assert_group_colors() == desktop_colors, 'Dialog must not change group colors'

    click_named('Detail baris ', prefix=True)
    assert js('document.querySelector("[role=dialog]").innerText.includes("Rencana referensi")')
    capture('detail')
    if js('Array.from(document.querySelectorAll("[role=dialog] button")).some(b => b.textContent.includes("Koreksi baris"))'):
        click_named('Koreksi baris ', prefix=True)
        assert js('!!document.querySelector("[role=tablist]")')
        capture('correction')
        click_named('Customer', role='tab', prefix=True)
        assert js('document.querySelector("[role=tabpanel]:not([hidden])").id === "panel-Customer"')
        for event in ['keyDown', 'keyUp']:
            cdp('Input.dispatchKeyEvent', type=event, key='ArrowRight', code='ArrowRight', windowsVirtualKeyCode=39)
        assert js('document.querySelector("[role=tab][aria-selected=true]").textContent.includes("Buku")')
        escape()
        assert js('document.activeElement.id.startsWith("edit-row-")'), 'Editor focus must return'
    else:
        escape()

    for width in [768, 390]:
        cdp('Emulation.setDeviceMetricsOverride', width=width, height=844, deviceScaleFactor=1, mobile=False)
        settle()
        js('window.scrollTo(0, 0)')
        assert js('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow at {width}px'
        if width < 640:
            assert js('(() => { const h=document.querySelector("article > div"); return h.children[1].getBoundingClientRect().top >= h.children[0].getBoundingClientRect().bottom; })()'), 'Mobile status and total must occupy separate rows'
        js('document.querySelector("[role=region][tabindex]").scrollLeft = 500')
        assert js('(() => { const r=document.querySelector("[role=region][tabindex]").getBoundingClientRect(); const a=document.querySelector("table tbody td:last-child").getBoundingClientRect(); return a.right <= r.right+1 && a.left >= r.left; })()'), 'Actions must remain visible'
        js('document.querySelector("[role=region][tabindex]").scrollLeft = 0')
        assert assert_group_colors() == desktop_colors, 'Mobile must preserve group colors'
        capture(f'viewport-{width}')
        if width < 640:
            js('document.querySelector("article").scrollIntoView({block:"start"})')
            capture('mobile-group')
        click_named('Rincian keuangan & berat')
        assert js('document.querySelector("[role=dialog]").getBoundingClientRect().width <= innerWidth')
        escape()
        if width < 640 and js('!!document.querySelector("button[id^=edit-row-]")'):
            click_named('Koreksi baris ', prefix=True)
            assert js('(() => {const d=document.querySelector("[role=dialog]").getBoundingClientRect(); const b=Array.from(document.querySelectorAll("[role=dialog] button")).find(b=>b.textContent.includes("Simpan perubahan")).getBoundingClientRect(); return b.bottom<=d.bottom && b.top>=d.top;})()'), 'Mobile save action must stay inside the dialog'
            capture('mobile-correction')
            escape()

    click_named('Toggle sidebar')
    assert js('!!document.querySelector("[data-mobile=true]")'), 'Mobile navigation must open'
    escape()
    cdp('Emulation.setDeviceMetricsOverride', width=1536, height=1181, deviceScaleFactor=1, mobile=False)
    cdp('Page.navigate', url='http://127.0.0.1:8000/admin/orders')
    wait_for_load()
    assert navigation_styles() == import_navigation, 'Import sidebar and header must match other admin pages'
    cdp('Page.navigate', url=url)
    wait_for_load()
    cdp('Emulation.setDeviceMetricsOverride', width=1536, height=674, deviceScaleFactor=1, mobile=False)
    settle()
    click_named('Rincian keuangan & berat')
    escape()
    assert_page_scroll()
finally:
    cdp('Emulation.clearDeviceMetricsOverride')
    settle()
print('Import review browser checks passed: desktop, dialogs, keyboard, 768px, 390px, navigation scope, order group colors, short viewport wheel scroll, viewport cleanup. No draft saved.')
