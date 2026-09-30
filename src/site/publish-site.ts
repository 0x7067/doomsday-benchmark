import { execFileSync, spawnSync } from 'node:child_process'
import { BENCH_ROOT } from '../paths.ts'

/**
 * Pushes the built site to the repository's gh-pages branch as a single fresh
 * commit, so the branch never accumulates old captures and builds.
 */
export function publishSite(siteDir: string): string {
  const remote = git(BENCH_ROOT, 'remote', 'get-url', 'origin')
  git(siteDir, 'init', '--quiet', '--initial-branch', 'gh-pages')
  git(siteDir, 'add', '--all')
  git(siteDir, 'commit', '--quiet', '--message', 'Publish benchmark results')
  git(siteDir, 'push', '--quiet', '--force', remote, 'gh-pages')
  return pagesUrl(remote)
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

/**
 * The path GitHub Pages serves the site from: `/<repo>/` for a project site,
 * or `/` when there is no GitHub remote yet.
 */
export function pagesBasePath(): string {
  const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: BENCH_ROOT, encoding: 'utf8' }).stdout.trim()
  const repo = parseGitHubRemote(remote)?.repo
  return repo ? `/${repo}/` : '/'
}

/** https://<owner>.github.io/<repo>/ for a GitHub remote in SSH or HTTPS form. */
function pagesUrl(remote: string): string {
  const parsed = parseGitHubRemote(remote)
  return parsed ? `https://${parsed.owner.toLowerCase()}.github.io/${parsed.repo}/` : `(not a GitHub remote: ${remote})`
}

function parseGitHubRemote(remote: string): { owner: string; repo: string } | null {
  const match = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(remote)
  return match ? { owner: match[1], repo: match[2] } : null
}
