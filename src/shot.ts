/*
 * The screenshot tool handed to the agent under test (as `./shot` in the run
 * directory). It is a plain CLI so that any harness able to run a shell
 * command and open an image can use it. Every call is logged and paired with
 * a snapshot of the code, which is how grading reconstructs the iteration
 * history without depending on the harness's transcript format.
 */
import path from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright'
import { snapshot } from './history.ts'
import { runPaths } from './paths.ts'
import { appendShotLog, readShotLog } from './shot-log.ts'
import { startVite } from './vite-server.ts'

const { values } = parseArgs({
  options: {
    run: { type: 'string' },
    width: { type: 'string', default: '1440' },
    height: { type: 'string', default: '900' },
    now: { type: 'string' },
    wait: { type: 'string', default: '1000' },
    'full-page': { type: 'boolean', default: false },
    path: { type: 'string', default: '/' },
  },
})

function positiveInt(name: string, raw: string): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) throw new Error(`--${name} must be a positive integer, got "${raw}"`)
  return value
}

async function main(): Promise<void> {
  if (!values.run) throw new Error('--run is required (use the ./shot wrapper in the run directory)')
  const paths = runPaths(values.run)
  const width = positiveInt('width', values.width)
  const height = positiveInt('height', values.height)
  const wait = Number(values.wait)
  if (!Number.isFinite(wait) || wait < 0) throw new Error(`--wait must be a number of milliseconds, got "${values.wait}"`)
  if (values.now !== undefined && Number.isNaN(Date.parse(values.now))) {
    throw new Error(`--now must be an ISO 8601 timestamp, got "${values.now}"`)
  }

  const n = readShotLog(paths).length + 1
  const file = path.join(paths.shots, `${String(n).padStart(3, '0')}-${width}x${height}.png`)
  const problems: string[] = []

  const server = await startVite(paths.app, 'dev')
  try {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width, height } })
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`console error: ${message.text()}`)
      })
      page.on('pageerror', (error) => problems.push(`uncaught exception: ${error.message}`))

      const url = new URL(values.path, server.url)
      if (values.now) url.searchParams.set('now', values.now)
      await page.goto(url.href, { waitUntil: 'load' })
      await page.waitForTimeout(wait)
      await page.screenshot({ path: file, fullPage: values['full-page'] })
    } finally {
      await browser.close()
    }
  } finally {
    await server.stop()
  }

  appendShotLog(paths, {
    n,
    file: path.relative(paths.root, file),
    takenAt: new Date().toISOString(),
    width,
    height,
    now: values.now ?? null,
    path: values.path,
    fullPage: values['full-page'],
    commit: snapshot(paths, `shot ${n}`),
    problems,
  })

  console.log(`Saved ${file}`)
  for (const problem of problems) console.log(problem)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
