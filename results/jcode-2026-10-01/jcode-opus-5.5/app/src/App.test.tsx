// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ocarina } from './lib/audio'

/**
 * End-to-end-ish checks of the brief's hard requirements against the real
 * component tree: one `<time>`, an ISO duration that ticks, `?now=`, PT0S.
 */

const REAL_NOW = Date.parse('2026-10-01T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers({ now: REAL_NOW })
  // jsdom lacks these browser APIs; the page only needs them to exist.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
  globalThis.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  ocarina.muted = false
  window.history.replaceState(null, '', '/')
})

const mountAt = (now?: string) => {
  window.history.replaceState(null, '', now ? `/?now=${encodeURIComponent(now)}` : '/')
  return render(<App />)
}

const times = () => document.querySelectorAll('time')

describe('countdown', () => {
  it('renders exactly one <time> with the remaining ISO duration', () => {
    mountAt()
    expect(times()).toHaveLength(1)
    // 2026-10-01T12:00Z → 2026-11-05T05:00Z = 34 days, 17 hours.
    expect(times()[0].getAttribute('datetime')).toBe('P34DT17H0M0S')
  })

  it('honours ?now= and keeps ticking every second', () => {
    mountAt('2026-11-04T23:59:50-05:00')
    expect(times()[0].getAttribute('datetime')).toBe('P0DT0H0M10S')
    // The clock re-renders a few ms after each second boundary.
    act(() => vi.advanceTimersByTime(1020))
    expect(times()[0].getAttribute('datetime')).toBe('P0DT0H0M9S')
    act(() => vi.advanceTimersByTime(3000))
    expect(times()[0].getAttribute('datetime')).toBe('P0DT0H0M6S')
  })

  it('reaches PT0S at the moment and stays there with no negative numbers', () => {
    const { container } = mountAt('2026-11-04T23:59:58-05:00')
    act(() => vi.advanceTimersByTime(2020))
    expect(times()[0].getAttribute('datetime')).toBe('PT0S')
    act(() => vi.advanceTimersByTime(60_000))
    expect(times()).toHaveLength(1)
    expect(times()[0].getAttribute('datetime')).toBe('PT0S')
    expect(container.textContent).not.toMatch(/-\d/)
    expect(container.textContent).toContain('The legend awakens')
  })

  it('treats a page opened after launch as launched', () => {
    mountAt('2027-01-01T00:00:00Z')
    expect(times()[0].getAttribute('datetime')).toBe('PT0S')
  })
})

describe('ocarina', () => {
  const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key })))

  it('plays the pitch of each key, then the chime once a song completes', () => {
    const note = vi.spyOn(ocarina, 'note').mockImplementation(() => {})
    const secret = vi.spyOn(ocarina, 'secret').mockImplementation(() => {})
    mountAt()
    for (const key of ['ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowLeft']) press(key)
    expect(note.mock.calls.map(([f]) => f)).toEqual([349.23, 440, 493.88, 349.23, 440, 493.88])
    expect(secret).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(500))
    expect(secret).toHaveBeenCalledTimes(1)
  })

  it('the sound toggle mutes the instrument', () => {
    const { getByRole } = mountAt()
    const toggle = getByRole('button', { name: /sound on/i })
    act(() => toggle.click())
    expect(ocarina.muted).toBe(true)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    act(() => toggle.click())
    expect(ocarina.muted).toBe(false)
  })

  it('ticks through the final seconds and plays the fanfare exactly once at zero', () => {
    vi.spyOn(ocarina, 'ready', 'get').mockReturnValue(true)
    const tick = vi.spyOn(ocarina, 'tick').mockImplementation(() => {})
    const fanfare = vi.spyOn(ocarina, 'fanfare').mockImplementation(() => {})
    mountAt('2026-11-04T23:59:55-05:00')
    // One act per second: a single act would batch every tick into one render,
    // unlike a browser where each timeout renders separately.
    for (let i = 0; i < 5; i++) act(() => vi.advanceTimersByTime(1000))
    // Each re-render lands a few ms after the boundary.
    act(() => vi.advanceTimersByTime(20))
    // 4, 3, 2, 1: the last three accented.
    expect(tick.mock.calls).toEqual([[false], [true], [true], [true]])
    expect(fanfare).toHaveBeenCalledTimes(1)
    for (let i = 0; i < 10; i++) act(() => vi.advanceTimersByTime(1000))
    expect(fanfare).toHaveBeenCalledTimes(1)
    expect(tick).toHaveBeenCalledTimes(4)
  })

  it('stays silent at zero if the visitor never interacted', () => {
    const fanfare = vi.spyOn(ocarina, 'fanfare').mockImplementation(() => {})
    mountAt('2026-11-04T23:59:58-05:00')
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000))
    expect(fanfare).not.toHaveBeenCalled()
  })

  it("Epona's Song on the keyboard rides out to Hyrule Field", () => {
    const { getByText, queryByText } = mountAt()
    expect(getByText('Kokiri Forest')).toBeTruthy()
    for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) press(key)
    expect(document.querySelector('.ocarina__title')?.textContent).toBe("You played Epona's Song")
    act(() => vi.advanceTimersByTime(1000))
    expect(getByText('Hyrule Field')).toBeTruthy()
    expect(queryByText('Kokiri Forest')).toBeNull()
  })

  it('pad buttons respond to keyboard/assistive-tech clicks', () => {
    mountAt()
    const a = document.querySelector<HTMLButtonElement>('.pad__btn[data-note="A"]')!
    act(() => a.click())
    expect(document.querySelectorAll('.staff__note')).toHaveLength(1)
  })

  it('the Song of Time shows a glimpse of launch night without touching the <time>', () => {
    const { getByText } = mountAt()
    for (const key of ['ArrowRight', 'a', 'ArrowDown', 'ArrowRight', 'a', 'ArrowDown']) press(key)
    act(() => vi.advanceTimersByTime(1000))
    expect(getByText('The legend awakens')).toBeTruthy()
    expect(times()).toHaveLength(1)
    expect(times()[0].getAttribute('datetime')).not.toBe('PT0S')
  })
})
