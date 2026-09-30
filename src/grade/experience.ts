import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { parseIsoDuration } from '../time.ts'
import { startVite } from '../vite-server.ts'
import { analyzeSound, installAudioTap, recentLevel, startRecording, stopRecording, writeSoundImage, writeWav, type Recording, type SoundAnalysis } from './audio.ts'
import { probeLayout, readCopy, scrollThrough, type CopyLine, type LayoutFinding, type PageProbes } from './page-probes.ts'

/*
 * Loads the production build in Chromium at fixed moments (via `?now=`) and
 * viewports. It checks the countdown contract from the brief, captures the
 * screenshots the experience judge looks at, probes layout and copy, and
 * records the page's sound.
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
  probes: PageProbes
  sound: SoundReport
}

export interface SoundRecording {
  id: string
  /** What the grader did while recording. */
  label: string
  analysis: SoundAnalysis
  /** The spectrogram and waveform image, or null when the recording was silent. */
  image: string | null
  wav: string
}

export interface SoundReport {
  /** Audio contexts the page created. Zero means it never made a sound through Web Audio. */
  contexts: number
  recordings: SoundRecording[]
  /** The notes detected after pressing each control, for the controls that played something. */
  controls: { control: string; notes: string[] }[]
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
/** A visit without `?now`, for copy only. */
const PLAIN_VISIT = { id: 'plain', label: 'a visit without ?now', offsetSeconds: 0 }
type Moment = (typeof MOMENTS)[number] | typeof PLAIN_VISIT
type Viewport = (typeof VIEWPORTS)[number]

const SETTLE_MS = 1_500
const ARRIVAL_LEAD_SECONDS = 4
const ARRIVAL_CHECK_AFTER_SECONDS = 2
const MAX_CLICKED_ELEMENTS = 5
const INTERACTIVE = 'button, a[href], [role="button"], summary, input, select, textarea, [tabindex]:not([tabindex="-1"])'
/** Controls pressed once each while recording, to hear what they play. */
const MAX_SOUNDED_CONTROLS = 40
const SOUND_TOGGLE = /\b(sound|audio|music|ambien\w*|mute|unmute)\b/i
/** Silence is anything quieter than this share of the recording being above −50 dBFS. */
const AUDIBLE_SHARE = 0.02

export async function checkExperience(appDir: string, captureDir: string, audioDir: string, target: string): Promise<ExperienceReport> {
  const report: ExperienceReport = {
    error: null,
    moments: [],
    ticks: { firstSeconds: null, secondSeconds: null, ok: false },
    reachesZero: { actualSeconds: null, ok: false },
    consoleErrors: [],
    externalRequests: [],
    interactiveElements: 0,
    captures: [],
    probes: { viewports: [], findings: [], copy: [] },
    sound: { contexts: 0, recordings: [], controls: [] },
  }
  if (!fs.existsSync(path.join(appDir, 'dist', 'index.html'))) {
    return { ...report, error: 'No production build (dist/index.html) to serve' }
  }
  fs.mkdirSync(captureDir, { recursive: true })
  fs.mkdirSync(audioDir, { recursive: true })

  const server = await startVite(appDir, 'preview')
  const browser = await chromium.launch()
  try {
    const session = new Session(browser, server.url, captureDir, audioDir, report)
    const urlAt = (offsetSeconds: number) => `${server.url}/?now=${new Date(Date.parse(target) + offsetSeconds * 1000).toISOString()}`
    for (const viewport of VIEWPORTS) {
      for (const moment of MOMENTS) await checkMoment(session, viewport, moment, urlAt(moment.offsetSeconds))
    }
    await checkPlainVisit(session, target)
    await checkArrival(session, urlAt(-ARRIVAL_LEAD_SECONDS))
    await exploreInteractions(session, urlAt(MOMENTS[0].offsetSeconds))
    await checkSound(session, urlAt(MOMENTS[0].offsetSeconds), usesWebAudio(appDir))
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
  // Last, because it scrolls the page.
  await probePage(session, page, viewport, moment)
  await page.close()
}

/**
 * Loads the page as a visitor would, without `?now`, and records its copy, so
 * the judges can tell which lines only appear when the testing hook is set.
 * Only meaningful while the real moment is still weeks away, like the first
 * `?now` moment.
 */
async function checkPlainVisit(session: Session, target: string): Promise<void> {
  if (Date.parse(target) - Date.now() < DAY * 1000) return
  for (const viewport of VIEWPORTS) {
    const page = await session.open(viewport)
    await page.goto(session.origin, { waitUntil: 'load' })
    await page.waitForTimeout(SETTLE_MS)
    await probePage(session, page, viewport, PLAIN_VISIT)
    await page.close()
  }
}

/** Collects the page's copy at every moment, and its layout findings at the first. */
async function probePage(session: Session, page: Page, viewport: Viewport, moment: Moment): Promise<void> {
  const { probes } = session.report
  await scrollThrough(page)
  for (const { text, top } of await readCopy(page)) {
    const at = `${moment.id}/${viewport.id}`
    const known = probes.copy.find((line) => line.text === text)
    if (known) {
      if (!known.seenAt.includes(at)) known.seenAt.push(at)
    } else {
      probes.copy.push({ text, seenAt: [at], top, viewport: viewport.id, moment: moment.id } satisfies CopyLine)
    }
  }
  if (moment.id !== MOMENTS[0].id) return

  const layout = await probeLayout(page)
  probes.viewports.push({ viewport: viewport.id, scrollable: layout.scrollable, contentBelowFold: layout.contentBelowFold, faintestText: layout.faintestText })
  const finding = (kind: LayoutFinding['kind'], description: string, top: number, capture: string | null): LayoutFinding => ({ kind, viewport: viewport.id, moment: moment.id, description, top, capture })
  // A few pixels of scroll from rounding isn't a defect; a scroll to nothing is.
  if (layout.scrollable > 4 && layout.contentBelowFold === 0) {
    probes.findings.push(finding('empty-scroll', `The page scrolls ${layout.scrollable}px at ${viewport.width}px, with nothing below the first screen`, viewport.height, null))
  }
  for (const gap of layout.backdropGaps) probes.findings.push(finding('backdrop-gap', gap.description, gap.top, null))
  for (const [i, edge] of layout.edgeText.slice(0, 4).entries()) {
    const capture = await session.closeUp(page, `edge-${viewport.id}-${i + 1}`, `${viewport.id}: ${edge.description}`, edge.box)
    probes.findings.push(finding('text-on-edge', edge.description, edge.top, capture))
  }
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
  readonly audioDir: string
  readonly origin: string
  readonly report: ExperienceReport

  constructor(browser: Browser, origin: string, captureDir: string, audioDir: string, report: ExperienceReport) {
    this.browser = browser
    this.origin = origin
    this.captureDir = captureDir
    this.audioDir = audioDir
    this.report = report
  }

  async open(viewport: Viewport): Promise<Page> {
    const page = await this.browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
    await page.addInitScript(installAudioTap)
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
    const file = this.nextCapture(name)
    await page.screenshot({ path: file, fullPage })
    this.report.captures.push({ file, caption })
  }

  /** A close-up of one region of the page, in page coordinates; returns the file. */
  async closeUp(page: Page, name: string, caption: string, box: { x: number; y: number; width: number; height: number }): Promise<string> {
    const file = this.nextCapture(name)
    const margin = 24
    const clip = { x: Math.max(0, box.x - margin), y: Math.max(0, box.y - margin), width: box.width + 2 * margin, height: box.height + 2 * margin }
    await page.screenshot({ path: file, fullPage: true, clip })
    this.report.captures.push({ file, caption: `Close-up, ${caption}` })
    return file
  }

  /** Saves a recording as WAV and, when it isn't silent, as a spectrogram capture for the judges. */
  async keepRecording(id: string, label: string, recording: Recording): Promise<SoundRecording> {
    const analysis = analyzeSound(recording)
    const wav = path.join(this.audioDir, `${id}.wav`)
    writeWav(wav, recording)
    let image: string | null = null
    if (analysis.activeShare >= AUDIBLE_SHARE) {
      image = this.nextCapture(`sound-${id}`)
      await writeSoundImage(image, recording, label)
      this.report.captures.push({ file: image, caption: `Sound: spectrogram and level of ${label}` })
    }
    return { id, label, analysis, image, wav }
  }

  private nextCapture(name: string): string {
    const n = String(this.report.captures.length + 1).padStart(2, '0')
    return path.join(this.captureDir, `${n}-${name}.png`)
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
  const firstReadAt = Date.now()
  await page.waitForTimeout(700)
  await session.capture(page, 'motion-a', '37 days out, desktop, 0.7 s after the first capture', false)
  await page.waitForTimeout(700)
  await session.capture(page, 'motion-b', '37 days out, desktop, 1.4 s after the first capture', false)
  await page.waitForTimeout(600)
  report.ticks.secondSeconds = await readSeconds(page)
  // The captures in between take longer on a busy machine, so compare with the time that actually passed.
  const elapsed = (Date.now() - firstReadAt) / 1000
  const { firstSeconds, secondSeconds } = report.ticks
  report.ticks.ok = firstSeconds !== null && secondSeconds !== null && firstSeconds - secondSeconds >= 1 && Math.abs(firstSeconds - secondSeconds - elapsed) <= 1.5

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

/**
 * Records what the page plays: after a first click on an empty spot, after
 * switching sound on if it was silent, and after pressing each control once.
 */
async function checkSound(session: Session, url: string, webAudio: boolean): Promise<void> {
  const { sound } = session.report
  const page = await session.open(DESKTOP)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)

  await startRecording(page)
  await clickEmptySpot(page)
  await page.waitForTimeout(5_000)
  let { recording, contexts } = await stopRecording(page)
  let audible = false
  if (recording) {
    const kept = await session.keepRecording('first-click', 'the 5 seconds after a first click on an empty part of the page', recording)
    sound.recordings.push(kept)
    audible = kept.analysis.activeShare >= AUDIBLE_SHARE
  }

  // A silent page may be waiting for its sound toggle. Toggle labels usually show the current state ("Sound on"),
  // so a toggle that already reads on is left alone: clicking it would mute the page.
  const toggle = page.getByRole('button', { name: SOUND_TOGGLE }).first()
  const toggleName = (await toggle.count()) ? ((await toggle.getAttribute('aria-label')) ?? (await toggle.innerText()).trim()) : null
  const alreadyOn = toggleName !== null && ((await toggle.getAttribute('aria-pressed')) === 'true' || (/\bon\b/i.test(toggleName) && !/\b(turn|switch)\s+on\b/i.test(toggleName)))
  if (!audible && toggleName !== null && !alreadyOn) {
    await startRecording(page)
    await toggle.click({ timeout: 2_000 }).catch(() => undefined)
    await page.waitForTimeout(8_000)
    ;({ recording, contexts } = await stopRecording(page))
    if (recording) sound.recordings.push(await session.keepRecording('sound-on', `the 8 seconds after clicking "${toggleName.slice(0, 40)}"`, recording))
  }
  // Some pages create their audio only when an instrument is first played, so the code decides, not the count so far.
  if (webAudio || contexts > 0) contexts = await pressEachControl(session, page, toggleName)
  sound.contexts = contexts
  await page.close()
}

/** Whether the built JavaScript uses Web Audio at all. */
function usesWebAudio(appDir: string): boolean {
  const assets = path.join(appDir, 'dist', 'assets')
  if (!fs.existsSync(assets)) return false
  return fs.readdirSync(assets).some((file) => file.endsWith('.js') && /AudioContext|createOscillator/.test(fs.readFileSync(path.join(assets, file), 'utf8')))
}

/**
 * Presses every button and declared keyboard shortcut once, noting the notes
 * each one plays. Returns how many audio contexts the page has made by then.
 */
async function pressEachControl(session: Session, page: Page, toggleName: string | null): Promise<number> {
  const presses: { control: string; at: number }[] = []
  const startedAt = Date.now()
  await startRecording(page)
  const buttons = page.locator('button, [role="button"]')
  for (let i = 0; i < Math.min(await buttons.count(), MAX_SOUNDED_CONTROLS); i++) {
    const button = buttons.nth(i)
    if (!(await button.isVisible())) continue
    const name = ((await button.getAttribute('aria-label')) ?? (await button.innerText()).trim()).replace(/\s+/g, ' ').slice(0, 50) || '(unlabelled)'
    if (name === toggleName) continue
    const at = (Date.now() - startedAt) / 1000
    try {
      await button.click({ timeout: 1_000 })
      presses.push({ control: `button "${name}"`, at })
      await untilQuiet(page)
    } catch {
      // Hidden behind something else; not a control a visitor can press right now.
    }
  }
  const shortcuts = await page.$$eval('[aria-keyshortcuts]', (elements) => [...new Set(elements.flatMap((e) => (e.getAttribute('aria-keyshortcuts') ?? '').split(/\s+/)).filter(Boolean))])
  for (const shortcut of shortcuts.slice(0, 12)) {
    // A declared "A" means the A key, not Shift+A.
    const key = shortcut.length === 1 ? shortcut.toLowerCase() : shortcut
    const at = (Date.now() - startedAt) / 1000
    await page.keyboard.down(key).catch(() => undefined)
    await page.waitForTimeout(350)
    await page.keyboard.up(key).catch(() => undefined)
    presses.push({ control: `key ${shortcut}`, at })
    await page.waitForTimeout(250)
  }
  const { recording, contexts } = await stopRecording(page)
  if (!recording || presses.length === 0) return contexts
  const kept = await session.keepRecording('controls', `pressing each of ${presses.length} controls once, in page order`, recording)
  session.report.sound.recordings.push(kept)
  // A note belongs to the last control pressed before it started, allowing for the recorder's buffering delay.
  for (const note of kept.analysis.notes) {
    const time = Number(note.split('@')[1].replace('s', ''))
    const press = presses.findLast((p) => p.at <= time + 0.1)
    if (!press) continue
    const entry = session.report.sound.controls.find((c) => c.control === press.control)
    if (entry) entry.notes.push(note.split('@')[0])
    else session.report.sound.controls.push({ control: press.control, notes: [note.split('@')[0]] })
  }
  return contexts
}

/** Waits after a press until the page goes quiet, so a tune isn't credited to the controls pressed after it. */
async function untilQuiet(page: Page): Promise<void> {
  await page.waitForTimeout(600)
  for (let waited = 0; waited < 4_000; waited += 300) {
    const level = await recentLevel(page)
    if (level === null || level < -50) return
    await page.waitForTimeout(300)
  }
}

/** Clicks the first point on a coarse grid that isn't on anything interactive, as a visitor's first gesture. */
async function clickEmptySpot(page: Page): Promise<void> {
  const spot = await page.evaluate(() => {
    for (let y = 0.1; y < 1; y += 0.15) {
      for (let x = 0.05; x < 1; x += 0.15) {
        const [px, py] = [Math.round(innerWidth * x), Math.round(innerHeight * y)]
        const element = document.elementFromPoint(px, py)
        if (element && !element.closest('a, button, input, select, textarea, label, summary, [role="button"], [tabindex]') && getComputedStyle(element).cursor !== 'pointer') return { x: px, y: py }
      }
    }
    return null
  })
  if (spot) await page.mouse.click(spot.x, spot.y)
  else await page.keyboard.press('Space')
}
