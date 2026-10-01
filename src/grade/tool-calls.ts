/*
 * What an agent asked its tools to do, read from any harness's JSON
 * transcript: the commands it ran and the paths it asked to read, write, list
 * or search. Tool output is never included, so a path that only appears in an
 * error message or a directory listing isn't something the agent touched.
 */

/** Keys whose values are paths or commands in the tool calls of Claude Code, OpenCode and Codex. */
const INPUT_KEYS = new Set(['command', 'cmd', 'file_path', 'filePath', 'path', 'paths', 'pattern', 'directory', 'cwd', 'workdir'])
/** Keys that hold tool results, which the agent didn't write. */
const OUTPUT_KEYS = new Set(['output', 'result', 'aggregated_output'])

/** Every string under a path or command key of the transcript's tool calls. */
export function toolCallInputs(transcript: string): string[] {
  const values: string[] = []
  const collect = (value: unknown) => {
    if (typeof value === 'string') values.push(value)
    else if (Array.isArray(value)) for (const item of value) collect(item)
  }
  const visit = (node: unknown, inInput: boolean): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, inInput)
      return
    }
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      if (key === 'input' || key === 'arguments') visit(typeof value === 'string' ? parseJson(value) : value, true)
      else if (INPUT_KEYS.has(key) && (inInput || key === 'command')) collect(value)
      // Message content still holds tool calls, so everything but results is walked.
      else if (!OUTPUT_KEYS.has(key)) visit(value, inInput)
    }
  }
  for (const line of transcript.split('\n')) {
    if (/^\s*[[{]/.test(line)) visit(parseJson(line), false)
  }
  return values
}

/** Codex passes tool arguments as a JSON string; other harnesses as an object. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
