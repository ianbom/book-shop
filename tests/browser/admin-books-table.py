# Get-Content tests/browser/admin-books-table.py -Raw | browser-harness
url = 'http://127.0.0.1:8000/admin/books'


def settle():
    cdp('Runtime.evaluate', expression='new Promise(r => setTimeout(r,350))', awaitPromise=True)


def open_page(suffix=''):
    cdp('Page.navigate', url=url + suffix)
    wait_for_load()
    settle()


new_tab(url)
wait_for_load()
cdp('Page.bringToFront')
try:
    assert js('location.pathname') == '/admin/books', 'Authenticated admin required'
    assert js('document.querySelector("table thead th").textContent.trim()') == 'No'
    numbers = js('Array.from(document.querySelectorAll("table tbody tr"), row => Number(row.cells[0].textContent))')
    assert numbers, 'At least one book required'
    assert numbers == list(range(1, len(numbers) + 1))
    assert js('Array.from(document.querySelectorAll("table tbody tr")).every(row => row.cells[1].querySelector("img") && row.cells[1].querySelector("a"))')
    has_next = js('Array.from(document.querySelectorAll("a")).some(a => new URL(a.href).searchParams.get("page") === "2")')
    cdp('DOM.enable')
    js('document.querySelector("table tbody img").scrollIntoView({block:"center"})')
    settle()
    assert js('document.querySelector("table tbody img").naturalWidth > 0'), 'First cover or placeholder must load'
    js('document.querySelector("table tbody img").src = "/__missing_book_cover_for_test__.png"')
    cdp('Runtime.evaluate', expression='new Promise(r => setTimeout(r,700))', awaitPromise=True)
    assert js('(() => {const image = document.querySelector("table tbody img"); return image.src.includes("book-placeholder") && image.naturalWidth > 0;})()'), 'Broken covers must fall back without a loop'
    if has_next:
        open_page('?page=2')
        assert js('Number(document.querySelector("table tbody tr").cells[0].textContent)') == numbers[-1] + 1
    open_page('?search=__no_book_matches_this_test_739__')
    assert js('document.querySelectorAll("table tbody tr").length') == 0
    assert js('document.body.innerText.includes("Buku belum tersedia.")')
    open_page()
    for width in [768, 390]:
        cdp('Emulation.setDeviceMetricsOverride', width=width, height=844, deviceScaleFactor=1, mobile=False)
        settle()
        assert js('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow at {width}px'
        assert js('(() => {const table = document.querySelector("table"); return table.parentElement.scrollWidth > table.parentElement.clientWidth;})()'), 'Narrow table must scroll horizontally'
finally:
    cdp('Emulation.clearDeviceMetricsOverride')
    open_page()
print('Admin book table checks passed: numbers, pagination, thumbnails, broken cover, empty search, mobile. No books changed.')
