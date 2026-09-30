import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { parseIsoDuration } from '../time.ts'
import { startVite } from '../vite-server.ts'

/*
 * Loads the production build in Chromium at fixed moments (via `?now=`) and
 * viewports. It checks the countdown contract from the brief and captures the
 * screenshots the experience judge looks at.
 */

export interface Capture {
  file: string
  caption: string
}

export interface MomentCheck {
  moment: string
  viewport: string
  now: string
  /** Every `<time>` whose `datetime` looks like a duration; the brief asks for exactly one. */
  durations: string[]
  expectedSeconds: number
  actualSeconds: number | null
  correct: boolean
  horizontalOverflow: boolean
}

export interface ExperienceReport {
  /** Null when the build could be served; otherwise why not. */
  error: string | null
  moments: MomentCheck[]
  ticks: { firstSeconds: number | null; secondSeconds: number | null; ok: boolean }
  reachesZero: { actualSeconds: number | null; ok: boolean }
  consoleErrors: string[]
  externalRequests: string[]
  interactiveElements: number
  captures: Capture[]
}

const DAY = 86_400
const MOMENTS = [
  { id: 'weeks-out', label: '37 days out', offsetSeconds: -(37 * DAY + 11 * 3_600 + 10 * 60 + 5) },
  { id: 'final-hour', label: '42 minutes out', offsetSeconds: -(42 * 60 + 17) },
  { id: 'final-seconds', label: '8 seconds out', offsetSeconds: -8 },
  { id: 'arrived', label: '3 hours after the moment', offsetSeconds: 3 * 3_600 },
]
const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 390, height: 844 },
]
const DESKTOP = VIEWPORTS[0]
type Moment = (typeof MOMENTS)[number]
type Viewport = (typeof VIEWPORTS)[number]

const SETTLE_MS = 1_500
const ARRIVAL_LEAD_SECONDS = 4
const ARRIVAL_CHECK_AFTER_SECONDS = 2
const MAX_CLICKED_ELEMENTS = 5
const INTERACTIVE = 'button, a[href], [role="button"], summary, input, select, textarea, [tabindex]:not([tabindex="-1"])'

export async function checkExperience(appDir: string, captureDir: string, target: string): Promise<ExperienceReport> {
  const report: ExperienceReport = {
    error: null,
    moments: [],
    ticks: { firstSeconds: null, secondSeconds: null, ok: false },
    reachesZero: { actualSeconds: null, ok: false },
    consoleErrors: [],
    externalRequests: [],
    interactiveElements: 0,
    captures: [],
  }
  if (!fs.existsSync(path.join(appDir, 'dist', 'index.html'))) {
    return { ...report, error: 'No production build (dist/index.html) to serve' }
  }
  fs.mkdirSync(captureDir, { recursive: true })

  const server = await startVite(appDir, 'preview')
  const browser = await chromium.launch()
  try {
    const session = new Session(browser, server.url, captureDir, report)
    const urlAt = (offsetSeconds: number) => `${server.url}/?now=${new Date(Date.parse(target) + offsetSeconds * 1000).toISOString()}`
    for (const viewport of VIEWPORTS) {
      for (const moment of MOMENTS) await checkMoment(session, viewport, moment, urlAt(moment.offsetSeconds))
    }
    await checkArrival(session, urlAt(-ARRIVAL_LEAD_SECONDS))
    await exploreInteractions(session, urlAt(MOMENTS[0].offsetSeconds))
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error)
  } finally {
    await browser.close()
    await server.stop()
  }
  report.consoleErrors = [...new Set(report.consoleErrors)]
  report.externalRequests = [...new Set(report.externalRequests)]
  return report
}

async function checkMoment(session: Session, viewport: Viewport, moment: Moment, url: string): Promise<void> {
  const page = await session.open(viewport)
  const startedAt = Date.now()
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)
  const durations = await readDurations(page)
  const elapsed = (Date.now() - startedAt) / 1000
  const actualSeconds = durations.length === 1 ? parseIsoDuration(durations[0]) : null
  // The page picks up `now` somewhere between navigation and this read.
  const latest = Math.max(0, -moment.offsetSeconds)
  const earliest = Math.max(0, -moment.offsetSeconds - elapsed)
  session.report.moments.push({
    moment: moment.id,
    viewport: viewport.id,
    now: new URL(url).searchParams.get('now') ?? '',
    durations,
    expectedSeconds: Math.round(latest),
    actualSeconds,
    correct: actualSeconds !== null && actualSeconds >= earliest - 1.5 && actualSeconds <= latest + 1,
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  })

  const fullPage = moment.id === 'weeks-out'
  const caption = `${moment.label}, ${viewport.id} ${viewport.width}px${fullPage ? ', full page' : ''}`
  await session.capture(page, `${moment.id}-${viewport.id}`, caption, fullPage)
  if (moment.id === 'weeks-out' && viewport.id === 'desktop') await checkTicksAndMotion(session, page)
  await page.close()
}

/** Loads the page just before zero and checks it lands on zero rather than going negative. */
async function checkArrival(session: Session, url: string): Promise<void> {
  const page = await session.open(DESKTOP)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout((ARRIVAL_LEAD_SECONDS + ARRIVAL_CHECK_AFTER_SECONDS) * 1000)
  const actualSeconds = await readSeconds(page)
  session.report.reachesZero = { actualSeconds, ok: actualSeconds === 0 }
  const caption = `Loaded ${ARRIVAL_LEAD_SECONDS} seconds before the moment, captured ${ARRIVAL_CHECK_AFTER_SECONDS} seconds after it`
  await session.capture(page, 'zero-crossing', caption, false)
  await page.close()
}

/** Opens pages that record console errors and off-origin requests, and saves captures. */
class Session {
  private readonly browser: Browser
  private readonly captureDir: string
  readonly origin: string
  readonly report: ExperienceReport

  constructor(browser: Browser, origin: string, captureDir: string, report: ExperienceReport) {
    this.browser = browser
    this.origin = origin
    this.captureDir = captureDir
    this.report = report
  }

  async open(viewport: Viewport): Promise<Page> {
    const page = await this.browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
    page.on('console', (message) => {
      if (message.type() === 'error') this.report.consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => this.report.consoleErrors.push(`Uncaught: ${error.message}`))
    page.on('dialog', (dialog) => void dialog.dismiss())
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.protocol.startsWith('http') && url.origin !== this.origin) this.report.externalRequests.push(`${url.origin}${url.pathname}`)
    })
    return page
  }

  async capture(page: Page, name: string, caption: string, fullPage: boolean): Promise<void> {
    const n = String(this.report.captures.length + 1).padStart(2, '0')
    const file = path.join(this.captureDir, `${n}-${name}.png`)
    await page.screenshot({ path: file, fullPage })
    this.report.captures.push({ file, caption })
  }
}

async function readDurations(page: Page): Promise<string[]> {
  const values = await page.$$eval('time[datetime]', (elements) => elements.map((element) => element.getAttribute('datetime') ?? ''))
  return values.filter((value) => value.trim().startsWith('P'))
}

async function readSeconds(page: Page): Promise<number | null> {
  const [duration] = await readDurations(page)
  return duration === undefined ? null : parseIsoDuration(duration)
}

/** Two more frames of the same page show animation; two seconds apart, the clock must tick. */
async function checkTicksAndMotion(session: Session, page: Page): Promise<void> {
  const { report } = session
  report.ticks.firstSeconds = await readSeconds(page)
  await page.waitForTimeout(700)
  await session.capture(page, 'motion-a', '37 days out, desktop, 0.7 s after the first capture', false)
  await page.waitForTimeout(700)
  await session.capture(page, 'motion-b', '37 days out, desktop, 1.4 s after the first capture', false)
  await page.waitForTimeout(600)
  report.ticks.secondSeconds = await readSeconds(page)
  const { firstSeconds, secondSeconds } = report.ticks
  report.ticks.ok = firstSeconds !== null && secondSeconds !== null && firstSeconds - secondSeconds >= 1 && firstSeconds - secondSeconds <= 3

  const viewport = page.viewportSize() ?? { width: 1440, height: 900 }
  const pointerStops = [
    { name: 'upper-left', x: 0.25, y: 0.3 },
    { name: 'lower-right', x: 0.75, y: 0.7 },
  ]
  for (const stop of pointerStops) {
    await page.mouse.move(viewport.width * stop.x, viewport.height * stop.y, { steps: 8 })
    await page.waitForTimeout(400)
    await session.capture(page, `pointer-${stop.name}`, `37 days out, desktop, pointer moved to the ${stop.name.replace('-', ' ')}`, false)
  }
}

/** Clicks the first few visible interactive elements, capturing the result of each, then checks keyboard focus. */
async function exploreInteractions(session: Session, url: string): Promise<void> {
  const { report } = session
  const page = await session.open(DESKTOP)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)

  const candidates = page.locator(INTERACTIVE)
  const visible: number[] = []
  for (let i = 0; i < (await candidates.count()); i++) {
    if (await candidates.nth(i).isVisible()) visible.push(i)
  }
  report.interactiveElements = visible.length

  let clicked = 0
  for (const index of visible) {
    if (clicked === MAX_CLICKED_ELEMENTS) break
    const element = candidates.nth(index)
    const href = await element.getAttribute('href')
    if (href && new URL(href, session.origin).origin !== session.origin) continue
    const label = ((await element.getAttribute('aria-label')) ?? (await element.innerText()).trim()).slice(0, 60) || '(unlabelled)'
    try {
      await element.click({ timeout: 2_000 })
      await page.waitForTimeout(800)
      clicked += 1
      await session.capture(page, `click-${clicked}`, `37 days out, desktop, after clicking "${label}"`, false)
    } catch {
      // Covered or detached elements aren't worth a capture.
    }
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForTimeout(SETTLE_MS)
  }

  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
  await session.capture(page, 'keyboard-focus', '37 days out, desktop, after pressing Tab once (focus style)', false)
  await page.close()
}
