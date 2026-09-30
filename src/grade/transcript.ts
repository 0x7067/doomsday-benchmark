/*
 * Harness transcripts come in every shape: Claude Code and Codex emit JSON
 * lines, OpenCode exports one JSON document, other tools write plain text.
 * Rather than parsing each format, this turns any of them into indented,
 * readable text a judge can page through: base64 blobs (screenshots) are
 * dropped, huge strings are trimmed, and multi-line strings stay multi-line.
 */

const BASE64_BLOB = /(?:data:[\w/+.-]+;base64,)?[A-Za-z0-9+/]{400,}={0,2}/g
const MAX_STRING = 4_000
const KEEP_HEAD = 2_500
const KEEP_TAIL = 1_000

export function cleanTranscript(raw: string): string {
  const whole = tryParse(raw)
  if (whole !== undefined) return render(whole, '').join('\n')
  return raw
    .split('\n')
    .map((line) => {
      const record = /^\s*[[{]/.test(line) ? tryParse(line) : undefined
      return record === undefined ? shorten(line) : `${render(record, '').join('\n')}\n`
    })
    .join('\n')
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function shorten(text: string): string {
  const withoutBlobs = text.replace(BASE64_BLOB, (blob) => `[${Math.round((blob.length * 0.75) / 1024)} KB of base64 omitted]`)
  if (withoutBlobs.length <= MAX_STRING) return withoutBlobs
  const omitted = withoutBlobs.length - KEEP_HEAD - KEEP_TAIL
  return `${withoutBlobs.slice(0, KEEP_HEAD)} … [${omitted} characters omitted] … ${withoutBlobs.slice(-KEEP_TAIL)}`
}

/** A YAML-like outline of a JSON value, one line per scalar. */
function render(value: unknown, indent: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const [first = '', ...rest] = render(item, `${indent}  `)
      return [`${indent}- ${first.trimStart()}`, ...rest]
    })
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => {
      if (item === null || typeof item !== 'object') return renderScalar(key, item, indent)
      if (Object.keys(item).length === 0) return []
      return [`${indent}${key}:`, ...render(item, `${indent}  `)]
    })
  }
  return renderScalar(null, value, indent)
}

function renderScalar(key: string | null, value: unknown, indent: string): string[] {
  const prefix = `${indent}${key === null ? '' : `${key}: `}`
  if (typeof value !== 'string') return [`${prefix}${String(value)}`]
  const text = shorten(value)
  if (!text.includes('\n')) return [`${prefix}${text}`]
  return [`${prefix}|`, ...text.split('\n').map((line) => `${indent}  ${line}`)]
}
