import { useEffect, useRef } from 'react'

/**
 * Scroll-linked parallax. Writes `--parallax` (px) and `--parallax-progress`
 * (-1…1) on the referenced element from a rAF-throttled scroll listener.
 */
export function useParallax<T extends HTMLElement>(strength = 28, disabled = false) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight
      const progress = (viewport / 2 - (rect.top + rect.height / 2)) / (viewport / 2 + rect.height / 2)
      element.style.setProperty('--parallax', `${(progress * strength).toFixed(2)}px`)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [strength, disabled])

  return ref
}

/** Adds `is-revealed` to `[data-reveal]` descendants as they enter the viewport. */
export function useReveal<T extends HTMLElement>(disabled = false) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))

    if (disabled || !('IntersectionObserver' in window)) {
      for (const target of targets) target.classList.add('is-revealed')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    for (const target of targets) observer.observe(target)
    return () => observer.disconnect()
  }, [disabled])

  return ref
}
