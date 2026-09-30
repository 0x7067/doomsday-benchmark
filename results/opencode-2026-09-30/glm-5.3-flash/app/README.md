# Doomsday Clock — The Legend of Zelda: Ocarina of Time

A fan-made, single-page countdown to the release of the Ocarina of Time
remake on Nintendo Switch 2: **November 5, 2026, midnight Eastern Time**
(`2026-11-05T00:00:00-05:00`).

Everything is bundled — fonts, images, favicon — so the page runs fully
offline from any static host.

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Time travel (for testing)

Append `?now=<ISO 8601 timestamp>` to behave as if the page loaded at that
instant, then keep ticking from there:

```
/?now=2026-11-04T23:59:50-05:00   → 10 seconds left, crosses zero live
/?now=2026-11-06T00:00:00-05:00   → already released
```

An invalid value is ignored and the real clock is used. While a simulated
clock is active, a small `sim · …` chip in the corner says so.

## How it works

- `src/lib/time.ts` — the target instant, `remainingTo()` (ceil-rounded whole
  seconds, never negative), `formatISODuration()` (ISO 8601 duration such as
  `P37DT11H10M5S`, `PT0S` at zero), and `?now` parsing.
- `src/lib/useNow.ts` — a hook that re-renders once per second, aligned to
  wall-clock second boundaries. Every tick recomputes from `Date.now()`, so
  throttled tabs and sleeps self-correct; becoming visible re-syncs instantly.
- `src/components/Countdown.tsx` — the single `<time>` element whose
  `datetime` attribute carries the remaining ISO 8601 duration on every tick;
  per-digit stamp animation when a digit actually changes.
- `src/components/Backdrop.tsx` — layered scene: night artwork (portrait crop
  on narrow screens), a dawn layer that crossfades in at zero, fog, vignette,
  grain.
- `src/components/Fireflies.tsx` — canvas motes drifting upward, gently
  repelled by the pointer.
- `src/lib/usePointerParallax.ts` — eases `--px`/`--py` CSS custom properties
  ([-1, 1]) onto the scene root; backdrop and content compose different depths
  via `calc()`.
- All motion (Ken Burns, digit stamps, parallax, fireflies) is disabled for
  `prefers-reduced-motion`.

When the moment arrives the countdown clamps at `00:00:00:00`
(`datetime="PT0S"`), the scene crossfades from the Great Deku Tree at night to
dawn over Death Mountain, and the headline swaps to “Hey! Listen!”.

## Assets

Promotional artwork for the (fictional) remake, from the run’s `assets/`
directory; fonts are Cinzel and Cormorant Garamond (SIL Open Font License),
self-hosted as woff2 in `public/fonts/`. Fan project — not affiliated with
Nintendo.
