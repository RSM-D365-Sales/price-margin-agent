/**
 * Quick page screenshots for checking the app before recording.
 *   node demo-kit/shot.mjs [--base http://localhost:5199] [--full]
 * Writes demo-kit/out/check-*.png (1920×1080, same viewport as the recording;
 * --full captures the whole scrolling page instead).
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = (process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:5199').replace(/\/$/, '')
const FULL = process.argv.includes('--full')
const OUT = join(here, 'out')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chromium' })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const shots = [
  ['overview', '/#/'],
  ['overrides', '/#/overrides'],
  ['threshold-test', '/#/threshold-test'],
  ['price-updates', '/#/price-updates'],
  ['price-history', '/#/price-history'],
  ['recommendations', '/#/recommendations'],
  ['setup', '/#/setup'],
]
for (const [name, path] of shots) {
  await page.goto(BASE + path, { waitUntil: 'load' })
  await page.locator('h1').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  const file = join(OUT, `check-${name}.png`)
  await page.screenshot({ path: file, fullPage: FULL })
  console.log('→', file)
}
await browser.close()
