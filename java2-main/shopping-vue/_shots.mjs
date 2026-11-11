import { chromium } from 'playwright-core'
const B = 'http://localhost:8081'
const OUT = 'D:/tmp/mascot/'
const browser = await chromium.launch()

async function run(theme, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
  await ctx.addInitScript((t) => {
    localStorage.setItem('shopUser', JSON.stringify({ name: 'demo', nick: 'demo', email: 'demo@shop.local', permission: 1 }))
    localStorage.setItem('shopTheme', t)
  }, theme)
  const p = await ctx.newPage()
  await p.goto(B + '/#home', { waitUntil: 'networkidle' })
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
  await p.waitForTimeout(300)
  await p.locator('button[title="购物车"]').click()
  await p.waitForTimeout(700)
  await p.locator('.drawer.open').screenshot({ path: OUT + `cart-${tag}.png` })
  await p.locator('.drawer.open .close').click()
  await p.waitForTimeout(400)
  // 空搜索
  const s = p.locator('.search input').first()
  await s.fill('zzzz不存在')
  await s.press('Enter')
  await p.waitForTimeout(600)
  await p.screenshot({ path: OUT + `empty-${tag}.png` })
  await ctx.close()
}
await run('light', 'L')
await run('dark', 'D')
await browser.close()
console.log('final shots ok')
