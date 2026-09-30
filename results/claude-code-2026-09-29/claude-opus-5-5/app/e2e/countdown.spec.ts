import { expect, test, type Page } from '@playwright/test'

/*
 * The brief's contract, checked in a real browser against the production
 * build. Time is driven by Playwright's fake clock so every assertion is
 * exact rather than "about ten seconds".
 */

const TEN_SECONDS_BEFORE = '2026-11-04T23:59:50-05:00'

async function freezeClock(page: Page, at = '2026-01-01T00:00:00Z') {
  await page.clock.install({ time: new Date(at) })
  await page.clock.pauseAt(new Date(Date.parse(at) + 1000))
}

const remaining = (page: Page) => page.locator('time').getAttribute('datetime')

test('exposes exactly one <time> carrying the remaining ISO 8601 duration', async ({ page }) => {
  await freezeClock(page)
  await page.goto('/?now=2026-09-29T00:00:00Z')
  await expect(page.locator('time')).toHaveCount(1)
  // 2026-09-29T00:00Z → 2026-11-05T05:00Z
  expect(await remaining(page)).toBe('P37DT5H0M0S')
  await page.clock.runFor(1000)
  expect(await remaining(page)).toBe('P37DT4H59M59S')
})

test('?now starts the clock at that instant, then ticks to zero ten seconds later', async ({ page }) => {
  // Fast-forwarding also runs every animation frame of the particles, which is slow in WebKit.
  test.setTimeout(90_000)
  await freezeClock(page)
  await page.goto(`/?now=${encodeURIComponent(TEN_SECONDS_BEFORE)}`)
  expect(await remaining(page)).toBe('P0DT0H0M10S')

  for (let left = 9; left >= 1; left--) {
    await page.clock.runFor(1000)
    expect(await remaining(page)).toBe(`P0DT0H0M${left}S`)
  }
  await page.clock.runFor(1000)
  expect(await remaining(page)).toBe('PT0S')
  await expect(page.getByRole('heading', { name: 'The time has come' })).toBeVisible()

  // …and it stays there.
  await page.clock.runFor(15_000)
  expect(await remaining(page)).toBe('PT0S')
  await expect(page.locator('time')).toHaveCount(1)
})

test('after the moment: PT0S, the arrival message and no negative numbers', async ({ page }) => {
  await page.goto('/?now=2027-03-01T12:00:00Z')
  expect(await remaining(page)).toBe('PT0S')
  await expect(page.getByRole('heading', { name: 'The time has come' })).toBeVisible()
  expect(await page.locator('body').innerText()).not.toMatch(/-\d/)
})

test('a hand-typed "+" offset still parses', async ({ page }) => {
  await freezeClock(page)
  // Unencoded "+" arrives as a space; 23:59:50 ET is 05:59:50 at +01:00.
  await page.goto('/?now=2026-11-05T05:59:50+01:00')
  expect(await remaining(page)).toBe('P0DT0H0M10S')
})

test('long waits grow the day count without breaking the layout', async ({ page }) => {
  await page.goto('/?now=2024-01-01T00:00:00Z')
  expect(await remaining(page)).toMatch(/^P1039DT/)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('makes no requests to other origins', async ({ page, baseURL }) => {
  const foreign: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (!url.startsWith(baseURL!) && !/^(data|blob):/.test(url)) foreign.push(url)
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(foreign).toEqual([])
})

test('fits the viewport with no horizontal scrolling', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('playing Epona’s Song on the ocarina rides out to Hyrule Field', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard play is a desktop affordance; the phone sheet is covered below')
  await page.goto('/')
  for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
    await page.keyboard.down(key)
    await page.keyboard.up(key)
  }
  await expect(page.getByRole('status')).toHaveText(/Epona’s Song/)
  await expect(page.getByRole('button', { name: 'Hyrule Field' })).toHaveAttribute('aria-current', 'true')
})

test('the phone sheet plays songs from the songbook', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only')
  await page.goto('/')
  await page.getByRole('button', { name: /play the ocarina/i }).click()
  await page.getByRole('button', { name: 'Songs' }).click()
  await page.getByRole('button', { name: /Saria’s Song/ }).click()
  await expect(page.getByRole('status')).toHaveText(/Saria’s Song/, { timeout: 5000 })
})

test('“Add to calendar” downloads an .ics for midnight ET', async ({ page }) => {
  await page.goto('/')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Add to calendar' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('ocarina-of-time-launch.ics')
  const stream = await download.createReadStream()
  let ics = ''
  for await (const chunk of stream) ics += chunk
  expect(ics).toContain('DTSTART:20261105T050000Z')
  expect(ics).toContain('BEGIN:VALARM')
})
