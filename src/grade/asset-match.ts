import sharp from 'sharp'

/*
 * Recognises provided images in a build after the agent resized, re-encoded
 * or cropped them. Both sides are reduced to small greyscale thumbnails, and
 * each built image is searched for as a window of the asset at several
 * scales, so a crop still matches the asset it came from. Windows are compared
 * by normalized cross-correlation, which looks at structure rather than
 * brightness, so two dark, soft images don't match just for being dark.
 */

export interface ImageMatch {
  /** The built image. */
  built: string
  /** The provided asset it was derived from. */
  asset: string
  /** 1 minus the normalized cross-correlation, from 0 (identical structure) to 2; lower is closer. */
  difference: number
}

/** Width of the thumbnail a built image is reduced to. */
const TEMPLATE_WIDTH = 24
/**
 * How much of the asset's width the built image may cover, from the whole
 * asset down to a quarter. A 9:16 portrait cut from 16:9 art covers about 32%.
 */
const SCALES = [1, 0.9, 0.8, 0.7, 0.6, 0.52, 0.45, 0.4, 0.36, 0.33, 0.3, 0.27, 0.25]
/**
 * Differences under this count as derived. On the V1 runs' builds, derived
 * images scored 0.16 at most (crops of busy key art), and the closest thing
 * that isn't a copy, a share card composed from the logo and art, 0.38.
 */
const MATCH_THRESHOLD = 0.2
/** Built images narrower than this are icons or placeholders, too small to tell apart. */
const MIN_BUILT_WIDTH = 64

interface Grey {
  data: Buffer
  width: number
  height: number
}

/**
 * For each built image, the provided asset it was most likely derived from.
 * A built image is credited to its single closest asset, so near-duplicate
 * assets don't both count as used.
 */
export async function matchBuiltImages(builtImages: string[], assets: string[]): Promise<ImageMatch[]> {
  const assetScales = await Promise.all(
    assets.map(async (asset) => ({ asset, scaled: await Promise.all(SCALES.map((scale) => grey(asset, Math.round(TEMPLATE_WIDTH / scale)))) })),
  )
  const matches: ImageMatch[] = []
  for (const built of builtImages) {
    const width = (await sharp(built).metadata()).width ?? 0
    if (width < MIN_BUILT_WIDTH) continue
    const template = await grey(built, TEMPLATE_WIDTH)
    let best: ImageMatch | null = null
    for (const { asset, scaled } of assetScales) {
      for (const candidate of scaled) {
        const difference = bestWindow(candidate, template)
        if (difference < (best?.difference ?? Infinity)) best = { built, asset, difference }
      }
    }
    if (best && best.difference < MATCH_THRESHOLD) matches.push(best)
  }
  return matches
}

async function grey(file: string, width: number): Promise<Grey> {
  // Flattening onto black gives transparent logos the same backdrop on both sides.
  const { data, info } = await sharp(file).flatten({ background: '#000' }).resize({ width }).greyscale().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/** 1 minus the best normalized cross-correlation between `template` and any window of `image` the same size. */
function bestWindow(image: Grey, template: Grey): number {
  if (template.width > image.width || template.height > image.height) return Infinity
  const n = template.width * template.height
  let templateSum = 0
  let templateSquares = 0
  for (const value of template.data) {
    templateSum += value
    templateSquares += value * value
  }
  const templateSpread = templateSquares - (templateSum * templateSum) / n
  // A flat image has no structure to recognise.
  if (templateSpread < n) return Infinity
  let best = Infinity
  for (let y = 0; y + template.height <= image.height; y++) {
    for (let x = 0; x + template.width <= image.width; x++) {
      let sum = 0
      let squares = 0
      let cross = 0
      for (let row = 0; row < template.height; row++) {
        const imageRow = (y + row) * image.width + x
        const templateRow = row * template.width
        for (let column = 0; column < template.width; column++) {
          const value = image.data[imageRow + column]
          sum += value
          squares += value * value
          cross += value * template.data[templateRow + column]
        }
      }
      const spread = squares - (sum * sum) / n
      if (spread < n) continue
      const correlation = (cross - (sum * templateSum) / n) / Math.sqrt(spread * templateSpread)
      best = Math.min(best, 1 - correlation)
    }
  }
  return best
}
