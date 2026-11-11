import { chromium } from 'playwright-core'
const B = 'http://localhost:8081'
const OUT = 'D:/tmp/reg/'
const browser = await chromium.launch()

async function page(name, url, { w = 1280, h = 900, theme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await ctx.addInitScript((t) => { localStorage.setItem('shopTheme', JSON.stringify(t)) }, theme)
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
  await p.waitForTimeout(700)
  await p.screenshot({ path: OUT + name + '.png' })
  await ctx.close()
  console.log('shot', name)
}

await page('reg-L', B + '/#register')
await page('login-L', B + '/#login')
await page('html-L', B + '/register.html')
await page('html-M', B + '/register.html', { w: 420, h: 900 })
await browser.close()
