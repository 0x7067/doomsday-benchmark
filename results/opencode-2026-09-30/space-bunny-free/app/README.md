# T-minus Ocarina of Time

A live countdown to the release of **The Legend of Zelda: Ocarina of Time** on Nintendo Switch 2.
The gate opens at midnight Eastern on 5 November 2026.

Front-end only. React, Vite and TypeScript. No backend, no runtime network calls, no analytics —
fonts, images and every note of the Ocarina of Time are served from the bundle.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run preview
npm run lint       # oxlint
npm run format     # prettier --write .
```

## The clock

The whole site is downstream of one object. `createVirtualClock()` reads `performance.now()`, not
`Date.now()`, so a corrected system clock or a throttled background tab cannot make it drift, and it
notifies subscribers when the _displayed second_ changes rather than on a drifting interval.

| URL                | Behaviour                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Counts down to `2026-11-05T00:00:00-05:00` in real time.                                                                          |
| `/?now=<ISO 8601>` | The page behaves as if it loaded at that instant, then keeps ticking. An unparseable value is ignored and the real clock is used. |

The remaining time is exposed as the single `<time>` element in the hero, whose `datetime` is an ISO
8601 duration (`P37DT11H10M5S`), updated every tick. From the moment the gate opens it reads `PT0S`
and holds — there are no negative numbers and nothing re-lays-out.

The clock face reads the wall clock **in the moment's own timezone**, so the hands sweep normally
today and land exactly on twelve at midnight Eastern wherever the visitor happens to be.

## Layout

```
src/
  lib/
    release.ts     The moment. One constant, one timezone.
    time.ts        Breakdown, ISO 8601 durations, the urgency ramp, timezone reading.
    clock.ts       The monotonic virtual clock and the ?now= parser.
    useClock.ts    Context plus the hooks: useRemaining, useUrgency, useAnimationFrame, …
    useInView.ts   Scroll reveal, with an idle fallback (see below).
    ocarina.ts     Web Audio synthesis, the note table and the Song of Time.
  components/      One component per file, each with a CSS module.
  styles/          Design tokens, then reset and global primitives.
  assets/img/      Every image, re-encoded and sized for the box it is drawn in.
public/fonts/      Three self-hosted variable woff2 files, latin subset.
```

## Things worth knowing before you change it

Five of these have already cost me time, so they are worth reading once before editing.

- **The scroll reveal has an idle fallback.** Content fades up on intersection, but if nobody has
  scrolled, touched or pressed anything within 2.4 s, every pending reveal fires at once. A page
  whose content is `opacity: 0` until observed is content that is _missing_ to a screen reader
  walking the DOM, to a print stylesheet, and to any full-page capture. The first real interaction
  cancels the fallback and the observer takes over from then on.
- **`<picture>` is forced to `display: block` in `base.css`.** It is inline by default, which makes
  `height: 100%` on the image inside it resolve against an auto-height box, so the image quietly
  falls back to its intrinsic aspect ratio and stops filling its frame.
- **The clock hands are driven imperatively.** `DoomsdayDial` writes `style.transform` from a
  `requestAnimationFrame` loop and re-renders React once a second. Do not move that work into
  render state — it would re-diff a hero-sized tree sixty times a second to change one character.
- **The Ocarina listens for the arrow keys only while its panel is on screen or holds focus.**
  Without that gate the panel is a keyboard trap that swallows arrow-key scrolling page-wide.
- **`?now=` never touches the URL.** The engine room moves the clock's own timeline, so every
  component is exercised through exactly the code path real time would use.

## Assets

Every image in `src/assets/img/` is a re-encode of one of the five supplied files, cut to the size
it is actually drawn at. The originals are not in the repo.

| Source                            | Used as                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `thumb-1920-1414762.png` (2.8 MB) | `forest-{800,1280,1920}.webp` — the hero backdrop                                                |
| `8a1enblo1b6h1.png` (279 KB)      | `logo.webp` — trimmed to its alpha bounding box, lossy WebP with a lossless-quality alpha filter |
| `f55hr5n4xdoh1.jpg` (2.9 MB)      | `poster-{360,560,900}.webp` — the gallery plate and the hero rail                                |
| `…great-deku-tree….avif` (483 KB) | `deku-{560.webp,800,1280,1920.avif}` — section I and the gallery                                 |
| `…epona….avif` (158 KB)           | `epona-{560.webp,800,1280,1920.avif}` — the gallery                                              |

Fonts are Cinzel (display, numerals, Roman numerals on the dial), Archivo (body) and Barlow
Condensed (labels), all latin-subset variable woff2 totalling 76 kB.

## Credits

An unofficial fan project, built as a demonstration. Not affiliated with or endorsed by Nintendo.
The Legend of Zelda and Ocarina of Time are trademarks of Nintendo. The supplied screenshots are
Nintendo promotional material, used here as supplied.
