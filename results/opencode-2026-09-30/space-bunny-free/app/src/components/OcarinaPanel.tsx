import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Reveal } from './Reveal.tsx'
import {
  DEFAULT_PITCH,
  OCARINA_KEYS,
  OCARINA_PITCHES,
  SONG_OF_TIME,
  createOcarina,
  frequencyFor,
  noteName,
} from '../lib/ocarina.ts'
import type { OcarinaKeyId } from '../lib/ocarina.ts'
import styles from './OcarinaPanel.module.css'

/** The A–D–F figure the Song of Time plays, stacked into a reward chord. */
const OPENING_CHORD = [220, 261.63, 329.63, 440, 523.25]

/** Ocarina button -> keyboard. The four C buttons are the arrow cluster. */
const KEY_TO_KEYBOARD: Record<OcarinaKeyId, string> = {
  left: 'ArrowLeft',
  up: 'ArrowUp',
  right: 'ArrowRight',
  down: 'ArrowDown',
  a: 'KeyA',
}

/**
 * Instrument geometry.
 *
 * One source of truth: the SVG draws its wells from BUTTONS, and the real
 * <button> elements are positioned from the same numbers, so the artwork and
 * the hit targets can never drift apart.
 */
const VIEWBOX = { x: 46, y: 0, w: 208, h: 232 }

const BUTTONS: Record<OcarinaKeyId, { x: number; y: number; r: number }> = {
  up: { x: 150, y: 84, r: 20 },
  left: { x: 104, y: 138, r: 20 },
  right: { x: 196, y: 138, r: 20 },
  a: { x: 150, y: 138, r: 21 },
  down: { x: 150, y: 186, r: 20 },
}

const toPercent = (point: { x: number; y: number }) =>
  ({
    left: `${(((point.x - VIEWBOX.x) / VIEWBOX.w) * 100).toFixed(3)}%`,
    top: `${((point.y / VIEWBOX.h) * 100).toFixed(3)}%`,
  }) as CSSProperties

interface Props {
  doorOpen: boolean
  onDoorChange(open: boolean): void
}

export function OcarinaPanel({ doorOpen, onDoorChange }: Props) {
  const voice = useMemo(() => createOcarina(), [])
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)
  const [progress, setProgress] = useState(0)
  const [fault, setFault] = useState<'note' | 'pitch' | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const [hinting, setHinting] = useState<OcarinaKeyId | null>(null)
  const [hintDone, setHintDone] = useState(false)
  const timers = useRef<number[]>([])
  // The arrow keys only play the instrument while the instrument is on screen,
  // or while it holds focus. Without this the panel would swallow arrow-key
  // scrolling for the whole page, which is a keyboard trap, not a shortcut.
  const onScreen = useRef(false)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = panelRef.current
    if (!node || typeof IntersectionObserver !== 'function') {
      onScreen.current = true
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onScreen.current = entry.isIntersecting
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // The audio graph is created lazily on the first gesture, so there is nothing
  // to tear down on unmount — and disposing in an effect cleanup would break
  // under StrictMode's deliberate mount/unmount/mount. `pagehide` is the one
  // moment we really want the context gone.
  useEffect(() => {
    const onPageHide = () => voice.dispose()
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [voice])

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const play = useCallback(
    (key: OcarinaKeyId) => {
      if (!soundOn) return
      voice.play(frequencyFor(key, pitch), key === 'a' ? 1 : 0.8)
    },
    [pitch, soundOn, voice],
  )

  /**
   * Advance the song, or start it over. A wrong note never punishes — it just
   * starts the tune again.
   *
   * The transposition is part of the test, not decoration: the Song of Time is
   * written on A4, and the default tuning already is, so playing the six notes
   * without touching anything is the happy path. Moving the tuning and then
   * playing them correctly gets you a specific, fixable answer.
   */
  const press = useCallback(
    (key: OcarinaKeyId) => {
      play(key)
      if (doorOpen) return

      const expected = SONG_OF_TIME[progress]
      const noteFits = key === expected
      const pitchFits = pitch === DEFAULT_PITCH

      if (noteFits && pitchFits) {
        const next = progress + 1
        setFault(null)
        if (next === SONG_OF_TIME.length) {
          setProgress(0)
          setHintDone(false)
          clearTimers()
          setHinting(null)
          voice.chord(OPENING_CHORD, 2.4)
          onDoorChange(true)
        } else {
          setProgress(next)
        }
        return
      }

      // A note that is right for the tune but played on the wrong tuning is
      // reported whatever the progress, because at the wrong tuning the
      // progress can never advance past zero and would otherwise never be
      // reported at all.
      const kind: typeof fault = noteFits ? 'pitch' : progress > 0 ? 'note' : null
      if (kind) {
        setFault(kind)
        timers.current.push(window.setTimeout(() => setFault(null), 1600))
      }
      setProgress(0)
    },
    [clearTimers, doorOpen, onDoorChange, pitch, play, progress, voice],
  )

  /** Plays the tune through and lights each key as it sounds. */
  const hint = useCallback(() => {
    if (doorOpen) return
    clearTimers()
    setProgress(0)
    setHintDone(false)
    setHinting(null)
    setFault(null)

    SONG_OF_TIME.forEach((key, index) => {
      timers.current.push(
        window.setTimeout(
          () => {
            setHinting(key)
            play(key)
          },
          300 + index * 540,
        ),
      )
    })

    timers.current.push(
      window.setTimeout(
        () => {
          setHinting(null)
          setHintDone(true)
        },
        300 + SONG_OF_TIME.length * 540,
      ),
    )
  }, [clearTimers, doorOpen, play])

  const retune = useCallback(
    (next: number) => {
      setPitch(next)
      setHintDone(false)
      setProgress(0)
      setFault(null)
      clearTimers()
      setHinting(null)
    },
    [clearTimers],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return

      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return

      const focusedInside = Boolean(panelRef.current?.contains(target ?? null))
      if (!onScreen.current && !focusedInside) return

      const hit = OCARINA_KEYS.find((key) => KEY_TO_KEYBOARD[key.id] === event.code)
      if (hit) {
        event.preventDefault()
        press(hit.id)
        return
      }
      if (/^Digit[1-4]$/.test(event.code) && (focusedInside || !onScreen.current)) {
        event.preventDefault()
        retune(Number(event.code.slice(5)) - 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [press, retune])

  const notesLeft = SONG_OF_TIME.length - progress
  const readout = doorOpen
    ? 'The door of time is open.'
    : fault === 'pitch'
      ? `Right notes, wrong tuning. Set it on ${OCARINA_PITCHES[DEFAULT_PITCH]?.label}.`
      : fault === 'note'
        ? 'Not that one. Start again.'
        : progress > 0
          ? `${notesLeft} note${notesLeft === 1 ? '' : 's'} to go`
          : hintDone
            ? 'Now you try.'
            : pitch === DEFAULT_PITCH
              ? 'Six notes. Tuned and ready.'
              : `Six notes, on ${OCARINA_PITCHES[pitch]?.label}.`

  return (
    <section
      id="song"
      className={`shell ${styles.section}`}
      aria-labelledby="song-heading"
      data-door={doorOpen ? 'open' : 'shut'}
    >
      <Reveal className={styles.intro}>
        <p className="eyebrow">III &nbsp;·&nbsp; The Song of Time</p>
        <h2 id="song-heading" className={`display ${styles.heading}`}>
          Play it, and the door opens.
        </h2>
        <p className={styles.body}>
          Tune it to <em>A4</em> — which it already is — then play <em>C ▶</em>, <em>A</em>, <em>C ▼</em>, and
          all three again. It will not move the clock. It was never going to move the clock.
        </p>
      </Reveal>

      <Reveal as="div" className={styles.stage} delay={120} observerRef={panelRef}>
        <div className={styles.instrument} data-wrong={fault !== null ? 'true' : 'false'}>
          <div className={styles.canvas}>
            <OcarinaArt />
            {OCARINA_KEYS.map((key) => {
              return (
                <button
                  key={key.id}
                  type="button"
                  className={styles.hole}
                  data-key={key.id}
                  style={toPercent(BUTTONS[key.id])}
                  data-active={hinting === key.id ? 'true' : 'false'}
                  aria-label={`Play ${key.name}`}
                  onClick={() => press(key.id)}
                />
              )
            })}
          </div>
          <p className={styles.instrumentCaption}>
            A clay ocarina, four C buttons and an A, and a hole on each side.
          </p>
        </div>

        <div className={styles.console}>
          <div className={styles.readout}>
            <span className={styles.readoutLabel}>Song of Time</span>
            <span className={styles.pips} aria-hidden="true">
              {SONG_OF_TIME.map((key, index) => (
                <span
                  key={`${key}-${index}`}
                  className={styles.pip}
                  data-on={index < progress ? 'true' : 'false'}
                />
              ))}
            </span>
            <p className={styles.readoutValue} data-readout="" data-tone={fault ?? 'calm'}>
              {readout}
            </p>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel} id="pitch-label">
              Transpose
            </span>
            <div className={styles.pitchRow} role="group" aria-labelledby="pitch-label">
              {OCARINA_PITCHES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.pitchButton}
                  aria-pressed={pitch === option.id}
                  onClick={() => retune(option.id)}
                >
                  <span className={styles.pitchName}>{option.label}</span>
                  <span className={styles.pitchKey} aria-hidden="true">
                    {option.id + 1}
                  </span>
                </button>
              ))}
            </div>
            <p className={styles.fieldNote}>
              Set on {OCARINA_PITCHES[pitch]?.label}, so C ▶ sounds {noteName(frequencyFor('right', pitch))}.
              The Song of Time is written on {noteName(frequencyFor('right', DEFAULT_PITCH))}
              {pitch === DEFAULT_PITCH ? ' — as it is now.' : '.'}
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              data-action="sound"
              aria-pressed={soundOn}
              onClick={() => {
                const next = !soundOn
                voice.setEnabled(next)
                setSoundOn(next)
                if (next) play('right')
              }}
            >
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
            <button
              type="button"
              className={styles.action}
              data-action="hint"
              onClick={hint}
              disabled={doorOpen}
            >
              Play the tune
            </button>
            <button
              type="button"
              className={styles.action}
              data-action="door"
              onClick={() => {
                onDoorChange(false)
                setProgress(0)
              }}
            >
              {doorOpen ? 'Close the door' : 'Reset'}
            </button>
          </div>

          <p className={styles.help}>
            <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> for the C buttons, <kbd>A</kbd> for the A
            button, <kbd>1</kbd>–<kbd>4</kbd> to transpose. Every button on the instrument is tappable too.
          </p>
        </div>
      </Reveal>

      <p className="visually-hidden" role="status">
        {doorOpen
          ? 'The door of time is open.'
          : progress > 0
            ? `${progress} of ${SONG_OF_TIME.length} notes of the Song of Time played.`
            : ''}
      </p>
    </section>
  )
}

/** The instrument itself: decorative, and mirrored by real buttons on top. */
function OcarinaArt() {
  return (
    <svg
      className={styles.ocarina}
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="clay" x1="0.18" y1="0" x2="0.82" y2="1">
          <stop offset="0" stopColor="#6fdcf5" />
          <stop offset="0.4" stopColor="#2f97cb" />
          <stop offset="0.78" stopColor="#1a6a9c" />
          <stop offset="1" stopColor="#0d3f63" />
        </linearGradient>
        <linearGradient id="clayRim" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#e2f8ff" />
          <stop offset="0.45" stopColor="#6cc4e6" />
          <stop offset="1" stopColor="#1a5c85" />
        </linearGradient>
        <linearGradient id="spout" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2f8ff" />
          <stop offset="1" stopColor="#2f97cb" />
        </linearGradient>
        <radialGradient id="well" cx="0.38" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#0c3348" />
          <stop offset="0.7" stopColor="#06202f" />
          <stop offset="1" stopColor="#020e16" />
        </radialGradient>
        <radialGradient id="wellLip" cx="0.4" cy="0.28" r="0.8">
          <stop offset="0.6" stopColor="#06202f" />
          <stop offset="1" stopColor="#3ea9d4" />
        </radialGradient>
        <radialGradient id="sheen" cx="0.3" cy="0.16" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Spout — the part you put your mouth on. */}
      <path
        d="M133 46 L139 16 Q150 4 161 16 L167 46 Z"
        fill="url(#spout)"
        stroke="url(#clayRim)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="150" cy="17" rx="9" ry="3.6" fill="#0a2a3c" />

      {/* Body: a fat teardrop, the classic ocarina silhouette. */}
      <path
        d="M150 30 C 206 58 234 102 234 136 C 234 188 196 218 150 218 C 104 218 66 188 66 136 C 66 102 94 58 150 30 Z"
        fill="url(#clay)"
        stroke="url(#clayRim)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M150 30 C 206 58 234 102 234 136 C 234 188 196 218 150 218 C 104 218 66 188 66 136 C 66 102 94 58 150 30 Z"
        fill="url(#sheen)"
      />

      {/* Finger holes along the lower belly — decoration, not buttons. */}
      <g fill="#0b3b56" opacity="0.55">
        <circle cx="112" cy="200" r="4.2" />
        <circle cx="132" cy="206" r="4.2" />
        <circle cx="168" cy="206" r="4.2" />
        <circle cx="188" cy="200" r="4.2" />
      </g>

      {/* Triforce, cast into the crown above the C-up button. */}
      <g transform="translate(150 60) scale(0.62)" className={styles.inlay}>
        <path d="M0 -18 L-9 0 L9 0 Z M-9 0 L0 -18 L-4.5 -9 Z M-9 0 L0 9 L-4.5 0 Z M0 9 L9 0 L4.5 0 Z" />
      </g>

      {/* Button wells: a lit lip, then the hole. */}
      {OCARINA_KEYS.map((key) => (
        <g key={key.id}>
          {key.id === 'a' && (
            <circle
              cx={BUTTONS.a.x}
              cy={BUTTONS.a.y}
              r="30"
              fill="none"
              stroke="url(#clayRim)"
              strokeWidth="2.6"
              opacity="0.75"
            />
          )}
          <circle
            cx={BUTTONS[key.id].x}
            cy={BUTTONS[key.id].y}
            r={BUTTONS[key.id].r + 5}
            fill="url(#wellLip)"
          />
          <circle cx={BUTTONS[key.id].x} cy={BUTTONS[key.id].y} r={BUTTONS[key.id].r} fill="url(#well)" />
        </g>
      ))}
    </svg>
  )
}
