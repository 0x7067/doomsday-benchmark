import type { CSSProperties, ReactNode, RefObject } from 'react'
import { useInView } from '../lib/useInView.ts'

interface RevealProps {
  children: ReactNode
  /** The element rendered. Only affects the ref's static type. */
  /** Stagger, in milliseconds. */
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'figure' | 'article' | 'section'
  /**
   * Observe this node as well as revealing it — for callers that need to know
   * when their own box is on screen. Attached to the same element.
   */
  observerRef?: RefObject<HTMLElement | null>
}

/**
 * Fades and lifts its children the first time they enter the viewport.
 *
 * The observer writes one attribute; CSS owns the transition. Nothing here
 * animates a value, so it cannot jank the clock.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div', observerRef }: RevealProps) {
  const [ref, visible] = useInView<HTMLElement>({ ref: observerRef })

  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties

  return (
    <Tag
      ref={ref as never}
      className={className ? `reveal ${className}` : 'reveal'}
      data-visible={visible}
      style={style}
    >
      {children}
    </Tag>
  )
}
