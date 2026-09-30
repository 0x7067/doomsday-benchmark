/**
 * OpenCode plugin that setup installs into OpenCode runs as
 * `.opencode/plugins/recent-images.js`, next to its config
 * `recent-images.json` (written from src/harness.ts).
 *
 * OpenCode resends the whole conversation on every request, including every
 * image the agent has opened. Providers cap images per request (DeepSeek on
 * OpenCode Zen, when served by DeepInfra, rejects more than 30), so a diligent
 * agent that keeps looking at its work eventually gets every request refused
 * and the run dies. This drops the oldest images and leaves a note in their
 * place; the agent's written critiques stay, and it can re-open any file.
 */

import fs from 'node:fs'

/**
 * Old images go in whole blocks of this size, keeping between IMAGE_BLOCK and
 * 2 * IMAGE_BLOCK - 1 of the newest. Dropping in blocks means earlier messages
 * change only once per block, so the provider's prompt cache keeps working.
 */
const { imageBlock: IMAGE_BLOCK } = JSON.parse(fs.readFileSync(new URL('./recent-images.json', import.meta.url), 'utf8'))
const REMOVED_NOTE =
  '[Image removed from context by the benchmark harness to stay under provider image limits. Read the file again to see it.]'

const isImage = (attachment) => typeof attachment.mime === 'string' && attachment.mime.startsWith('image/')

const imagesOf = (part) =>
  part.type === 'tool' && part.state.status === 'completed' ? (part.state.attachments ?? []).filter(isImage) : []

export const RecentImages = async () => ({
  'experimental.chat.messages.transform': async (_input, output) => {
    const total = output.messages.reduce((sum, message) => sum + message.parts.flatMap(imagesOf).length, 0)
    let toDrop = Math.floor(Math.max(0, total - IMAGE_BLOCK) / IMAGE_BLOCK) * IMAGE_BLOCK

    // Oldest first. Parts are replaced with copies rather than edited, leaving the stored session untouched.
    for (let m = 0; m < output.messages.length && toDrop > 0; m++) {
      const message = output.messages[m]
      const parts = message.parts.map((part) => {
        const images = imagesOf(part)
        if (toDrop === 0 || images.length === 0) return part
        const dropped = images.slice(0, toDrop)
        toDrop -= dropped.length
        return {
          ...part,
          state: {
            ...part.state,
            attachments: part.state.attachments.filter((attachment) => !dropped.includes(attachment)),
            output: `${part.state.output}\n${REMOVED_NOTE}`,
          },
        }
      })
      output.messages[m] = { ...message, parts }
    }
  },
})
