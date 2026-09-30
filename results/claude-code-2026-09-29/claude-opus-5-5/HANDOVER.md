# Handover: Ocarina of Time countdown

A launch countdown for *The Legend of Zelda: Ocarina of Time* on Nintendo Switch 2. It hits zero at
**2026-11-05T00:00:00-05:00**. The code is in `app/`; engineering detail is in `app/README.md`.

```sh
cd app && npm install && npm run dev
# then try  /?now=2026-11-04T23:59:50-05:00   (the final ten seconds and the launch)
#           /?now=2026-12-01T00:00:00Z        (after launch)
```

## What I built

**The idea: the countdown is played on the Ocarina of Time.** The main key art shows Young Link *holding the
ocarina*, so the page's interaction is the instrument, and the songs change the world behind the clock.

- **The clock.** Big gold Cinzel numerals with days, hours, minutes and seconds. Digits roll in and out, and the separators
  pulse on every tick. The clock fits its column at any day count (tested up to 5 digits).
- **Scenes from the assets.** Kokiri Forest is the opening scene, with a purpose-made portrait art direction for phones. The
  Great Deku Tree is where the game begins, and where the page goes at launch. Hyrule Field is the adult era. The
  backdrop has a slow push-in, pointer parallax, and canvas particles per scene: fireflies that scatter from your
  cursor, falling Deku leaves, drifting pollen. Changing scene shows the game's area title card ("Hyrule Field —
  Seven years later").
- **A playable ocarina.** Hold **A** and the **arrow keys**, or press the N64-style buttons. It uses the game's pitches,
  in a synthesized voice that sustains while held and has breath and vibrato. Notes land on a five-line staff by
  pitch. Six real songs are recognized. Each plays the "secret found" jingle and does something:

  | Song | Does |
  | --- | --- |
  | Song of Time ► A ▼ ► A ▼ | Time travel: white-out, the scene cuts to the other era under the flash |
  | Epona's Song / Saria's Song | Ride out to Hyrule Field / return to Kokiri Forest |
  | Sun's Song | Day ↔ night (moonlit grade, more fireflies) |
  | Song of Storms | Rain, lightning and thunder for ~26 s |
  | Zelda's Lullaby | The Triforce assembles behind the clock |

  A songbook plays any song for you. Places (top bar on desktop, inside the ocarina sheet on phones) jump
  straight to a scene.
- **Navi.** She appears once, after 7 s without play, in the game's blue text box: "Hey! Listen! Play the Song of
  Time…". She leaves as soon as you play or dismiss her, and she never covers the clock.
- **The final ten seconds.** Everything but the seconds recedes. From T−6 the Song of Time **plays itself, one note
  per tick** (heard only if sound was already unlocked by an earlier interaction), so the melody completes at T−0.
  Then the Door of Time opens: a long white-out, a shower of sparks, the jingle, and a cut to the Great Deku Tree.
  "The time has come." The `<time>` element reads `PT0S` from then on, and nothing ever goes negative.
- **After launch.** Visitors arriving later get the same arrival page, plus an "Open the Door of Time" button to
  relive the moment.
- **Practical launch details.** The launch shown in the visitor's own time zone ("Wed, Nov 4, 9:00 PM PST where
  you are"; hidden where it already reads midnight ET). A client-generated **.ics download** with a 15-minute
  reminder. The live countdown in the tab title. A share card and OG tags. A Triforce favicon.

All five assets are used. The Kokiri Forest art is used twice, as the landscape master and the phone portrait. The
Hyrule Field and Deku Tree masters also get subject-centred portrait crops for phones. The logo is the hero mark (with
a periodic gleam masked to its silhouette) and also appears on the share card.

## How the code is organized

`app/README.md` has the map and the reasoning. In short:

- `src/lib/`: framework-free logic, including time (clock, `?now`, the countdown store, ISO durations), notes and songs,
  the scene catalogue, the Web Audio synth, the `.ics` builder, and the layout queries.
- `src/features/`: one folder per feature (countdown, backdrop, atmosphere, ocarina, world, effects, hud),
  each with its own CSS. `App.tsx` is only composition and wiring.
- `features/world/world.ts` is a pure reducer: songs and place visits in, scene, sky and weather out.
- The time model: a single store gives "whole seconds remaining" to `useSyncExternalStore`. Each timeout
  is aimed at the next second boundary, the value is rounded up so zero lands exactly at the moment, and it
  re-syncs when a throttled tab becomes visible again. `?now` is just a clock offset.
- There is **exactly one `<time>`** (`RemainingTime.tsx`). It's visually hidden, with readable text; the animated
  digits are `aria-hidden`.
- Images come from a reproducible pipeline (`npm run images`, sharp): masters in `app/art/`, committed AVIF and WebP
  derivatives, blurred placeholders, and the share card.

New dependencies: `@fontsource-variable/cinzel` and `@fontsource-variable/eb-garamond` (the self-hosted fonts), plus
the dev-only `vitest`, `jsdom`, `@playwright/test` and `sharp`.

## How I verified it

- **`npm run build` and `npm run lint` pass** (oxlint: 0 warnings, 0 errors).
- **Unit tests, 37 passing** (`npm test`): durations and ISO formatting, `?now` parsing (including the "+ became a
  space" repair), second-aligned ticking to exactly zero with fake timers, the visibility re-sync, the local-time
  phrasing across zones, `.ics` escaping and folding, song matching, and every world transition.
- **End to end, 45 passing and 5 skipped** (the skips are touch-only or keyboard-only tests on the other device type). This
  runs with `npm run test:e2e` against the production build in Chrome, Pixel 7, Safari (WebKit), iPhone 14 and Firefox,
  using Playwright's fake clock for exact assertions:
  - exactly one `<time>`, with `P37DT5H0M0S` becoming `P37DT4H59M59S` after one second
  - `?now=…23:59:50-05:00` ticks 10 → 1 and then `PT0S`, shows the arrival heading, and stays at `PT0S`
  - after launch, no negative numbers appear
  - no requests to other origins
  - no horizontal overflow
  - playing a song by keyboard changes the scene
  - the phone sheet's songbook works
  - the calendar download has the right `DTSTART`
- **Visual review** of every state with the provided `./shot` and ad-hoc Playwright scripts:
  - viewports: 360×640, 390×844, 768×1024, 844×390, 932×430, 1024×768, 1280×720, 1440×900, 1920×1080
  - every song effect, the time warp, the songbook, the phone sheet, Navi on each layout, the finale at T−6, T−4
    and T−1, the live launch, and post-launch
  - 4- and 5-digit day counts
  - WebKit (desktop and iPhone) versus Chromium side by side
  - the default one-second capture, so the intro is complete by the time it's taken
- **Network audit** of the production build. The first paint on desktop is about 390 KB (HTML, CSS, two preloaded fonts,
  84 KB of JS gzipped, a 138 KB AVIF hero and a 42 KB logo). The other scenes warm up afterwards when the browser is idle.
  On phones they come as ~80 KB portrait crops instead of 4K frames. Before those fixes, the logo downloaded twice and
  phones fetched 551 KB of warm-up art.
- **Accessibility:** tab order, visible focus rings, the accessibility-tree snapshot (landmarks, the labelled
  `<time>` sentence, a status region for songs), focus moving into and out of the phone sheet, and
  `prefers-reduced-motion` (no particle canvas, parallax, drift or lightning; fades instead of rolls and flashes).

## Known issues and trade-offs

- **Nothing is committed.** Per my standing instructions I didn't commit, so all work sits in `app/`'s working tree on top
  of the scaffold commit. `src/App.css` keeps the scaffold's tracked filename (with new contents); macOS's
  case-insensitive filesystem would otherwise have left a `app.css`/`App.css` mismatch that breaks on Linux.
- **Offline means self-hosted, not installable.** There are no third-party requests, fonts included, but there's no
  service worker, so a first visit still needs the server. A PWA cache would be the next step if "works on a plane
  after one visit" matters.
- **Sound needs a gesture.** Browsers block audio before one, so someone who only watches the final ten seconds sees the
  Song of Time on the staff but doesn't hear it. The synthesized ocarina and jingle are my approximations, not
  Nintendo's samples. I haven't listened on real speakers; the audio graph is exercised in tests without errors, but the
  mix (levels, reverb) deserves a human ear.
- **Source resolution limits.** The logo master is 640 px wide and the landscape Kokiri Forest master is 1920 px, so both
  are slightly soft on 2× displays at their largest sizes. The phone portrait art carries a line-engraving texture from
  the source, which is visible at 3×.
- **The hero image isn't preloaded from HTML.** It's requested once React renders, so it trails the JS by a
  few tens of milliseconds. Fonts are preloaded by a small Vite plugin. A proper fix is a build-time preload that uses
  the same `sizes` as the component, which I left out rather than duplicate that logic.
- **The OG image URL is relative.** Crawlers want absolute URLs, so prefix the deploy origin at release.
- **Song effects are my interpretation.** Each effect nods to the song's in-game meaning (Sun's Song and night, Storms and
  rain), but mapping Zelda's Lullaby to the Triforce is my own choice. The Deku Tree has no song; it's reached through
  Places, or at launch.
- **Night + storm together** is deliberately eased but still very dark on the Deku Tree scene.
- **Cross-browser coverage is engine emulation.** Chromium, WebKit and Firefox run through Playwright, but not real
  Safari or iOS hardware. The things most likely to differ there are audio unlocking on iOS (handled on
  `pointerup` and `click`) and `backdrop-filter` performance on older phones.
