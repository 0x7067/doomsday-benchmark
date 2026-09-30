import fs from 'node:fs'
import path from 'node:path'
import { listFiles } from '../fs-walk.ts'
import type { AssetInfo } from '../scenario.ts'
import { matchBuiltImages } from './asset-match.ts'
import { hashFile, type ShippedFiles } from './shipped-build.ts'

export interface AssetUsage {
  file: string
  /**
   * shipped: a byte-identical copy is in the build.
   * transformed: the build has an image derived from it (resized, re-encoded or cropped).
   * copied-unused: copied into app/ but never makes it into the build.
   * not-found: nothing in the build comes from it.
   */
  status: 'shipped' | 'transformed' | 'copied-unused' | 'not-found'
  /** For transformed assets, the built images derived from it, relative to the build. */
  derived?: string[]
}

export interface AssetReport {
  usage: AssetUsage[]
  /** Images in the real build, including ones the agent generated or transformed. */
  builtImages: { file: string; bytes: number }[]
  /** Set when the inlining-free build failed, in which case nothing counts as shipped. */
  error: string | null
}

const IMAGE = /\.(?:png|jpe?g|gif|webp|avif|svg)$/i

/**
 * Which provided assets ship: byte-identical copies first, then images that
 * look derived from an asset. `assetsDir` holds the originals.
 */
export async function analyzeAssets(assets: AssetInfo[], assetsDir: string, appDir: string, shipped: ShippedFiles, buildDir: string): Promise<AssetReport> {
  const copiedHashes = new Set(
    listFiles(appDir, ['dist'])
      .filter((file) => /^(?:src|public)\//.test(file))
      .map((file) => hashFile(path.join(appDir, file))),
  )
  const imageAssets = assets.filter((asset) => IMAGE.test(asset.file) && !asset.file.endsWith('.svg'))
  const matches = fs.existsSync(assetsDir)
    ? await matchBuiltImages(shipped.images, imageAssets.map((asset) => path.join(assetsDir, asset.file)))
    : []

  const usage = assets.map((asset): AssetUsage => {
    if (shipped.hashes.has(asset.sha256)) return { file: asset.file, status: 'shipped' }
    const derived = matches.filter((m) => m.asset === path.join(assetsDir, asset.file)).map((m) => path.relative(buildDir, m.built))
    if (derived.length) return { file: asset.file, status: 'transformed', derived }
    if (copiedHashes.has(asset.sha256)) return { file: asset.file, status: 'copied-unused' }
    return { file: asset.file, status: 'not-found' }
  })

  const distDir = path.join(appDir, 'dist')
  const builtImages = listFiles(distDir)
    .filter((file) => IMAGE.test(file))
    .map((file) => ({ file: path.join('app', 'dist', file), bytes: fs.statSync(path.join(distDir, file)).size }))
  return { usage, builtImages, error: shipped.error }
}
