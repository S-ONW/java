const { chromium } = require('playwright-core')
const fs = require('fs')
const OUT = 'D:/workSpace/java/java2-main/shopping-vue/edit_test.log'
const w = (s) => { fs.appendFileSync(OUT, s + '\n') }
fs.writeFileSync(OUT, 'START ' + new Date().toISOString() + '\n')
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); process.stdout.write(s + '\n'); w(s) }
console.log = (...a) => log(...a)

const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-156.0.8078.80/chrome.exe'

;(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  const page = await browser.newPage()

  const logs = []
  page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`[REQFAIL] ${r.url()} ${r.failure()?.errorText}`))

  const step = async (name, fn) => {
    try {
      const r = await fn()
      log('OK  ', name, r !== undefined ? '-> ' + JSON.stringify(r) : '')
      return r
    } catch (e) {
      log('FAIL', name, '->', e.message.split('\n')[0])
      return null
    }
  }

  await step('goto', () => page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 20000 }))
  await step('clear localStorage + reload', async () => {
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'domcontentloaded' })
  })
  await step('click .admin-entry', () => page.locator('.admin-entry').click({ timeout: 8000 }))
  await step('wait login form', () => page.locator('form input').first().waitFor({ timeout: 8000 }))
  await step('fill admin', async () => {
    const inputs = page.locator('form input')
    await inputs.nth(0).fill('admin')
    await inputs.nth(1).fill('admin123')
  })
  await step('submit login', () => page.locator('form button[type="submit"]').click())
  await step('wait admin table', () => page.locator('table tbody tr').first().waitFor({ timeout: 8000 }))

  const before = await step('read first row before', async () => {
    const tr = page.locator('table tbody tr').first()
    return {
      name: (await tr.locator('td.name').innerText()).replace(/\n/g, ' ').trim(),
      price: (await tr.locator('td.price').innerText()).trim(),
    }
  })

  await step('click 编辑 (row1)', () => page.locator('table tbody tr').first().getByRole('button', { name: '编辑' }).click())
  const confirmShown = await step('confirm dialog visible', async () => {
    return await page.getByRole('button', { name: '确认编辑' }).isVisible().catch(() => false)
  })
  await step('click 确认编辑', () => page.getByRole('button', { name: '确认编辑' }).click())
  const formShown = await step('edit form visible', async () => {
    return await page.locator('label.f', { hasText: '商品名称' }).locator('input').isVisible().catch(() => false)
  })
  const nameVal = await step('form name value', async () => {
    return await page.locator('label.f', { hasText: '商品名称' }).locator('input').inputValue()
  })

  await step('change price to 12345', async () => {
    const price = page.locator('label.f', { hasText: '售价' }).locator('input')
    await price.fill('12345')
  })
  await step('click 保存', () => page.getByRole('button', { name: /保存/ }).click())
  await step('wait form closed', async () => {
    await page.waitForFunction(() => !document.querySelector('.mask'), { timeout: 8000 }).catch(() => {})
  })

  const after = await step('read first row after', async () => {
    const tr = page.locator('table tbody tr').first()
    return {
      name: (await tr.locator('td.name').innerText()).replace(/\n/g, ' ').trim(),
      price: (await tr.locator('td.price').innerText()).trim(),
    }
  })

  log('\n=== RESULT ===')
  log('BEFORE:', JSON.stringify(before))
  log('confirmShown:', confirmShown, '| formShown:', formShown, '| formName:', JSON.stringify(nameVal))
  log('AFTER :', JSON.stringify(after))
  log('PRICE_CHANGED:', before && after ? before.price !== after.price : 'n/a')

  log('\n=== CONSOLE / ERRORS (' + logs.length + ') ===')
  logs.forEach((l) => log(l))

  await browser.close()
})().catch((e) => { log('SCRIPT_ERROR ' + e.message); process.exit(1) })
