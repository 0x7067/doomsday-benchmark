/**
 * The pointer, shared by two consumers: the parallax (through smoothed
 * `--pointer-x` / `--pointer-y` custom properties in -1…1 on :root) and the
 * particles (which read `pointer` directly each frame).
 */
export const pointer = {
  x: 0,
  y: 0,
  /** False until the pointer moves, and again when it leaves the window. */
  active: false,
}

export function trackPointer(root: HTMLElement = document.documentElement): () => void {
  let targetX = 0
  let targetY = 0
  let x = 0
  let y = 0
  let frame = 0
  const parallax =
    matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches

  const step = () => {
    x += (targetX - x) * 0.06
    y += (targetY - y) * 0.06
    root.style.setProperty('--pointer-x', x.toFixed(4))
    root.style.setProperty('--pointer-y', y.toFixed(4))
    frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.0005 ? requestAnimationFrame(step) : 0
  }
  const kick = () => {
    if (parallax && !frame) frame = requestAnimationFrame(step)
  }

  const onMove = (event: PointerEvent) => {
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.active = event.pointerType === 'mouse' || event.pointerType === 'pen'
    targetX = (event.clientX / window.innerWidth) * 2 - 1
    targetY = (event.clientY / window.innerHeight) * 2 - 1
    kick()
  }
  const onLeave = () => {
    pointer.active = false
    targetX = 0
    targetY = 0
    kick()
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
  }
}
