import json
import os
import time

base_url = os.environ.get('WALLETS_QA_URL', 'http://127.0.0.1:8000')
previous_target = current_tab()
target = new_tab(base_url + '/customer/dashboard/wallets')
wait_for_load()
assert '/customer/dashboard/wallets' in page_info()['url'], 'Login customer diperlukan.'

for width in (320, 390, 768, 1440):
    switch_tab(target)
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=844,
        deviceScaleFactor=1, mobile=width < 768)
    time.sleep(0.3)
    state = json.loads(js('''JSON.stringify({
        overflow: document.documentElement.scrollWidth > innerWidth,
        panels: [...document.querySelectorAll('[role=tabpanel]')].map(node => node.getBoundingClientRect().height > 0),
        tables: [...document.querySelectorAll('table')].filter(node => node.offsetWidth).length
    })'''))
    assert not state['overflow'], state
    if width < 768:
        assert state['panels'] == [True, False] and state['tables'] == 0, state
    else:
        assert state['panels'] == [True, True] and state['tables'] == 2, state

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844,
    deviceScaleFactor=1, mobile=True)
js('document.querySelector("#wallet-tab-transactions").click()')
assert js('document.querySelector("#wallet-panel-transactions").getBoundingClientRect().height > 0')
js('document.querySelector("#wallet-tab-topups").click()')
js('''[...document.querySelectorAll('button')].find(node => node.innerText.includes('Lihat Detail'))?.click()''')
time.sleep(0.4)
proof = json.loads(js('''JSON.stringify({
    open: !!document.querySelector('[role=dialog]'),
    loaded: (document.querySelector('[role=dialog] img')?.naturalWidth ?? 0) > 0,
    overflow: document.documentElement.scrollWidth > innerWidth
})'''))
assert proof['open'] and proof['loaded'] and not proof['overflow'], proof
print('PASS: wallet tabs, mobile cards, desktop tables, proof detail, no horizontal overflow.')
cdp('Target.closeTarget', targetId=target)
switch_tab(previous_target)
