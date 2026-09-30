# Ocarina of Time — launch countdown

A single-page, front-end-only countdown to **The Legend of Zelda: Ocarina of Time** on
Nintendo Switch 2 — midnight Eastern, November 5, 2026 (`2026-11-05T00:00:00-05:00`).

No backend. No runtime requests to other origins: fonts, artwork and sounds are all bundled
or synthesised locally.

## Commands

```bash
npm install     # dependencies are already installed in this checkout
npm run dev     # Vite dev server
npm run build   # tsc -b && vite build  → dist/
npm run lint    # oxlint
npm run preview # serve the production build
```

## Time travel

Append `?now=<ISO 8601 timestamp>` and the page behaves as if it loaded at that instant,
then keeps ticking:

```
/?now=2026-11-04T23:59:50-05:00   # ten seconds left, then the release moment
/?now=2026-11-05T00:00:01-05:00   # already released
```

## Layout of the source

```
src/
  App.tsx                    page composition and the tab-title clock
  main.tsx                   React root
  lib/
    time.ts                  release instant, ?now parsing, unit split, ISO 8601 duration
    audio.ts                 Web Audio ocarina/bell synthesis (no audio files)
    calendar.ts              .ics generation + share/clipboard helpers
    random.ts                deterministic pseudo-random for decorative layouts
  hooks/
    useCountdown.ts          virtual clock → countdown snapshot, `justReleased` edge
    useSound.ts              single source of truth for audio mute state
    useReducedMotion.ts      prefers-reduced-motion tracking
    useScrollFx.ts           parallax + reveal-on-scroll observers
  components/
    Hero.tsx                 key art, logo, countdown, calls to action
    Countdown.tsx            the <time> element and its four units
    Embers.tsx               canvas embers
    Navi.tsx                 the pointer-following fairy
    HyruleChapter.tsx        "Return to Hyrule" (Deku Tree art)
    OcarinaChapter.tsx       "Play the Song of Time" (forest art + instrument)
    Ocarina.tsx              the five-note instrument and its easter egg
    ReleaseBurst.tsx         zero-moment celebration
    Footer.tsx               small print
    Icons.tsx                inline SVG icons
  styles/
    fonts.css                self-hosted Cinzel + Inter
    global.css               reset, design tokens, shared utilities
  assets/
    art/                     key art, logo (AVIF/PNG)
    fonts/                   woff2 subsets, latin + latin-ext
```

## Notes

- The remaining time is exposed as a single `<time>` element whose `datetime` is an
  ISO 8601 duration (`P36DT2H43M53S`, or `PT0S` once the moment has passed). It wraps the
  visible countdown.
- The countdown never shows negative numbers; at zero it switches to the release state.
- All sound is synthesised with the Web Audio API and stays muted until the visitor opts in.
