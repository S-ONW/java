const { chromium } = require('playwright-core')
const fs = require('fs')
const OUT = 'D:/workSpace/java/java2-main/shopping-vue/debug_edit.log'
const w = (s) => { fs.appendFileSync(OUT, s + '\n') }
fs.writeFileSync(OUT, 'START ' + new Date().toISOString() + '\n')
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); process.stdout.write(s + '\n'); w(s) }
console.log = (...a) => log(...a)
const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-156.0.8078.80/chrome.exe'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
  const page = await browser.newPage()
  page.on('pageerror', (e) => log('[PAGEERROR] ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') log('[console.error] ' + m.text()) })

  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('.admin-entry').click()
  await page.locator('form input').first().waitFor()
  await page.locator('form input').nth(0).fill('admin')
  await page.locator('form input').nth(1).fill('admin123')
  await page.locator('form button[type="submit"]').click()
  await page.locator('table tbody tr').first().waitFor()

  const before = await page.locator('table tbody tr').first().locator('td.price').innerText()

  log('STEP click 编辑')
  await page.locator('table tbody tr').first().getByRole('button', { name: '编辑' }).click()
  await page.getByRole('button', { name: '确认编辑' }).waitFor({ timeout: 5000 })
  log('  confirm dialog OK, mask count =', await page.locator('.mask').count())

  log('STEP click 确认编辑')
  await page.getByRole('button', { name: '确认编辑' }).click()
  await page.locator('label.f', { hasText: '商品名称' }).locator('input').waitFor({ timeout: 5000 })
  const formName = await page.locator('label.f', { hasText: '商品名称' }).locator('input').inputValue()
  const formPrice = await page.locator('label.f', { hasText: '售价' }).locator('input').inputValue()
  log('  form opened. name =', JSON.stringify(formName), 'price =', JSON.stringify(formPrice))

  log('STEP change price -> 12345')
  await page.locator('label.f', { hasText: '售价' }).locator('input').fill('12345')

  log('STEP click 保存')
  await page.getByRole('button', { name: /保存/ }).click()
  await page.waitForFunction(() => !document.querySelector('.mask'), { timeout: 8000 }).catch(() => log('  WARN form did not close'))
  const after = await page.locator('table tbody tr').first().locator('td.price').innerText()
  log('  price before =', before, '| after =', after, '| CHANGED =', before !== after)

  // 持久化校验：刷新页面后价格是否还在
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('.admin-entry').click()
  await page.locator('form button[type="submit"]').click().catch(() => {})
  await page.locator('table tbody tr').first().waitFor()
  const afterReload = await page.locator('table tbody tr').first().locator('td.price').innerText()
  log('  price after reload =', afterReload, '| PERSISTED =', afterReload.includes('12345'))

  await browser.close()
})().catch((e) => { log('SCRIPT_ERROR ' + e.message); process.exit(1) })
