import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve(process.argv[2])
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
}
const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://l')
  let f = join(ROOT, decodeURIComponent(u.pathname))
  try {
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html')
  } catch {
    res.writeHead(404).end()
    return
  }
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }).end(await readFile(f))
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}`

let failures = 0
let checks = 0
const check = (n, ok, d = '') => {
  checks += 1
  if (!ok) failures += 1
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${n}${d ? ` — ${d}` : ''}`)
}
const browser = await chromium.launch()

// --- Reduced motion ---------------------------------------------------------
console.log('\n[reduced motion] prefers-reduced-motion: reduce')
const rmCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const rm = await rmCtx.newPage()
const rmErrors = []
rm.on('pageerror', (e) => rmErrors.push(e.message))
rm.on('console', (m) => {
  if (m.type() === 'error') rmErrors.push(m.text())
})
await rm.goto(`${base}/`, { waitUntil: 'networkidle' })
await rm.waitForTimeout(2500)

const rmState = await rm.evaluate(() => {
  const dial = document.querySelector('[class*="dial"]')
  const canvas = document.querySelector('canvas')
  const forest = document.querySelector('[class*="forest"]')
  const cs = (n) => (n ? getComputedStyle(n) : null)
  return {
    dialBefore: cs(dial)?.animationName,
    forestBefore: cs(forest)?.animationName,
    canvas: canvas ? canvas.width + 'x' + canvas.height : null,
    datetime: document.querySelector('time')?.getAttribute('datetime'),
  }
})
check('the dial halo stops breathing', rmState.dialBefore === 'none', String(rmState.dialBefore))
check('the backdrop stops drifting', rmState.forestBefore === 'none', String(rmState.forestBefore))
check(
  'the mote canvas is still drawn, just static',
  rmState.canvas === `${1440 * (await rm.evaluate(() => devicePixelRatio))}x${900 * (await rm.evaluate(() => devicePixelRatio))}`,
  String(rmState.canvas),
)

// One frame only: the canvas must not keep changing.
const before = await rm.evaluate(() => document.querySelector('canvas').toDataURL().length)
await rm.waitForTimeout(1600)
const after = await rm.evaluate(() => document.querySelector('canvas').toDataURL().length)
check('the mote field is frozen', before === after, `${before} -> ${after}`)
check('the countdown still ticks', rmState.datetime !== null)

const rmReveal = await rm.evaluate(() => {
  const el = document.querySelector('#scenes [data-visible]')
  return el ? getComputedStyle(el).opacity : 'missing'
})
await rm.locator('#scenes').scrollIntoViewIfNeeded()
await rm.waitForTimeout(400)
const rmReveal2 = await rm.evaluate(() => {
  const el = document.querySelector('#scenes [data-visible]')
  return el ? getComputedStyle(el).opacity : 'missing'
})
check('revealed content is fully opaque', Number(rmReveal2) === 1, `${rmReveal} -> ${rmReveal2}`)
check('no errors under reduced motion', rmErrors.length === 0, rmErrors.join(' | '))

// --- Keyboard ---------------------------------------------------------------
console.log('\n[keyboard] tab order and focus')
const kb = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await kb.newPage()
const kbErrors = []
page.on('pageerror', (e) => kbErrors.push(e.message))
await page.goto(`${base}/`, { waitUntil: 'networkidle' })

const order = []
for (let i = 0; i < 26; i += 1) {
  await page.keyboard.press('Tab')
  order.push(
    await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return 'body'
      return `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 26)}`
    }),
  )
}
check('the skip link comes first', /Skip the countdown/.test(order[0]), order[0])
check('the triptych links are reachable', order.some((o) => /THE GREAT DEKU TREE/i.test(o)), order.slice(1, 5).join(' > '))
check('the gallery/moment links are reachable', order.some((o) => /SEE MORE|BACK TO THE CLOCK/i.test(o)))
check('the ocarina buttons are reachable', order.some((o) => /C-Right|C ▶|Play C-/.test(o)), order.filter((o) => /Play /.test(o)).join(' > '))
check('the engine panel is reachable', order.some((o) => /GO TO MIDNIGHT|BACK TO REAL TIME/i.test(o)), order.filter((o) => /MIDNIGHT|REAL TIME/i.test(o)).join(' > '))
check('focus never gets stuck on the body', order.filter((o) => o === 'body').length <= 1, String(order.filter((o) => o === 'body').length))

// Focus ring visibility.
const ring = await page.evaluate(() => {
  const el = document.querySelector('#song [data-key="a"]')
  el.focus()
  const cs = getComputedStyle(el)
  return { outline: cs.outlineWidth, style: cs.outlineStyle }
})
check('focused buttons get a visible outline', parseFloat(ring.outline) >= 1 && ring.style !== 'none', JSON.stringify(ring))

// The dialog-free keyboard path to the song.
await page.locator('#song [data-key="right"]').focus()
await page.keyboard.press('Enter')
await page.waitForTimeout(150)
const pipAfterEnter = await page.evaluate(() => document.querySelectorAll('#song [data-on="true"]').length)
check('Enter on a focused note button plays it', pipAfterEnter === 1, String(pipAfterEnter))

// Arrow keys must not scroll the page while playing...
await page.locator('#song').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
const scrollBefore = await page.evaluate(() => window.scrollY)
await page.locator('#song [data-key="a"]').focus()
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(120)
const scrollAfter = await page.evaluate(() => window.scrollY)
check('the arrow keys do not scroll the page', scrollBefore === scrollAfter, `${scrollBefore} -> ${scrollAfter}`)

// ...and must not be hijacked anywhere else on the page either.
// A reader who never touched the instrument: no focus inside, panel off screen.
await page.evaluate(() => {
  document.activeElement?.blur()
  window.scrollTo({ top: 0, behavior: 'instant' })
})
await page.waitForTimeout(400)
const farScroll = await page.evaluate(() => window.scrollY)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(500)
const farAfter = await page.evaluate(() => window.scrollY)
check('arrow keys still scroll the page away from the instrument', farAfter > farScroll, `${farScroll} -> ${farAfter}`)
const untouched = await page.evaluate(() => document.querySelectorAll('#song [data-on="true"]').length)
check('and do not play the instrument from elsewhere', untouched === 0, String(untouched))

check('no errors during keyboard walk', kbErrors.length === 0, kbErrors.join(' | '))

// --- Touch targets ----------------------------------------------------------
console.log('\n[touch] target sizes at 390px')
const sm = await kb.newPage()
await sm.setViewportSize({ width: 390, height: 844 })
await sm.goto(`${base}/`, { waitUntil: 'networkidle' })
await sm.locator('#song').scrollIntoViewIfNeeded()
await sm.waitForTimeout(400)
const targets = await sm.evaluate(() =>
  [...document.querySelectorAll('#song button, .rail a, [data-action]')]
    .map((b) => {
      const r = b.getBoundingClientRect()
      return { label: (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().slice(0, 18), w: Math.round(r.width), h: Math.round(r.height) }
    })
    .filter((t) => t.w > 0),
)
const small = targets.filter((t) => t.h < 32 || t.w < 32)
check('every ocarina/console target is at least 32px', small.length === 0, JSON.stringify(small))
check('there are enough targets to judge', targets.length >= 12, String(targets.length))

await browser.close()
server.close()
console.log(`\n${checks - failures}/${checks} checks passed`)
process.exit(failures === 0 ? 0 : 1)
