import type { Page } from 'playwright'
import sharp from 'sharp'

/*
 * Measurements of what a visitor sees, taken in the grader's browser after
 * scrolling through the whole page so reveal-on-scroll content shows: layout
 * defects (text touching a panel's edge, backdrops that end before the page,
 * scrolling to nothing), the smallest and faintest text, and every visible
 * line of copy. Findings are evidence for the judges, not verdicts.
 */

export interface LayoutFinding {
  kind: 'text-on-edge' | 'backdrop-gap' | 'empty-scroll'
  viewport: string
  moment: string
  description: string
  /** Where the problem starts, in page pixels from the top. */
  top: number
  /** A close-up capture, when one was taken. */
  capture: string | null
}

export interface TextSample {
  text: string
  /** Font size in CSS pixels. */
  size: number
  /** Combined opacity of the text and its ancestors. */
  opacity: number
  /** WCAG contrast ratio of the text's colour against the rendered pixels behind it, or null if it couldn't be measured. */
  contrast: number | null
}

export interface ViewportProbe {
  viewport: string
  /** How far the page scrolls beyond one screen, in pixels. */
  scrollable: number
  /** Visible text and media below the first screen. */
  contentBelowFold: number
  /** The smallest and faintest text a visitor is meant to read. */
  faintestText: TextSample[]
}

export interface CopyLine {
  text: string
  /** Where the line appeared, as "moment/viewport". */
  seenAt: string[]
  /** Page position of its first appearance, for matching against the agent's screenshots. */
  top: number
  viewport: string
  moment: string
}

export interface PageProbes {
  viewports: ViewportProbe[]
  findings: LayoutFinding[]
  copy: CopyLine[]
}

/** Text closer than this to a visible side edge of its box is touching it. */
const EDGE_GAP_PX = 8
const SCROLL_STEP_PX = 700
const MAX_SCROLL_PX = 20_000

/** Scrolls from top to bottom and back, so content that reveals on scroll is in its final state. */
export async function scrollThrough(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < Math.min(height, MAX_SCROLL_PX); y += SCROLL_STEP_PX) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(150)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
}

/** Every visible line of text, with its page position. Visually hidden and aria-hidden text is skipped. */
export async function readCopy(page: Page): Promise<{ text: string; top: number }[]> {
  return page.evaluate(() => {
    const lines: { text: string; top: number }[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const element = node.parentElement
      const text = node.textContent?.replace(/\s+/g, ' ').trim()
      if (!text || !element || element.closest('[aria-hidden="true"], script, style, noscript')) continue
      const style = getComputedStyle(element)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      const rect = element.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      lines.push({ text, top: Math.round(rect.top + window.scrollY) })
    }
    return lines
  })
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Layout and legibility measurements for one viewport; call after `scrollThrough`. */
export async function probeLayout(page: Page): Promise<{
  scrollable: number
  contentBelowFold: number
  backdropGaps: { description: string; top: number }[]
  edgeText: { description: string; top: number; box: Box }[]
  faintestText: TextSample[]
}> {
  const { smallText, ...layout } = await measureLayout(page)
  const measured = await Promise.all(smallText.map(async ({ box, textLuminance, ...sample }) => ({ ...sample, contrast: await contrastBehind(page, box, textLuminance) })))
  const readability = (s: TextSample) => s.size * s.opacity * Math.min(s.contrast ?? 4.5, 4.5)
  return { ...layout, faintestText: measured.sort((a, b) => readability(a) - readability(b)).slice(0, 6) }
}

/**
 * Contrast between the text's colour and the median rendered pixel in its box:
 * the text itself covers few of them, so the median is what's behind it,
 * whether a colour, a gradient or an image.
 */
async function contrastBehind(page: Page, box: Box, textLuminance: number): Promise<number | null> {
  if (box.width < 2 || box.height < 2) return null
  try {
    const png = await page.screenshot({ clip: box, fullPage: true })
    const { data } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true })
    const values = [...data].sort((a, b) => a - b)
    const behind = relativeLuminance(values[Math.floor(values.length / 2)])
    const [lighter, darker] = [textLuminance, behind].sort((a, b) => b - a)
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 10) / 10
  } catch {
    return null
  }
}

/** WCAG relative luminance of a grey level from 0 to 255. */
function relativeLuminance(level: number): number {
  const c = level / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Candidates for the smallest text are returned with their boxes, for measuring contrast from the pixels. */
async function measureLayout(page: Page): Promise<{
  scrollable: number
  contentBelowFold: number
  backdropGaps: { description: string; top: number }[]
  edgeText: { description: string; top: number; box: Box }[]
  smallText: (Omit<TextSample, 'contrast'> & { box: Box; textLuminance: number })[]
}> {
  return page.evaluate((edgeGap) => {
    const viewportHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const visible = (element: Element) => {
      const style = getComputedStyle(element)
      return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05
    }
    const describe = (element: Element) => `${element.tagName.toLowerCase()}${element.classList.length ? `.${[...element.classList].join('.')}` : ''}`.slice(0, 60)
    const elements = [...document.querySelectorAll('body *')]

    // Text or media a visitor would scroll down to.
    const contentBelowFold = elements.filter((element) => {
      if (!visible(element)) return false
      const rect = element.getBoundingClientRect()
      if (rect.width < 4 || rect.height < 4 || rect.top + window.scrollY < viewportHeight) return false
      const media = /^(IMG|CANVAS|VIDEO|svg|PICTURE)$/.test(element.tagName)
      const text = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
      return media || text
    }).length

    // The page's backdrop (a full-width image, canvas, video or background layer starting at the top) that stops
    // before the page does, where nothing but the page's own background covers the rest. A section image further
    // down is ordinary page design. One finding per spot: nested layers often end together.
    const covered = (pageY: number) => {
      window.scrollTo(0, Math.max(0, pageY - viewportHeight / 2))
      const point = document.elementsFromPoint(window.innerWidth / 2, pageY - window.scrollY)
      return point.some((e) => {
        if (e === document.body || e === document.documentElement) return false
        const style = getComputedStyle(e)
        return /^(IMG|CANVAS|VIDEO|PICTURE)$/.test(e.tagName) || style.backgroundImage !== 'none' || (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent')
      })
    }
    const gapsByBottom = new Map<number, { description: string; top: number }>()
    for (const element of elements) {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      const visual = /^(IMG|CANVAS|VIDEO|PICTURE)$/.test(element.tagName) || style.backgroundImage !== 'none'
      if (!visual || !visible(element) || style.position === 'fixed') continue
      if (rect.width < window.innerWidth * 0.9 || rect.height < viewportHeight * 0.8 || rect.top + window.scrollY > viewportHeight * 0.25) continue
      const bottom = Math.round(rect.bottom + window.scrollY)
      // A backdrop that stops far from the end is a hero; one that nearly reaches it is meant to fill the page.
      const gap = documentHeight - bottom
      const spot = Math.round(bottom / 20)
      if (gap <= 2 || gap > viewportHeight || gapsByBottom.has(spot) || covered(bottom + gap / 2)) continue
      gapsByBottom.set(spot, { description: `${describe(element)} ends at ${bottom}px on a ${documentHeight}px page, leaving ${gap}px with only the page's background`, top: bottom })
    }
    window.scrollTo(0, 0)
    const backdropGaps = [...gapsByBottom.values()]

    // A side edge counts when the box shows it: a fill shows both, a border only its own side.
    const sideEdges = (style: CSSStyleDeclaration) => {
      if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') return { left: false, right: false }
      const fill = (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') || style.backgroundImage !== 'none'
      const border = (side: 'left' | 'right') => parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 && style.getPropertyValue(`border-${side}-style`) !== 'none'
      return { left: fill || border('left'), right: fill || border('right') }
    }
    const edgeText = elements.flatMap((box) => {
      const style = getComputedStyle(box)
      const edges = sideEdges(style)
      if ((!edges.left && !edges.right) || !visible(box)) return []
      const rect = box.getBoundingClientRect()
      // Panels only: a box as wide as the screen has the screen's edge, not its own.
      if (rect.width < 200 || rect.height < 60 || rect.width >= window.innerWidth - 2) return []
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (!node.textContent?.trim() || node.parentElement?.closest('[aria-hidden="true"]')) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const line of range.getClientRects()) {
          if (line.width < 1) continue
          const gap = Math.min(edges.left ? line.left - rect.left : Infinity, edges.right ? rect.right - line.right : Infinity)
          if (gap >= -1 && gap < edgeGap) {
            const top = Math.round(rect.top + window.scrollY)
            return [{
              description: `"${node.textContent.trim().slice(0, 60)}" sits ${Math.max(0, Math.round(gap))}px from the edge of ${describe(box)}`,
              top,
              box: { x: Math.round(rect.left + window.scrollX), y: top, width: Math.round(rect.width), height: Math.round(Math.min(rect.height, 600)) },
            }]
          }
        }
      }
      return []
    })

    const luminance = (color: string) => {
      const [r, g, b] = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number).map((channel) => {
        const c = channel / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const samples: { text: string; size: number; opacity: number; box: { x: number; y: number; width: number; height: number }; textLuminance: number }[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const element = node.parentElement
      const text = node.textContent?.trim()
      if (!text || !element || !visible(element) || element.closest('[aria-hidden="true"]')) continue
      const rect = element.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      const style = getComputedStyle(element)
      let opacity = 1
      for (let e: Element | null = element; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity)
      // Content still waiting for a reveal animation isn't something a visitor reads yet.
      if (opacity < 0.05) continue
      samples.push({
        text: text.slice(0, 80),
        size: parseFloat(style.fontSize),
        opacity: Math.round(opacity * 100) / 100,
        box: { x: Math.round(rect.left + window.scrollX), y: Math.round(rect.top + window.scrollY), width: Math.round(rect.width), height: Math.round(rect.height) },
        textLuminance: luminance(style.color),
      })
    }
    // The dozen smallest and faintest are measured against their pixels afterwards.
    const smallText = samples.sort((a, b) => a.size * a.opacity - b.size * b.opacity).slice(0, 12)

    return { scrollable: documentHeight - viewportHeight, contentBelowFold, backdropGaps, edgeText, smallText }
  }, EDGE_GAP_PX)
}
