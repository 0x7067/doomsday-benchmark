#!/usr/bin/env node
/**
 * Generates the responsive image derivatives shipped by the app.
 *
 *   npm run images
 *
 * Masters live in `art/` (never bundled). Derivatives land in
 * `src/assets/scenes/` and `src/assets/logo/` and are committed, so builds
 * stay fast and deterministic and don't depend on native image tooling.
 * `src/lib/scenes/images.ts` picks the files up by name through
 * `import.meta.glob`; re-run this script after changing a master or a width.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const art = path.join(root, 'art')
const scenesOut = path.join(root, 'src/assets/scenes')
const logoOut = path.join(root, 'src/assets/logo')

/**
 * Widths are capped at the master's own width; we never upscale.
 *
 * `crop` cuts a tall portrait frame out of a landscape master, centred on the
 * subject (`centerX` as a fraction of the width), so phones download and
 * decode a ~1000px-wide image instead of a 4K one they'd mostly crop away.
 * The forest has a purpose-made portrait master instead.
 */
const PORTRAIT_ASPECT = 1 / 2
const SCENES = [
  { name: 'kokiri-forest', source: 'kokiri-forest.png', widths: [1280, 1920] },
  { name: 'kokiri-forest-portrait', source: 'kokiri-forest-portrait.jpg', widths: [720, 1178] },
  { name: 'hyrule-field', source: 'hyrule-field.avif', widths: [1280, 1920, 2560, 3200] },
  { name: 'hyrule-field-portrait', source: 'hyrule-field.avif', crop: { centerX: 0.24 }, widths: [720, 900] },
  { name: 'deku-tree', source: 'deku-tree.avif', widths: [1280, 1920, 2560, 3840] },
  { name: 'deku-tree-portrait', source: 'deku-tree.avif', crop: { centerX: 0.49 }, widths: [720, 1080] },
]

/** A sharp pipeline for the scene's frame: the whole master, or its portrait crop. */
async function frame(input, crop) {
  const { width, height } = await sharp(input).metadata()
  if (!crop) return { image: () => sharp(input), width }
  const cropWidth = Math.round(height * PORTRAIT_ASPECT)
  const left = Math.min(width - cropWidth, Math.max(0, Math.round(width * crop.centerX - cropWidth / 2)))
  const extract = { left, top: 0, width: cropWidth, height }
  return { image: () => sharp(input).extract(extract), width: cropWidth }
}

const AVIF = { quality: 55, effort: 6 }
const WEBP = { quality: 78, effort: 6 }

async function clean(dir) {
  await mkdir(dir, { recursive: true })
  for (const file of await readdir(dir)) await rm(path.join(dir, file))
}

async function scenes() {
  await clean(scenesOut)
  const placeholders = {}
  for (const scene of SCENES) {
    const input = path.join(art, scene.source)
    const { image, width: masterWidth } = await frame(input, scene.crop)
    for (const width of scene.widths) {
      if (width > masterWidth) throw new Error(`${scene.name}: ${width}px exceeds master width ${masterWidth}px`)
      const resized = image().resize({ width, withoutEnlargement: true })
      await resized.clone().avif(AVIF).toFile(path.join(scenesOut, `${scene.name}-${width}.avif`))
      await resized.clone().webp(WEBP).toFile(path.join(scenesOut, `${scene.name}-${width}.webp`))
      console.log(`scene ${scene.name} @ ${width}w`)
    }
    // A ~300 byte blurred preview, shown while the real image streams in.
    const tiny = await image().resize({ width: 32 }).blur(1.2).webp({ quality: 50 }).toBuffer()
    placeholders[scene.name] = `data:image/webp;base64,${tiny.toString('base64')}`
  }
  await writeFile(path.join(scenesOut, 'placeholders.json'), `${JSON.stringify(placeholders, null, 2)}\n`)
}

async function logo() {
  await clean(logoOut)
  const input = path.join(art, 'logo.png')
  await sharp(input).avif({ quality: 70, effort: 6 }).toFile(path.join(logoOut, 'logo.avif'))
  await sharp(input).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(path.join(logoOut, 'logo.webp'))
  console.log('logo')
}

/** 1200×630 link-preview card: Hyrule Field with the logo in the open sky. */
async function shareCard() {
  const logo = await sharp(path.join(art, 'logo.png')).resize({ width: 470 }).toBuffer()
  const shade = Buffer.from(
    `<svg width="1200" height="630"><defs><linearGradient id="g" x1="0" x2="1">
       <stop offset="0.35" stop-color="#040706" stop-opacity="0"/>
       <stop offset="1" stop-color="#040706" stop-opacity="0.75"/></linearGradient></defs>
     <rect width="1200" height="630" fill="url(#g)"/></svg>`,
  )
  await sharp(path.join(art, 'hyrule-field.avif'))
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'left' })
    .composite([
      { input: shade, top: 0, left: 0 },
      { input: logo, top: 140, left: 680 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(root, 'public/og-image.jpg'))
  console.log('share card')
}

await scenes()
await logo()
await shareCard()
