# Ocarina of Time: the countdown

A launch countdown for *The Legend of Zelda: Ocarina of Time* on Nintendo Switch 2, which reaches zero at
**midnight Eastern, November 5, 2026** (`2026-11-05T00:00:00-05:00`). It's frontend-only (React 19, Vite 8,
TypeScript), everything is self-hosted, and it makes no requests to other origins.

```sh
npm install
npm run dev            # http://localhost:5173
```

Append `?now=<ISO 8601>` to start the clock at any instant; it keeps ticking in real time from there:

| URL | What you see |
| --- | --- |
| `/?now=2026-11-04T23:59:50-05:00` | The last 10 seconds: the Song of Time plays itself, then the Door of Time opens |
| `/?now=2026-12-01T00:00:00Z` | After launch: the arrival state, `datetime="PT0S"` |
| `/?now=2020-01-01T00:00:00Z` | A four-digit day count (the clock shrinks to fit) |

An unencoded `+02:00` offset (which query strings turn into a space) is repaired. An unparseable value is
ignored with a console warning.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run lint` | oxlint |
| `npm test` | Unit tests (Vitest), about 0.5 s |
| `npm run test:e2e` | Playwright against the production build in Chrome, Pixel 7, Safari, iPhone 14 and Firefox. First run: `npx playwright install chromium webkit firefox` |
| `npm run images` | Regenerates every image derivative from `art/` (sharp); output is committed |

## How it fits together

```
src/
  main.tsx               Reads ?now, builds the clock and countdown store, mounts <App>
  App.tsx                Composition root: world state, layout, wiring between features
  config/launch.ts       The launch instant and names: the one fact everything hangs off

  lib/                   Framework-free logic (unit-tested where it has logic)
    time/                clock + ?now parsing, the countdown store, ISO durations, local time, tab title
    ocarina/             the five notes (pitches, keys) and six songs + matcher
    scenes/              scene catalogue (art, focus points, particles) and srcset assembly
    audio/synth.ts       Web Audio synth: ocarina voice, jingles, rain, thunder
    calendar.ts          RFC 5545 .ics builder
    layout.ts            the two layout media queries shared by JS and CSS
    pointer.ts           pointer tracking for parallax and particles

  features/
    countdown/           the visible clock, the single <time>, details, finale, arrival
    backdrop/            full-bleed art: art direction, cross-fades, parallax, night/storm grades
    atmosphere/          canvas particles (fireflies, leaves, pollen, rain, sparks)
    ocarina/             the playable instrument: dock/sheet, staff, buttons, songbook, Navi
    world/               reducer: what songs do to scene, sky and weather
    effects/             one-shot overlays: time warp, Triforce, lightning
    hud/                 places, area title card, sound toggle
  styles/                design tokens and base styles
e2e/                     the brief's contract, end to end
art/                     image masters (not bundled)
scripts/                 image pipeline
```

### Time

- **One source of truth.** `createCountdownStore` (for `useSyncExternalStore`) holds "whole seconds remaining".
  It aims each timeout at the next second boundary and re-derives the value from the clock when it fires, so it
  doesn't drift like `setInterval(1000)`. It also re-syncs when a throttled background tab becomes visible.
- **Rounded up.** With 9.4 s left the page shows 10, and zero appears at the exact instant of launch rather than
  a second early.
- **`?now`** gives a clock offset: `now() = Date.now() + (startAt − loadTime)`. It is compatible with Playwright's
  fake clock, which the e2e tests use for exact assertions.
- **Exactly one `<time>`** (`features/countdown/RemainingTime.tsx`). Its `datetime` is always
  `P{d}DT{h}H{m}M{s}S` while time remains, then `PT0S`. It's visually hidden, with readable text for screen
  readers. The visible digits animate (so their text is briefly doubled) and are `aria-hidden`. **Don't add other
  `<time>` elements**, including for the release date.

### Layout

Two independent media queries, defined once in `lib/layout.ts` and repeated in CSS:

- `LANDSCAPE_QUERY`: characters left, clock column right; otherwise a stacked column over portrait art.
- `ROOMY_QUERY`: the ocarina stays open as a bar and places sit in the top bar; otherwise the ocarina becomes a
  launcher button and bottom sheet. Landscape phones are landscape but not roomy.

The clock sizes itself from its container's width (and caps at 16vh), so 3–5 digit day counts still fit on
one line.

### Images

`npm run images` turns the masters in `art/` into AVIF + WebP at several widths, including portrait crops centred on
each scene's subject for phones, plus 32px blurred placeholders and the 1200×630 share card. `lib/scenes/images.ts`
picks the files up by name through `import.meta.glob`. The active scene loads at high priority; the other two
warm up when the browser is idle (skipped under Save-Data), so songs can switch scenes instantly.

### Sound

Everything is synthesized, so there are no audio files and it works offline. Notes use the game's pitches (A = D4,
▼ = F4, ► = A4, ◄ = B4, ▲ = D5). Browsers only allow audio after a gesture, so `synth.unlock()` runs from
pointer, key and click handlers. Until then, and while muted, every call is a silent no-op.

### Motion and accessibility

`prefers-reduced-motion` removes the particle canvas, parallax, drift and lightning, and turns the digit rolls
and warps into fades. Every control is a real button with a visible focus ring, the notes have
`aria-keyshortcuts`, completed songs are announced through a `status` region, and the clock isn't a live region,
so it doesn't chatter every second.
