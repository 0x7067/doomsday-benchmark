import fs from 'node:fs'
import path from 'node:path'

const ALWAYS_SKIPPED = new Set(['node_modules', '.git'])

/** Relative paths of every file under `root`, skipping node_modules, .git and `skipDirs`. */
export function listFiles(root: string, skipDirs: string[] = []): string[] {
  if (!fs.existsSync(root)) return []
  const skipped = new Set([...ALWAYS_SKIPPED, ...skipDirs])
  const files: string[] = []
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skipped.has(entry.name)) visit(path.join(dir, entry.name))
      } else if (entry.isFile()) {
        files.push(path.relative(root, path.join(dir, entry.name)))
      }
    }
  }
  visit(root)
  return files.sort()
}
