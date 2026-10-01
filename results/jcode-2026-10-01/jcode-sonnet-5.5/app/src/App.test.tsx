import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Loads a fresh App (and a fresh clock) for the given query string. */
async function mount(search: string) {
  vi.resetModules()
  window.history.replaceState(null, '', `/${search}`)
  const { default: App } = await import('./App')
  return render(<App />)
}

const timeEls = () => document.querySelectorAll('time')

describe('App', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders exactly one <time> with the remaining ISO duration', async () => {
    await mount('?now=2026-10-29T12:49:55-04:00')
    expect(timeEls()).toHaveLength(1)
    // 2026-11-05T00:00 EST minus 2026-10-29T12:49:55 EDT (= 11:49:55 EST)
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('P6DT12H10M5S')
  })

  it('ticks every second, reaches zero on time, then reads PT0S forever', async () => {
    await mount('?now=2026-11-04T23:59:50-05:00')
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('P0DT0H0M10S')

    await act(async () => void vi.advanceTimersByTime(1000))
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('P0DT0H0M9S')

    await act(async () => void vi.advanceTimersByTime(8000))
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('P0DT0H0M1S')
    expect(screen.queryByText(/is open/i)).toBeNull()

    await act(async () => void vi.advanceTimersByTime(1000))
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('PT0S')
    expect(screen.getByText(/The Door of Time is open/i, { selector: 'h1 span' })).toBeTruthy()

    await act(async () => void vi.advanceTimersByTime(60_000))
    expect(timeEls()).toHaveLength(1)
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('PT0S')
  })

  it('shows the arrival state straight away when loaded after the moment', async () => {
    await mount('?now=2027-01-01T00:00:00-05:00')
    expect(timeEls()[0]?.getAttribute('datetime')).toBe('PT0S')
    expect(document.body.textContent).not.toMatch(/-\d/)
  })

  it('plays the Song of Time from the keyboard and reveals hundredths', async () => {
    await mount('?now=2026-10-29T12:49:55-04:00')
    expect(document.querySelector('.hundredths')).toBeNull()
    for (const key of ['ArrowRight', 'a', 'ArrowDown', 'ArrowRight', 'a', 'ArrowDown']) {
      fireEvent.keyDown(window, { key })
    }
    expect(document.querySelector('.hundredths')).not.toBeNull()
    expect(document.querySelector('.toast__name')?.textContent).toBe('Song of Time')
    // It lets go again after a few seconds.
    await act(async () => void vi.advanceTimersByTime(9500))
    expect(document.querySelector('.hundredths')).toBeNull()
  })

  it('Sun\'s Song and the Song of Storms toggle the sky', async () => {
    const { container } = await mount('?now=2026-10-29T12:49:55-04:00')
    const app = container.querySelector('.app')
    const play = (keys: string[]) => keys.forEach((key) => fireEvent.keyDown(window, { key }))
    play(['ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowUp'])
    expect(app?.getAttribute('data-day')).toBe('true')
    play(['a', 'ArrowDown', 'ArrowUp', 'a', 'ArrowDown', 'ArrowUp'])
    expect(app?.getAttribute('data-rain')).toBe('true')
  })

  it('switches scenes with the thumbnails', async () => {
    await mount('')
    const field = screen.getByRole('radio', { name: /Hyrule Field/i })
    fireEvent.click(field)
    expect(field.getAttribute('aria-checked')).toBe('true')
  })

  it('opens the songbook', async () => {
    await mount('')
    fireEvent.click(screen.getByRole('button', { name: /Songbook/i }))
    expect(document.querySelector('dialog')?.hasAttribute('open')).toBe(true)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6)
  })
})
