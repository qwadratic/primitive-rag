// Record scenes.html to a webm with headless Chromium.
// Usage: node record.mjs <seconds> <out-dir>
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const seconds = parseFloat(process.argv[2] || '40')
const outDir = process.argv[3] || 'out'
const here = path.dirname(fileURLToPath(import.meta.url))
const size = { width: 1280, height: 720 }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size } })
const page = await context.newPage()
await page.goto(`file://${here}/scenes.html?d=${seconds}`)
await page.waitForFunction(() => document.title === 'done', null, { timeout: (seconds + 30) * 1000 })
await page.waitForTimeout(300)
const video = page.video()
await context.close()
console.log(await video.path())
await browser.close()
