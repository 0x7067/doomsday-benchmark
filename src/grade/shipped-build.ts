import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { listFiles } from '../fs-walk.ts'

export interface ShippedFiles {
  /** SHA-256 of every file the build emits. */
  hashes: Set<string>
  /** Set when the build failed, in which case `hashes` is empty. */
  error: string | null
}

/**
 * Builds the app a second time with asset inlining off, so every image, font
 * or other file the page actually ships lands in the output byte for byte,
 * however it was imported (including `import.meta.glob`). Vite would otherwise
 * inline small files as data URIs.
 */
export function buildShippedFiles(appDir: string, scratchDir: string): ShippedFiles {
  const vite = path.join(appDir, 'node_modules', '.bin', 'vite')
  const build = spawnSync(vite, ['build', '--assetsInlineLimit', '0', '--outDir', scratchDir, '--emptyOutDir'], {
    cwd: appDir,
    encoding: 'utf8',
  })
  const hashes = build.status === 0 ? new Set(listFiles(scratchDir).map((file) => hashFile(path.join(scratchDir, file)))) : new Set<string>()
  fs.rmSync(scratchDir, { recursive: true, force: true })
  return { hashes, error: build.status === 0 ? null : `Build without inlining failed: ${build.stderr.slice(0, 1_000)}` }
}

export function hashFile(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}
