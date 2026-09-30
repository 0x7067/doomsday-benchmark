import fs from 'node:fs'
import type { AgentRecord } from './run-meta.ts'

/*
 * Token use and cost, read from the harness's own transcript. Each harness
 * reports these differently, so each gets a reader; transcripts no reader
 * understands simply have no usage.
 */

export interface TokenCounts {
  /** Input tokens that were neither read from nor written to the prompt cache. */
  input: number
  cacheRead: number
  cacheWrite: number
  /** Everything the model generated, reasoning included; null when the harness didn't report it. */
  output: number | null
  /** The part of `output` that was reasoning, when the harness reports it. */
  reasoning: number | null
  /** A lower bound when `output` is null. */
  total: number
}

export interface RunUsage {
  harness: 'claude-code' | 'opencode' | 'codex'
  /** The exact model id, when the transcript names it. */
  model: string | null
  /** Agent turns or model calls, as the harness counts them. */
  turns: number
  tokens: TokenCounts
  costUsd: number | null
  /** Where the cost comes from, or why there isn't one. */
  costBasis: string
  /** Session length according to the transcript. */
  transcriptSeconds: number | null
}

export interface RunDuration {
  seconds: number
  source: string
}

type Event = Record<string, unknown>

export function readUsage(transcriptFile: string, model: string | null = null): RunUsage | null {
  if (!fs.existsSync(transcriptFile)) return null
  const events = fs
    .readFileSync(transcriptFile, 'utf8')
    .split('\n')
    .flatMap((line): Event[] => {
      try {
        const parsed: unknown = JSON.parse(line)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? [parsed as Event] : []
      } catch {
        return []
      }
    })
  return claudeCodeUsage(events) ?? openCodeUsage(events) ?? codexUsage(events, model)
}

/** Launch-to-exit time when the benchmark launched the agent, otherwise the transcript's own figure. */
export function runDuration(agent: AgentRecord | null | undefined, usage: RunUsage | null): RunDuration | null {
  if (agent) return { seconds: (Date.parse(agent.finishedAt) - Date.parse(agent.startedAt)) / 1000, source: 'launch to exit, measured by the benchmark' }
  if (usage?.transcriptSeconds) return { seconds: usage.transcriptSeconds, source: 'from the transcript' }
  return null
}

interface ClaudeUsage {
  input_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  output_tokens?: number
}

/** Claude Code's stream-json ends with a `result` event holding the session's totals and cost. */
function claudeCodeUsage(events: Event[]): RunUsage | null {
  const result = events.findLast((e) => e.type === 'result' && 'total_cost_usd' in e) as
    | { num_turns?: number; total_cost_usd: number; duration_ms?: number; usage?: ClaudeUsage; modelUsage?: Record<string, ModelUsage> }
    | undefined
  if (result) {
    const perModel = Object.values(result.modelUsage ?? {})
    return {
      harness: 'claude-code',
      model: claudeCodeModel(events),
      turns: result.num_turns ?? 0,
      tokens: perModel.length ? sumModelUsage(perModel) : fromClaudeUsage(result.usage ?? {}),
      costUsd: result.total_cost_usd,
      costBasis: "Claude Code's estimate at API list prices; on a subscription you aren't billed per run",
      transcriptSeconds: result.duration_ms ? result.duration_ms / 1000 : null,
    }
  }

  // Cut short before the result event. Each API response's events carry its usage from when it
  // started, so input and cache counts are exact but output (at most a few tokens there) is unknown.
  const responses = new Map<string, ClaudeUsage>()
  for (const event of events) {
    const message = event.message as { id?: string; usage?: ClaudeUsage } | undefined
    if (event.type === 'assistant' && message?.id && message.usage) responses.set(message.id, message.usage)
  }
  if (responses.size === 0) return null
  const sum = (key: keyof ClaudeUsage) => [...responses.values()].reduce((total, u) => total + (u[key] ?? 0), 0)
  return {
    harness: 'claude-code',
    model: claudeCodeModel(events),
    turns: responses.size,
    tokens: counts({
      input: sum('input_tokens'),
      cacheRead: sum('cache_read_input_tokens'),
      cacheWrite: sum('cache_creation_input_tokens'),
      output: null,
      reasoning: null,
    }),
    costUsd: null,
    costBasis: "unknown: the session ended before Claude Code's final summary, which is the only place it reports output tokens and cost",
    transcriptSeconds: null,
  }
}

/** Claude Code's first event resolves aliases like `opus` to the exact model id. */
function claudeCodeModel(events: Event[]): string | null {
  const init = events.find((e) => e.type === 'system' && e.subtype === 'init')
  return typeof init?.model === 'string' ? init.model : null
}

interface ModelUsage {
  inputTokens?: number
  cacheReadInputTokens?: number
  cacheCreationInputTokens?: number
  outputTokens?: number
  thinkingTokens?: number
}

function sumModelUsage(models: ModelUsage[]): TokenCounts {
  const sum = (key: keyof ModelUsage) => models.reduce((total, m) => total + (m[key] ?? 0), 0)
  return counts({
    input: sum('inputTokens'),
    cacheRead: sum('cacheReadInputTokens'),
    cacheWrite: sum('cacheCreationInputTokens'),
    output: sum('outputTokens'),
    reasoning: sum('thinkingTokens'),
  })
}

function fromClaudeUsage(usage: ClaudeUsage): TokenCounts {
  return counts({
    input: usage.input_tokens ?? 0,
    cacheRead: usage.cache_read_input_tokens ?? 0,
    cacheWrite: usage.cache_creation_input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
    reasoning: null,
  })
}

interface OpenCodeStep {
  tokens?: { input?: number; output?: number; reasoning?: number; cache?: { read?: number; write?: number } }
  cost?: number
}

/** OpenCode's `--format json` emits a `step_finish` event with tokens and cost for every model call. */
function openCodeUsage(events: Event[]): RunUsage | null {
  const steps = events.filter((e) => e.type === 'step_finish').map((e) => (e.part ?? {}) as OpenCodeStep)
  if (steps.length === 0) return null
  const sum = (pick: (tokens: NonNullable<OpenCodeStep['tokens']>) => number | undefined) =>
    steps.reduce((total, step) => total + (pick(step.tokens ?? {}) ?? 0), 0)
  // OpenCode counts reasoning separately from output.
  const reasoning = sum((t) => t.reasoning)
  const timestamps = events.map((e) => e.timestamp).filter((t): t is number => typeof t === 'number')
  return {
    harness: 'opencode',
    // OpenCode's events don't name the model; the launch command does.
    model: null,
    turns: steps.length,
    tokens: counts({
      input: sum((t) => t.input),
      cacheRead: sum((t) => t.cache?.read),
      cacheWrite: sum((t) => t.cache?.write),
      output: sum((t) => t.output) + reasoning,
      reasoning,
    }),
    costUsd: steps.reduce((total, step) => total + (step.cost ?? 0), 0),
    costBasis: "OpenCode's cost at its provider's prices",
    transcriptSeconds: timestamps.length > 1 ? (Math.max(...timestamps) - Math.min(...timestamps)) / 1000 : null,
  }
}

interface CodexUsage {
  input_tokens: number
  cached_input_tokens: number
  cache_write_input_tokens?: number
  output_tokens: number
  reasoning_output_tokens?: number
}

const CODEX_PRICES: Record<string, [number, number, number, number]> = {
  'gpt-6-astra': [10, 1, 12.5, 50],
  'gpt-6.1-sol': [2, 0.1, 2.5, 10],
  'gpt-6-sol': [2, 0.2, 2.5, 10],
  'gpt-6-luna': [0.1, 0.01, 0.125, 0.5],
}

function codexUsage(events: Event[], model: string | null): RunUsage | null {
  const completed = events.filter((event) => event.type === 'turn.completed')
  const usage = completed.at(-1)?.usage as CodexUsage | undefined
  if (!usage || typeof usage !== 'object') return null
  const values = [usage.input_tokens, usage.cached_input_tokens, usage.output_tokens,
    usage.cache_write_input_tokens ?? 0, usage.reasoning_output_tokens ?? 0]
  if (!values.every((value) => Number.isSafeInteger(value) && value >= 0)) return null
  const cacheRead = usage.cached_input_tokens
  const cacheWrite = usage.cache_write_input_tokens ?? 0
  if (cacheRead + cacheWrite > usage.input_tokens || (usage.reasoning_output_tokens ?? 0) > usage.output_tokens) return null
  const tokens = counts({
    input: usage.input_tokens - cacheRead - cacheWrite,
    cacheRead,
    cacheWrite,
    output: usage.output_tokens,
    reasoning: usage.reasoning_output_tokens ?? null,
  })
  const prices = model && Object.hasOwn(CODEX_PRICES, model) ? CODEX_PRICES[model] : undefined
  const costUsd = prices
    ? (tokens.input * prices[0] + cacheRead * prices[1] + cacheWrite * prices[2] + usage.output_tokens * prices[3]) / 1e6
    : null
  return {
    harness: 'codex',
    model,
    turns: completed.length,
    tokens,
    costUsd,
    costBasis: prices
      ? 'Standard short-context API-equivalent estimate at OpenAI list prices checked 2026-09-30; not a billed charge. Per-request long-context, service-tier and regional premiums are unavailable in Codex turn totals'
      : 'unknown: Codex reports tokens but no cost, and no list prices are configured for this model',
    transcriptSeconds: null,
  }
}

function counts(parts: Omit<TokenCounts, 'total'>): TokenCounts {
  return { ...parts, total: parts.input + parts.cacheRead + parts.cacheWrite + (parts.output ?? 0) }
}
