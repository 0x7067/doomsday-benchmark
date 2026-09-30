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
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let file = join(ROOT, decodeURIComponent(url.pathname))
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
  } catch {
    res.writeHead(404).end('not found')
    return
  }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('not found')
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

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

const requests = []
page.on('request', (r) => requests.push(r.url()))

const readClock = () =>
  page.evaluate(() => {
    const times = [...document.querySelectorAll('time')]
    return {
      count: times.length,
      datetime: times[0]?.getAttribute('datetime') ?? null,
      digits: [...document.querySelectorAll('time [data-value]')].map((n) => n.textContent),
      title: document.title,
    }
  })

const ISO = /^(P(?!$)(\d+D)?T(?!$)(\d+H)?(\d+M)?(\d+S)?|PT0S)$/

// --- 1. Real time -----------------------------------------------------------
console.log('\n[1] real time')
await page.goto(`${base}/`, { waitUntil: 'networkidle' })
let a = await readClock()
check('exactly one <time> element', a.count === 1, `found ${a.count}`)
check('datetime is an ISO 8601 duration', ISO.test(a.datetime ?? ''), a.datetime)
check('day field is 3 digits', /^\d{3}$/.test(a.digits[0] ?? ''), a.digits.join(' '))
check('digits are 3/2/2/2', (a.digits.join('').length ?? 0) === 9, a.digits.join(' '))
const first = a.datetime
await page.waitForTimeout(2100)
const b = await readClock()
check('datetime advances every second', first !== b.datetime, `${first} -> ${b.datetime}`)
check('no negative numbers in the digits', !b.digits.some((d) => d.includes('-')), b.digits.join(' '))
check('title reflects the countdown', /T-minus/.test(b.title), b.title)

// The breakdown floors days and carries the remainder into hours, so this is
// the floor of the remaining days, not the ceiling.
const expectedDays = Math.floor(
  (Date.parse('2026-11-05T00:00:00-05:00') - Date.now()) / 86_400_000,
)
check(
  'day count is plausible',
  Math.abs(Number(b.digits[0]) - expectedDays) <= 1,
  `showing ${b.digits[0]}, expected ~${expectedDays}`,
)

// --- 2. ?now= ten seconds out ---------------------------------------------
console.log('\n[2] ?now=2026-11-04T23:59:50-05:00  (10 seconds left)')
await page.goto(`${base}/?now=2026-11-04T23:59:50-05:00`, { waitUntil: 'domcontentloaded' })
const c = await readClock()
check('shows 10 seconds on arrival', c.digits.join('') === '000000010', c.digits.join(' '))
check('datetime reads PT10S', c.datetime === 'PT10S', c.datetime)

await page.waitForTimeout(3100)
const d = await readClock()
check('has counted down after ~3s', d.digits.join('') === '000000007', d.digits.join(' '))
check('datetime follows the seconds', d.datetime === 'PT7S', d.datetime)

// Reach zero, exactly 10s after load.
await page.waitForTimeout(7200)
const e = await readClock()
check('reaches zero and holds', e.digits.join('') === '000000000', e.digits.join(' '))
check('datetime reads PT0S at zero', e.datetime === 'PT0S', e.datetime)

await page.waitForTimeout(2500)
const f = await readClock()
check('stays at zero, never negative', f.datetime === 'PT0S' && f.digits.join('') === '000000000', `${f.datetime} ${f.digits.join(' ')}`)
check('arrival title is applied', /Out now/.test(f.title), f.title)

// --- 3. A multi-day breakdown ---------------------------------------------
console.log('\n[3] ?now= well out')
await page.goto(`${base}/?now=2026-09-20T12:00:00-04:00`, { waitUntil: 'domcontentloaded' })
const g = await readClock()
const gd = Number(g.digits[0])
const gh = Number(g.digits[1])
check('days look right for 2026-09-20', gd === 45, `${g.digits.join(' ')} (expected 45 days)`)
// ISO 8601 omits zero components, so P45DT13H is as correct as P45DT13H00M00S.
check(
  'datetime is P<d>DT<h>H with optional M/S',
  new RegExp(`^P${gd}DT${String(gh).padStart(2, '0')}H(\\d{2}M)?(\\d{2}S)?$`).test(g.datetime ?? ''),
  g.datetime,
)

// --- 4. The moment, exactly ------------------------------------------------
console.log('\n[4] ?now= exactly the moment')
await page.goto(`${base}/?now=2026-11-05T00:00:00-05:00`, { waitUntil: 'networkidle' })
const h = await readClock()
check('zero, immediately', h.digits.join('') === '000000000', h.digits.join(' '))
check('PT0S', h.datetime === 'PT0S', h.datetime)

// --- 5. Garbage input -------------------------------------------------------
console.log('\n[5] robustness')
await page.goto(`${base}/?now=not-a-timestamp`, { waitUntil: 'domcontentloaded' })
const i = await readClock()
check('invalid ?now falls back to real time', /^P\d/.test(i.datetime ?? ''), i.datetime)
await page.goto(`${base}/?now=`, { waitUntil: 'domcontentloaded' })
const j = await readClock()
check('empty ?now falls back to real time', /^P\d/.test(j.datetime ?? ''), j.datetime)

// --- 6. Offline ------------------------------------------------------------
console.log('\n[6] offline')
const off = await context.newPage()
const offRequests = []
off.on('request', (r) => offRequests.push(r.url()))
const external = []
off.on('request', (r) => {
  const u = r.url()
  if (!u.startsWith('http://localhost') && !u.startsWith('data:') && !u.startsWith('blob:')) {
    external.push(u)
  }
})
await off.goto(`${base}/`, { waitUntil: 'networkidle' })
await off.waitForTimeout(1500)
check('no cross-origin requests', external.length === 0, external.join(', '))
const fonts = await off.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`))
check('all three families loaded', ['Cinzel', 'Archivo', 'Barlow Condensed'].every((f) => fonts.some((x) => x.startsWith(f))), fonts.join(' | '))
const imgs = await off.evaluate(() =>
  [...document.querySelectorAll('img')].map((i) => ({ src: i.currentSrc.split('/').pop(), w: i.naturalWidth })),
)
check('every image decoded', imgs.length > 0 && imgs.every((i) => i.w > 0), JSON.stringify(imgs))

// --- 6b. Blurred placeholders stand in for a missing image ----------------
console.log('\n[6b] placeholders')
const blocked = await context.newPage()
await blocked.route('**/poster-900*', (route) => route.abort())
await blocked.route('**/forest-1920*', (route) => route.abort())
await blocked.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
await blocked.waitForTimeout(1200)
const plate = await blocked.evaluate(() => {
  const el = document.querySelector('#scenes [class*="plate"]')
  const img = el?.querySelector('img')
  return {
    background: getComputedStyle(el).backgroundImage.slice(0, 40),
    imageFailed: img ? img.naturalWidth === 0 : 'no img',
  }
})
check('a plate keeps a placeholder when its image fails', plate.background.startsWith('url("data:image/webp'), plate.background)
check('the failure is real, not a timing artefact', plate.imageFailed === true, String(plate.imageFailed))
const stillLegible = await blocked.evaluate(
  () => document.querySelector('#scenes figcaption')?.textContent?.trim().slice(0, 20) ?? '',
)
check('captions still read with no image at all', /Kokiri/i.test(stillLegible), stillLegible)
await blocked.close()

// --- 7. Overflow at every width -------------------------------------------
console.log('\n[7] layout')
for (const width of [360, 390, 414, 480, 640, 768, 900, 1024, 1280, 1440, 1920]) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  check(`no horizontal overflow at ${width}px`, overflow.scroll <= overflow.client + 1, `${overflow.scroll} > ${overflow.client}`)
}

// --- 8. Accessibility basics ----------------------------------------------
console.log('\n[8] semantics')
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(`${base}/`, { waitUntil: 'networkidle' })
const a11y = await page.evaluate(() => ({
  h1: document.querySelectorAll('h1').length,
  h2: document.querySelectorAll('h2').length,
  landmarks: document.querySelectorAll('main, footer, nav').length,
  live: document.querySelectorAll('[role="status"]').length,
  imgNoAlt: [...document.querySelectorAll('img')].filter((i) => i.alt === null || i.alt === undefined).length,
  lang: document.documentElement.lang,
}))
check('exactly one h1', a11y.h1 === 1, String(a11y.h1))
check('several h2 section headings', a11y.h2 >= 3, String(a11y.h2))
check('main/footer/nav present', a11y.landmarks >= 3, String(a11y.landmarks))
check('no img missing alt', a11y.imgNoAlt === 0, String(a11y.imgNoAlt))
check('lang is set', a11y.lang === 'en', a11y.lang)

console.log('\n[9] console')
check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '))

await browser.close()
server.close()

console.log(`\n${checks - failures}/${checks} checks passed`)
process.exit(failures === 0 ? 0 : 1)
