import type { RunDuration, RunUsage } from './usage.ts'

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const hours = Math.floor(s / 3_600)
  const minutes = Math.floor((s % 3_600) / 60)
  const seconds = s % 60
  if (hours) return `${hours} h ${minutes} min`
  if (minutes) return `${minutes} min ${seconds} s`
  return `${seconds} s`
}

export function formatTokens(count: number): string {
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`
  if (count >= 1e3) return `${Math.round(count / 1e3)}K`
  return String(count)
}

export function formatUsd(amount: number): string {
  return amount >= 1 ? `$${amount.toFixed(2)}` : `$${amount.toFixed(amount >= 0.01 ? 3 : 4)}`
}

/** One line for the terminal: "1 h 11 min · 49.4M tokens · ~$20.23". */
export function summarizeRun(duration: RunDuration | null, usage: RunUsage | null): string {
  return [
    duration ? formatDuration(duration.seconds) : 'time not recorded',
    usage ? `${usage.tokens.output === null ? 'at least ' : ''}${formatTokens(usage.tokens.total)} tokens` : 'tokens not reported',
    usage?.costUsd != null ? `~${formatUsd(usage.costUsd)}` : 'cost not reported',
  ].join(' · ')
}
