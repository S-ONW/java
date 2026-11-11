import { chromium } from 'playwright-core'
import fs from 'node:fs'

const OUT = 'D:/tmp/layout'
fs.mkdirSync(OUT, { recursive: true })
const B = 'http://localhost:8081'

const browser = await chromium.launch({ channel: 'msedge' })
  .catch(() => chromium.launch({ channel: 'chrome' }))
  .catch(() => chromium.launch())

async function shot(name, url, { w = 1280, h = 900, click } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  if (click) {
    await p.click(click)
    await p.waitForTimeout(600)
  }
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  const catNav = await p.locator('.cat-nav').count()
  console.log(name, '-> cat-nav:', catNav, '| hash:', await p.evaluate(() => location.hash))
  await ctx.close()
}

await shot('login', `${B}/index.html#login`)
await shot('login-logo-click', `${B}/index.html#login`, { click: '.logo' })
await shot('register', `${B}/index.html`)
await shot('register-html', `${B}/register.html`)
await shot('login-m', `${B}/index.html#login`, { w: 390, h: 844 })
await shot('register-html-m', `${B}/register.html`, { w: 390, h: 844 })
await shot('home', `${B}/index.html#home`)

await browser.close()
