import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

export interface ViteServer {
  url: string
  stop(): Promise<void>
}

const STARTUP_TIMEOUT_MS = 30_000

/**
 * Starts the app's own Vite binary: `dev` serves the source, `preview` serves
 * the production build in `dist/`. Resolves once the server answers HTTP.
 */
export async function startVite(appDir: string, mode: 'dev' | 'preview'): Promise<ViteServer> {
  const vite = path.join(appDir, 'node_modules', '.bin', 'vite')
  if (!fs.existsSync(vite)) throw new Error(`No Vite binary at ${vite}; run npm install in ${appDir}`)

  const port = await freePort()
  const args = [...(mode === 'preview' ? ['preview'] : []), '--host', '127.0.0.1', '--port', String(port), '--strictPort']
  const child = spawn(vite, args, { cwd: appDir, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (chunk: Buffer) => (output += chunk))
  child.stderr.on('data', (chunk: Buffer) => (output += chunk))
  const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))

  const stop = async () => {
    if (child.exitCode === null) child.kill('SIGTERM')
    await exited
  }

  const url = `http://127.0.0.1:${port}`
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vite ${mode} exited early:\n${output}`)
    if (await answers(url)) return { url, stop }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  await stop()
  throw new Error(`vite ${mode} did not start within ${STARTUP_TIMEOUT_MS / 1000}s:\n${output}`)
}

async function answers(url: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo
      server.close(() => resolve(port))
    })
  })
}
