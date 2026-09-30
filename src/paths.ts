import path from 'node:path'

export const BENCH_ROOT = path.resolve(import.meta.dirname, '..')
export const TEMPLATE_DIR = path.join(BENCH_ROOT, 'template')
export const SCENARIOS_DIR = path.join(BENCH_ROOT, 'scenarios')
export const RUNS_DIR = path.join(BENCH_ROOT, 'runs')
export const BRIEF_TEMPLATE = path.join(BENCH_ROOT, 'prompt', 'BRIEF.template.md')
export const AGENT_PRESETS = path.join(BENCH_ROOT, 'agents.json')

/** The scaffold every run starts from, recorded in run metadata. */
export const TEMPLATE_ORIGIN = 'create-vite@9.2.1 --template react-ts'

/**
 * Layout of a single run directory. The agent works with its cwd set to
 * `root`; everything under `.bench/` belongs to the harness.
 */
export function runPaths(runDir: string) {
  const root = path.resolve(runDir)
  const bench = path.join(root, '.bench')
  return {
    root,
    brief: path.join(root, 'BRIEF.md'),
    handover: path.join(root, 'HANDOVER.md'),
    assets: path.join(root, 'assets'),
    app: path.join(root, 'app'),
    shotTool: path.join(root, 'shot'),
    bench,
    meta: path.join(bench, 'run.json'),
    shots: path.join(bench, 'shots'),
    shotLog: path.join(bench, 'shots.jsonl'),
    history: path.join(bench, 'history.git'),
    /** Written by `bench run`. For manual runs, drop any `transcript.*` file into `.bench/`. */
    transcript: path.join(bench, 'transcript.log'),
    report: path.join(root, 'report'),
  }
}

export type RunPaths = ReturnType<typeof runPaths>
