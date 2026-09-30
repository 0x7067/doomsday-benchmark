import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve(process.argv[2])
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let file = join(ROOT, decodeURIComponent(url.pathname))
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
  } catch {
    res.writeHead(404).end('nope')
    return
  }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('nope')
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}`

let failures = 0
let checks = 0
const check = (name, ok, detail = '') => {
  checks += 1
  if (!ok) failures += 1
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

// Track the Web Audio graph so we can prove sound is actually synthesised.
await context.addInitScript(() => {
  window.__audio = { oscillators: 0, contexts: 0, convolvers: 0 }
  const AudioContextCtor = window.AudioContext
  window.AudioContext = class extends AudioContextCtor {
    constructor(...args) {
      super(...args)
      window.__audio.contexts += 1
      const createOscillator = this.createOscillator.bind(this)
      this.createOscillator = () => {
        window.__audio.oscillators += 1
        return createOscillator()
      }
      const createConvolver = this.createConvolver.bind(this)
      this.createConvolver = () => {
        window.__audio.convolvers += 1
        return createConvolver()
      }
    }
  }
})

console.log('\n[ocarina] the Song of Time')
await page.goto(`${base}/`, { waitUntil: 'networkidle' })

const state = () =>
  page.evaluate(() => {
    const section = document.querySelector('#song')
    return {
      door: section?.getAttribute('data-door'),
      readout: section?.querySelector('[data-readout]')?.textContent,
      pipsOn: section?.querySelectorAll('[data-on="true"]').length,
      pageDoor: document.documentElement.dataset.door,
      triforce: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
      audio: window.__audio,
    }
  })

await page.locator('#song').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)

const before = await state()
check('starts shut', before.door === 'shut', String(before.door))
check('no AudioContext before any gesture', before.audio.contexts === 0, JSON.stringify(before.audio))

// Wrong note first: it should reset, not lock.
await page.getByRole('button', { name: 'Play C-Left' }).click()
await page.waitForTimeout(200)
const wrong = await state()
check('a wrong note opens no pips', wrong.pipsOn === 0, String(wrong.pipsOn))
check('a wrong note does not open the door', wrong.door === 'shut')
check('a note created the audio graph', wrong.audio.contexts === 1, JSON.stringify(wrong.audio))
check('the note used oscillators', wrong.audio.oscillators >= 5, String(wrong.audio.oscillators))
check('a plate reverb was built', wrong.audio.convolvers === 1, String(wrong.audio.convolvers))

// The real thing, by keyboard.
for (const key of ['ArrowRight', 'KeyA', 'ArrowDown', 'ArrowRight', 'KeyA', 'ArrowDown']) {
  await page.keyboard.press(key)
  await page.waitForTimeout(90)
}
await page.waitForTimeout(400)
const open = await state()
check('the Song of Time opens the door', open.door === 'open', String(open.door))
check('the page-level door flag follows', open.pageDoor === 'open', String(open.pageDoor))
check('readout announces the door', /open/i.test(open.readout ?? ''), JSON.stringify(open.readout))
check('reward chord stacked oscillators', open.audio.oscillators > wrong.audio.oscillators, `${wrong.audio.oscillators} -> ${open.audio.oscillators}`)

const trifo = await page.evaluate(() => {
  const dial = document.querySelector('svg path[class*="triforce"]')
  return dial ? getComputedStyle(dial).fill : 'missing'
})
check('the dial Triforce ignites', /navi|rgb\(1[0-9][0-9], 2[0-9][0-9]/.test(trifo), trifo)

// Wrong pitch, right order: should not open, and should say why.
await page.getByRole('button', { name: 'Close the door' }).click()
await page.getByRole('button', { name: /E5/ }).click()
for (const key of ['ArrowRight', 'KeyA', 'ArrowDown', 'ArrowRight', 'KeyA', 'ArrowDown']) {
  await page.keyboard.press(key)
  await page.waitForTimeout(80)
}
const transposed = await state()
check('the tune does not open the door when transposed', transposed.door === 'shut', String(transposed.door))
const pitchNote = await page.evaluate(() => document.querySelector('#song [data-readout]')?.textContent)
check('the readout explains the pitch fault', /wrong tuning/i.test(pitchNote ?? ''), pitchNote)

// Back to the right tuning, and the tune works again.
await page.getByRole('button', { name: /^A4/ }).click()
for (const key of ['ArrowRight', 'KeyA', 'ArrowDown', 'ArrowRight', 'KeyA', 'ArrowDown']) {
  await page.keyboard.press(key)
  await page.waitForTimeout(80)
}
check('retuning to A4 re-opens the door', (await state()).door === 'open')
await page.getByRole('button', { name: 'Close the door' }).click()
await page.waitForTimeout(150)

// Hint button walks the keys.
await page.getByRole('button', { name: 'Play the tune' }).click()
await page.waitForTimeout(700)
const hinting = await page.evaluate(() => document.querySelectorAll('#song [data-active="true"]').length)
check('the hint lights a key', hinting === 1, String(hinting))
await page.waitForTimeout(3200)
const hintDone = await page.evaluate(() =>
  document.querySelector('#song')?.querySelectorAll('[data-on="true"]').length,
)
check('the hint resets the pips', hintDone === 0, String(hintDone))

// Sound toggle.
await page.getByRole('button', { name: 'Sound on' }).click()
const muted = await page.evaluate(
  () => document.querySelector('#song [data-action="sound"]')?.textContent,
)
check('sound can be muted', muted === 'Sound off', String(muted))

console.log('\n[engine room] time travel')
await page.locator('#engine-heading').scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
const clockNow = () => page.evaluate(() => document.querySelector('time')?.getAttribute('datetime'))

const far = await clockNow()
await page.getByRole('button', { name: /−30 sec/ }).click()
await page.waitForTimeout(300)
const near = await clockNow()
check('a preset moves the clock', far !== near, `${far} -> ${near}`)
check('the preset lands on PT30S', near === 'PT30S', String(near))
check('the URL is untouched', !page.url().includes('now='), page.url())

await page.getByRole('button', { name: 'Go to midnight' }).click()
await page.waitForTimeout(400)
const zero = await clockNow()
check('go to midnight lands on PT0S', zero === 'PT0S', String(zero))
const arrived = await page.evaluate(() => document.querySelector('[data-arrived]')?.getAttribute('data-arrived'))
check('the hero flips to its arrival state', arrived === 'true', String(arrived))

await page.getByRole('button', { name: 'Back to real time' }).click()
await page.waitForTimeout(300)
const back = await clockNow()
check('reset returns to real time', /^P3[0-9]D/.test(back ?? ''), String(back))

// The scrubber.
const slider = page.locator('#scrub')
await slider.focus()
for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowLeft')
await page.waitForTimeout(250)
const scrubbed = await clockNow()
check('the scrubber moves the clock', scrubbed !== back, `${back} -> ${scrubbed}`)
const simText = await page.locator('[data-simulated]').first().textContent().catch(() => '')
check('the panel admits it is simulating', /Previewing|pinned/i.test(simText ?? ''), simText?.slice(0, 60))

// Copy to clipboard.
await context.grantPermissions(['clipboard-read', 'clipboard-write'])
await page.getByRole('button', { name: /Copy the countdown/ }).click()
await page.waitForTimeout(300)
const clip = await page.evaluate(() => navigator.clipboard.readText())
check('copy puts a sentence and a clean URL on the clipboard', /Nintendo Switch 2/.test(clip) && !clip.includes('now='), clip.replace(/\n/g, ' | '))

console.log('\n[console]')
check('no console errors', errors.length === 0, errors.join(' | '))

await browser.close()
server.close()
console.log(`\n${checks - failures}/${checks} checks passed`)
process.exit(failures === 0 ? 0 : 1)
