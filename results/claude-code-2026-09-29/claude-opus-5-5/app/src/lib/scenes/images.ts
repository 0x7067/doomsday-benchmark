import placeholders from '../../assets/scenes/placeholders.json'

export type ImageName = keyof typeof placeholders

/**
 * Responsive sources for one scene, assembled from the files that
 * `scripts/optimize-images.mjs` wrote into `src/assets/scenes/`
 * (named `<scene>-<width>.<format>`).
 */
export interface ResponsiveImage {
  avif: string
  webp: string
  /** Largest WebP, for the `<img src>` fallback. */
  src: string
  /** Tiny blurred WebP data URI, painted while the real image loads. */
  placeholder: string
}

interface Variant {
  name: string
  width: number
  format: 'avif' | 'webp'
  url: string
}

const files = import.meta.glob<string>('../../assets/scenes/*.{avif,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const variants: Variant[] = Object.entries(files).map(([file, url]) => {
  const groups = /\/(?<name>[a-z-]+)-(?<width>\d+)\.(?<format>avif|webp)$/.exec(file)?.groups
  if (!groups) throw new Error(`Unexpected scene asset name: ${file}`)
  return { name: groups.name, width: Number(groups.width), format: groups.format as Variant['format'], url }
})

function srcset(list: Variant[]): string {
  return list.map((v) => `${v.url} ${v.width}w`).join(', ')
}

export function sceneImage(name: ImageName): ResponsiveImage {
  const own = variants.filter((v) => v.name === name).sort((a, b) => a.width - b.width)
  const avif = own.filter((v) => v.format === 'avif')
  const webp = own.filter((v) => v.format === 'webp')
  const largest = webp.at(-1)
  if (avif.length === 0 || !largest) throw new Error(`Missing image variants for "${name}"; run npm run images`)
  return { avif: srcset(avif), webp: srcset(webp), src: largest.url, placeholder: placeholders[name] }
}
