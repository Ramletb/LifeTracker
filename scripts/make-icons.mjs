// One-time icon rasterizer: renders public/icons/icon.svg to the PNG sizes
// the PWA manifest needs, using the locally installed Chromium.
// Run: node scripts/make-icons.mjs
import { chromium } from 'playwright-core'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const fallbackChromium = '/opt/pw-browsers/chromium'
const executablePath =
  process.env.CHROMIUM_PATH ??
  (existsSync(fallbackChromium) ? fallbackChromium : undefined)

const svg = readFileSync(resolve('public/icons/icon.svg'), 'utf8')
const maskableSvg = svg.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0e6b5e"/><g transform="translate(51.2 51.2) scale(0.8)">'
).replace('</svg>', '</g></svg>')

const targets = [
  { name: 'icon-192.png', size: 192, svg },
  { name: 'icon-512.png', size: 512, svg },
  { name: 'icon-maskable-512.png', size: 512, svg: maskableSvg },
  { name: 'apple-touch-icon.png', size: 180, svg }
]

const browser = await chromium.launch({ executablePath })
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(
    `<style>*{margin:0}svg{display:block;width:${t.size}px;height:${t.size}px}</style>${t.svg}`
  )
  const buf = await page.screenshot({ omitBackground: true })
  writeFileSync(resolve(`public/icons/${t.name}`), buf)
  console.log(`wrote public/icons/${t.name}`)
}
await browser.close()
