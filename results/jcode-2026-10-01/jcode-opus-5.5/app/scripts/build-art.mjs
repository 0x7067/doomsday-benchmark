// Turns the source art in `art-src/` into the responsive, web-ready images in
// `src/art/`. Run with `npm run art` whenever a source image changes; the
// output is committed so `npm run build` never depends on sharp.
import { mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = (name) => `${root}art-src/${name}`
const out = (name) => `${root}src/art/${name}`

/**
 * Each job is one source image rendered at several widths. `crop` is an
 * optional extract applied before resizing (used to frame portrait art).
 * A tiny blurred `-lqip` version is emitted for every image so Vite can inline
 * it as a placeholder while the full-size file streams in.
 */
const jobs = [
  { input: 'kokiri-landscape.png', name: 'kokiri-landscape', widths: [960, 1600, 1920] },
  // The portrait key art carries a fine engraved line texture that costs a lot
  // of bytes at high quality, so it is encoded a little softer.
  { input: 'kokiri-portrait.jpg', name: 'kokiri-portrait', widths: [640, 1178], quality: 68 },
  { input: 'deku-tree.avif', name: 'deku-tree', widths: [960, 1600, 2560] },
  { input: 'hyrule-field.avif', name: 'hyrule-field', widths: [960, 1600, 2560] },
  // Portrait crops of the 16:9 scenes, framed on the subject for phones.
  {
    input: 'deku-tree.avif',
    name: 'deku-tree-portrait',
    crop: { left: 1350, top: 0, width: 1215, height: 2160 },
    widths: [640, 1080],
  },
  {
    input: 'hyrule-field.avif',
    name: 'hyrule-field-portrait',
    crop: { left: 280, top: 0, width: 1012, height: 1800 },
    widths: [640, 1012],
  },
]

await rm(out(''), { recursive: true, force: true })
await mkdir(out(''), { recursive: true })

for (const job of jobs) {
  const base = () => {
    const image = sharp(src(job.input))
    return job.crop ? image.extract(job.crop) : image
  }
  for (const width of job.widths) {
    await base()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: job.quality ?? 78, effort: 6 })
      .toFile(out(`${job.name}-${width}.webp`))
  }
  await base().resize({ width: 32 }).blur(1.2).webp({ quality: 40 }).toFile(out(`${job.name}-lqip.webp`))
  console.log(`✓ ${job.name}`)
}

// The logo keeps its alpha channel. Trim the transparent margin so layout math
// in CSS reflects the visible mark, not the canvas.
await sharp(src('logo.png'))
  .trim()
  .webp({ quality: 90, alphaQuality: 95, effort: 6 })
  .toFile(out('logo.webp'))
console.log('✓ logo')
