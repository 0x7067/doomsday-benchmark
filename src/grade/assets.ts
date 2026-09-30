import fs from 'node:fs'
import path from 'node:path'
import { listFiles } from '../fs-walk.ts'
import type { AssetInfo } from '../scenario.ts'
import { hashFile, type ShippedFiles } from './shipped-build.ts'

export interface AssetUsage {
  file: string
  /**
   * shipped: a byte-identical copy is in the build.
   * copied-unused: copied into app/ but never makes it into the build.
   * not-found: no identical copy anywhere, so it was left out or transformed.
   */
  status: 'shipped' | 'copied-unused' | 'not-found'
}

export interface AssetReport {
  usage: AssetUsage[]
  /** Images in the real build, including ones the agent generated or transformed. */
  builtImages: { file: string; bytes: number }[]
  /** Set when the inlining-free build failed, in which case nothing counts as shipped. */
  error: string | null
}

const IMAGE = /\.(?:png|jpe?g|gif|webp|avif|svg)$/i

/** Which provided assets ship, judged by byte-identical copies in the inlining-free build. */
export function analyzeAssets(assets: AssetInfo[], appDir: string, shipped: ShippedFiles): AssetReport {
  const copiedHashes = new Set(
    listFiles(appDir, ['dist'])
      .filter((file) => /^(?:src|public)\//.test(file))
      .map((file) => hashFile(path.join(appDir, file))),
  )
  const usage = assets.map((asset): AssetUsage => {
    if (shipped.hashes.has(asset.sha256)) return { file: asset.file, status: 'shipped' }
    if (copiedHashes.has(asset.sha256)) return { file: asset.file, status: 'copied-unused' }
    return { file: asset.file, status: 'not-found' }
  })

  const distDir = path.join(appDir, 'dist')
  const builtImages = listFiles(distDir)
    .filter((file) => IMAGE.test(file))
    .map((file) => ({ file: path.join('app', 'dist', file), bytes: fs.statSync(path.join(distDir, file)).size }))
  return { usage, builtImages, error: shipped.error }
}
