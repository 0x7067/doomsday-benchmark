# HANDOVER — Doomsday Clock: Ocarina of Time

## What I built

A single-screen, cinematic countdown page — a vigil, not a widget — for the
Ocarina of Time remake on Nintendo Switch 2, hitting zero at
**November 5, 2026, 00:00 Eastern Time** (`2026-11-05T00:00:00-05:00`).

**The experience.** The Great Deku Tree scene fills the viewport at night,
slowly breathing (an 80-second Ken Burns drift) under drifting fog, film
grain, and a swarm of canvas fireflies that shy away from your pointer. The
scene has gentle pointer parallax at two depths (backdrop and type move
oppositely). Centered: the Ocarina of Time logo above a large gold Cinzel
countdown — days, hours, minutes, seconds — with the seconds separated by
colons that pulse once per second. Each digit that changes "stamps" into
place with a short blurred slide, so the eye is drawn to exactly the digit
that moved. Below, the target line: `NOVEMBER 5, 2026 · MIDNIGHT ET`.
The tab title carries a live `36d 0h 0m — Doomsday Clock` readout.

**At zero.** The digits clamp at `00:00:00:00` (never negative), a single
golden flash washes the screen, and over ~3 seconds the night scene
crossfades to dawn over Death Mountain (the Epona shot) while the eyebrow
swaps to “HEY! LISTEN!” and a line fades in: *“The legend has returned —
playing now on Nintendo Switch 2.”* From then on the `<time>` reads `PT0S`
forever.

**Art direction across sizes.** Phones get the vertical poster (Link looking
up through the forest canopy) as a dedicated crop via `<picture>` art
direction; desktop gets the 4K night scene. Everything is clamped
typography/fluid gaps — verified at 390×844, 844×390, 900×700 and 1440×900.

**Testing affordance.** `?now=<ISO 8601>` behaves as "page loaded at that
instant, then keeps ticking" (verified live across the zero crossing). While
active, a small `sim · …` chip in the corner says so, so nobody mistakes a
simulated run for the real clock. An unparseable value is ignored silently.

**Accessibility / restraint.** Exactly one `<time>` element carries the
remaining ISO 8601 duration (`P36DT23H59M42S`, `PT0S` at zero) with a
sentence-form `aria-label`; no `aria-live` spam. Every animation — Ken Burns,
parallax, fireflies, digit stamps, the zero flash — is disabled under
`prefers-reduced-motion`. Fully offline: fonts (Cinzel, Cormorant Garamond —
OFL, woff2 in `public/fonts/`) and all imagery are self-hosted; no requests
leave the origin.

## Code organization (`app/`)

```
src/
  lib/
    time.ts                    # target instant, remainingTo(), formatISODuration(), ?now parsing
    useNow.ts                  # second-aligned ticking clock hook (self-correcting, resyncs on visibility)
    usePointerParallax.ts      # eases --px/--py custom properties for layered parallax
    usePrefersReducedMotion.ts # live-tracked reduced-motion query
  components/
    Backdrop.tsx               # night/dawn scene layers, fog, vignette, grain
    Fireflies.tsx              # canvas particles (DPR-aware, pointer repulsion)
    Countdown.tsx              # the single <time> element + digit stamp animation
    SimBadge.tsx               # “sim · …” chip when ?now is active
  App.tsx                      # composition, zero-crossing flash, tab title
  index.css                    # fonts, design tokens, reset
  app.css                      # all component styles (layered: backdrop → content → chrome → responsive → reduced motion)
public/
  images/                      # forest-night.avif (4K), forest-poster.avif (portrait, re-encoded 217 KB),
                               # dawn.avif, oot-logo.png, og.jpg (social card)
  fonts/                       # cinzel-var.woff2, cormorant-garamond[-italic].woff2 (preloaded)
```

No runtime dependencies beyond React. Assets were re-encoded where it paid
(the 2.9 MB portrait JPG became a 217 KB AVIF; the 2.8 MB PNG wallpaper was
dropped in favor of the existing AVIFs).

## How I verified it

- `npm run lint` (oxlint) and `npm run build` (tsc -b + vite) pass clean.
- Screenshots at 1440×900, 900×700, 844×390, 390×844 via `./shot` — no
  console errors or uncaught exceptions in any run.
- Live zero crossing: `?now=2026-11-04T23:59:50-05:00` sampled via Playwright
  showed `PT10S → PT9S → PT7S → PT5S → PT3S → PT0S`, `is-released` flipping
  exactly at zero, dawn opacity animating 0 → 1, eyebrow → “Hey! Listen!”, note
  fading in.
- Contract checks: exactly one `<time>` in the DOM in all cases; far-past
  `?now=2027…` → stable `PT0S`; `?now=garbage` → ignored, real clock;
  `?now=2026-01-01…` → three-digit days (`307:23:59:59`) laid out correctly;
  `prefers-reduced-motion: reduce` → page renders and counts correctly.
- Production build served via `vite preview`: same behavior, zero console
  errors; grep of `dist/` confirms no external URLs are referenced at runtime.

## Known gaps / honest notes

- The tick is aligned to wall-clock second boundaries rather than the exact
  instant the displayed value rolls over (±25 ms slop), which is imperceptible.
- Headless Chromium couldn't exercise every real-device behavior (safe-area
  insets, coarse-pointer detection, actual sleep/throttle recovery); those
  paths are straightforward but verified by code review only.
- The firefly swarm is decorative and canvas-based; on very low-end phones
  it's the main per-frame cost (~70 sprites), but it disables entirely under
  reduced motion.
- The dawn artwork on phones is the landscape crop (there is no portrait
  variant of that shot); it reads well but is the one compromise in the mobile
  composition.
- `P36DT0H0M47S`-style durations keep all four units when days are present
  (valid ISO 8601, zero-suppressed only when leading) — matching the brief’s
  `PT0S` convention.
