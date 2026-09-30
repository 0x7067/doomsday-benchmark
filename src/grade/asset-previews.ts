import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Page } from 'playwright'
import { listFiles } from '../fs-walk.ts'

export interface AssetView {
  /** The file a judge should open. */
  file: string
  /** True when `file` is a PNG rendering because the original can't be opened directly. */
  converted: boolean
}

/** Image formats Chromium decodes but the judges' image reader can't open. */
const MIME_BY_EXTENSION: Record<string, string> = {
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
}
const MAX_PREVIEW_WIDTH = 1600

/**
 * Copies the original assets into `outDir` for the judges. Images in formats
 * the judges can't open get a PNG rendering alongside, made with the same
 * headless Chromium the grader uses. Returns the file to open for each asset.
 */
export async function writeAssetPreviews(sourceDir: string, outDir: string): Promise<Record<string, AssetView>> {
  const files = listFiles(sourceDir).filter((file) => !path.basename(file).startsWith('.'))
  fs.cpSync(sourceDir, outDir, { recursive: true })
  const views: Record<string, AssetView> = Object.fromEntries(
    files.map((file) => [file, { file: path.join(outDir, file), converted: false }]),
  )

  const convertible = files.filter((file) => path.extname(file).toLowerCase() in MIME_BY_EXTENSION)
  if (convertible.length === 0) return views
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    for (const file of convertible) {
      const preview = path.join(outDir, `${file}.png`)
      if (await renderToPng(page, path.join(sourceDir, file), preview)) views[file] = { file: preview, converted: true }
    }
  } finally {
    await browser.close()
  }
  return views
}

async function renderToPng(page: Page, source: string, target: string): Promise<boolean> {
  const mime = MIME_BY_EXTENSION[path.extname(source).toLowerCase()]
  const data = fs.readFileSync(source).toString('base64')
  await page.setContent(`<body style="margin:0"><img src="data:${mime};base64,${data}" style="display:block"></body>`)
  const image = page.locator('img')
  try {
    const { width, height } = await image.evaluate(async (img: HTMLImageElement) => {
      await img.decode()
      return { width: img.naturalWidth, height: img.naturalHeight }
    })
    const scale = Math.min(1, MAX_PREVIEW_WIDTH / width)
    const size = { width: Math.round(width * scale), height: Math.round(height * scale) }
    await image.evaluate((img: HTMLImageElement, s) => Object.assign(img.style, { width: `${s.width}px`, height: `${s.height}px` }), size)
    await page.setViewportSize(size)
    await image.screenshot({ path: target })
    return true
  } catch {
    // Undecodable files stay as they are; the judge is told the original path.
    return false
  }
}
