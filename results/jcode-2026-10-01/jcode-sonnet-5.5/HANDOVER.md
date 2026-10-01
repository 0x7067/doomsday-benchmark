# Handover: The Door of Time countdown

Screenshots are in `.bench/shots/`, cited below by the number in their file name (for example `005` is `005-1440x900.png`).

## 1. What I built and why

A full-screen launch page for the Ocarina of Time remake. The idea is that the countdown is a door and the visitor has an ocarina in their hands. The clock counts down to `2026-11-05T00:00:00-05:00`. Everything else is play.

### What a visitor sees

- **The clock.** Days, hours, minutes and seconds in large gold Cinzel numerals over a darkened Kokiri Forest, with the Ocarina of Time logo above. Each digit changes with a short fall-and-fade, and there are pulsing gold colon dots between units. Below it are the date, a line giving the moment in the visitor's own time zone (hidden when they are already on Eastern time), and an "omen" line that changes as time runs down, for example "The Master Sword sleeps in its pedestal." Omens are grouped by phase: more than a week out, under a week, under a day, under an hour, under a minute and the last ten seconds.
- **Phone layout.** Below 640px the clock is a 2×2 grid with very large digits. From 640px up it is one row of four.
- **Ambient life.** A canvas of drifting fireflies (gold, green and pale blue) sits over a slowly drifting photo. The photo moves with the pointer for parallax. Vignette and glow intensify as the moment approaches (`--tension`, a log-scaled 0 to 1).
- **Navi.** A glowing fairy in the top right follows the pointer lazily. Click or tap her for a tip, with a small chime. Tips cycle.
- **The ocarina.** Five buttons at the bottom: C-Up, C-Left, A, C-Right and C-Down. Press them with the mouse or touch, or use the keyboard: the arrow keys play the C buttons and `A` plays A. Each press makes a synthesised ocarina note and adds a note to a trail above the buttons. If the last six notes match a song, that song fires. The trail fades after 3.5 seconds of idle.
- **Six songs** (exact notes are in the in-app Songbook, which you open from the "Songbook" chip):
  - Song of Time: reveals live hundredths of a second under the seconds for 9 seconds.
  - Zelda's Lullaby: one expanding ring of golden light.
  - Saria's Song: switches to Kokiri Forest and bursts green fireflies.
  - Epona's Song: switches to Hyrule Field.
  - Sun's Song: toggles day mode, which brightens the scene.
  - Song of Storms: toggles rain with lightning flashes.
  - Each song also shows a toast at the top ("Song played"), and the Songbook marks songs you have learned.
- **Songbook.** A native `<dialog>` (Esc, backdrop click and the ✕ button all close it). Each song card has a "Play it for me" button that performs the song and applies its effect.
- **Scene switcher.** Three thumbnails at the bottom left (Kokiri Forest, Great Deku Tree, Hyrule Field) cross-fade the backdrop.
- **Sound on/off** chip. Audio is generated with WebAudio, so there are no audio files. Nothing plays until the visitor's first interaction.
- **The last ten seconds.** The page darkens and one enormous number takes over the screen. A gold ring ripples out each second, with a low drum thump if sound is on (`046`).
- **Zero.** When the clock hits zero while the page is open, two door leaves part around a burst of light (`043` is mid-animation), the Song of Time plays, green fireflies burst out, and the headline becomes "The Door of Time is open" with the logo (`044`). The clock stays, quiet and compact, reading 00:00:00:00. If the page is loaded after the moment, the same end state appears without the door animation (`045`). `datetime` reads `PT0S` from then on.

### Hidden or deep-link behaviour

- `?now=<ISO>` is implemented as required, including the case where a `+` in a timezone offset arrives as a space in the query string (repaired in `parseNowParam`).
- I added `?scene=forest|deku|field`, `?songs=sun,storms` and `?songbook`. They exist mainly so I could screenshot states that need clicks, but they also make states shareable.

### The `<time>` element

Exactly one `<time>` exists on the page (`RemainingTime`), visually hidden. Its `datetime` is the remaining ISO 8601 duration, for example `P6DT12H10M5S` (all of D, H, M and S are always present while running), and `PT0S` from zero onward. The visible digits are `aria-hidden`, and the `<time>` element's text is a spoken sentence for screen readers.

### Reasoning behind the main decisions

- **Concept.** The Door of Time is the natural metaphor for a countdown to an Ocarina of Time launch. The clock is the door, the zero moment opens it, and the ocarina songs are the playful layer that rewards people who linger.
- **Assets.** All five were used.
  - `thumb-1920-1414762.png` (wide Kokiri Forest, Link looking back) is the main backdrop. The hero text is shifted right (`padding-left: 30%` on wide, roughly 4:3-or-wider screens) so Link stays visible on the left.
  - `f55hr5n4xdoh1.jpg` (tall) is the portrait backdrop, served through `<picture>` when the viewport is taller than 3:4. I re-encoded it softer because the original has visible hatching (see section 2).
  - The Deku Tree AVIF and the Epona AVIF are the other two scenes. All three scenes are the same crop-and-cover system, with per-scene `object-position` values.
  - `8a1enblo1b6h1.png` is the logo (transparent PNG, converted to WebP). It appears small above the clock, and large on arrival.
  - Thumbnails are generated from the scenes.
  - Everything was resized and converted to WebP. The AVIFs were also converted so they load in any browser.
- **Fonts.** Cinzel (variable) and Cormorant Garamond via `@fontsource`, bundled into `dist/assets`, so no runtime requests to other origins. I searched `dist` for `http(s)://` strings: the matches are a React error-message URL in the JS bundle and XMP metadata (namespace URIs) embedded inside two of the WebP images. None is a request, but the image metadata could be stripped to be tidy.
- **Layout.** The `Countdown` uses container queries and `svh`-based caps, so the digits are as large as the width allows but never taller than a fraction of the viewport height. This is what keeps it from overflowing on short screens.
- **Beyond the brief.** The ocarina, songs, scenes, Navi, weather, audio, the final-ten-seconds takeover and the arrival animation. The brief asks for an event that is judged on design, motion and interactivity, so I put the effort into these.

## 2. How I worked

I did not write down every micro-step at the time, so each round below lists what I looked at, what I changed in response, and whether the next look confirmed it. Where I'm reconstructing the reason for a change from the diff and the next screenshot, I say so.

**Round 0: setup.** I viewed all five assets and converted the AVIFs for viewing. I put the preview files in the scratch directory first, which is outside the project directory, so I deleted that approach, redid the conversion inside the project (in a temporary `.view` folder that I then deleted), and did not read the scratch copies again. Then I built the whole first version before taking any screenshot: countdown maths and clock store with tests, song data, reducer, audio, components and CSS. Lint warnings (React Compiler memoization hints) were fixed before the first shot.

**Round 1: first full render (`001` desktop, `002` phone, `003` and `004` final-seconds and arrived).** The backdrop was too dark and the vignette and scrim muddied the photo. On arrival, the clock row was at full size competing with the headline. Changes: brightness 0.5→0.78, lighter scrim and grade, lighter vignette, and a `compact` variant of the clock for the arrival state.

**Round 2 (`005`, `006`, `007`).** The backdrop read better. Link sat behind the clock text on desktop, and on arrival the compact clock worked. Changes: object-position moved so Link sits left, and on wide screens the hero content is pushed right with `padding-left: 30%`. On the phone, tightened logo, omen and local-time sizes and lowered the digit height cap.

**Round 3 (`008` desktop, `009` phone).** Confirmed the Link-left composition and the phone fit.

**Round 4: deep links, scenes and weather (`010`, `011`, `012`).** I couldn't click in `./shot`, so I added `?scene=` and `?songs=`. `010` is Hyrule Field, `011` is Deku Tree with day mode, `012` is Deku Tree with rain. All three worked. The small eyebrow line was hard to read over the bright Deku Tree, so I raised its contrast and text-shadow, and did the same for the unit labels.

**Round 5: more viewports (`013` 768×1024, `014` 1024×768, `015` 844×390, `016` 320×640, `017` 1920×1080).** Two problems: at 1024×768 Link was cut off by the left edge, and at 320 the date's diamond separator was left dangling on a wrapped line. Changes: a second per-scene `positionNarrow` used when the viewport is narrower than 3:2, and the date stacks vertically on phones with the separator hidden. Re-shot as `018` (1024×768), `019` (320×640) and `020` (1920×1080). Link was in frame and the date was clean. `015` (844×390 landscape phone) I looked at once and did not iterate on further beyond the existing short-landscape CSS rules (see section 7).

**Round 6: portrait image quality (`021`, `022`).** The tall JPG has visible diagonal hatching baked into the source, which showed on phones. A first attempt (downscale with a box filter, `021`) still showed it faintly. I applied a mild blur and re-encoded, and `022` was clean.

**Round 7: full-page phone, final seconds, arrival on phone, minute phase (`023`, `024`, `025`, `026`).** `023` showed the scene switcher pushed below the fold on a 390×844 phone. `024` showed the final-seconds overlay was too transparent: the regular clock bled through the big number. `025` (arrival on phone) wrapped the gold-gradient title badly across lines. Changes: darker final overlay (0.55/0.88 → 0.82/0.95), `box-decoration-break: clone` on `.gold-text` and a wrapping span in the Arrival title, tighter phone padding, smaller digit cap (14.5svh → 13svh), smaller scene thumbnails on phones.

**Round 8: tests caught a real bug.** I wrote App-level tests (jsdom). The first run failed because the keyboard handler called `.closest` on `e.target` when the event target was `window`, which has no `closest`. I fixed it with an `instanceof Element` check. A second failure was a bad test query (the song name appears in both the toast and the songbook), which I scoped to the toast. All 35 tests now pass.

**Round 9: songbook, live arrival and the phone again (`027` songbook desktop, `028` songbook phone, `029` and `030` live arrival, `031` phone).** The songbook is readable and scrolls on phones. `029` captured the door mid-open. `030` was the settled state. `031` showed the phone hero was still a little tall, so I tightened the top padding and gap and reduced the digit cap again (13 → 12.2svh).

**Round 10: Song of Time effect and toast (`032` to `040`).** I temporarily added an auto-play hook so `./shot` could play the song (removed afterward, verified with `grep -c tmpplay` returning 0). `035` showed the hundredths (`.01` style text) clipped off the right edge on desktop, and the toast overlapped the logo. `036` showed the toast covering the clock on the phone. I first moved the hundredths below the seconds label (`037`, `038`), which fixed the clipping, but the toast was then in front of the date block, so I moved the toast to the top (`039`, `040`) and made it wider. Both look right now.

**Round 11: arrival and final count confirmed (`043` to `046`).** `043` mid-door, `044` settled desktop, `045` settled phone (loaded after the moment), `046` the 3 in the last-ten-seconds overlay. Fine.

## 3. What I looked for

- Can I read every line of text over every scene and in both day and night mode? (This drove the contrast fixes in rounds 1, 4 and 7.)
- Is Link visible and unobstructed at each aspect ratio, or is the text covering him or the edge cutting him? (Rounds 2 and 5.)
- Does anything wrap awkwardly, overflow, or leave an orphaned separator at 320, 390, 768, 1024, 1440 and 1920 wide? (Rounds 5 and 7.)
- Does each state exist and look finished: far away, final ten seconds, exactly zero, after zero, rain, day, songbook open, toast showing? (Rounds 4, 9, 10 and 11.)
- Can I see source-image artefacts at the size they are displayed? (Round 6.)
- Is the one `<time>` element correct, does it tick, and does it stay `PT0S` after zero? (App tests, section 6.)
- Would a first-time visitor know the ocarina is playable? (The "Play a melody" hint, Navi's tips, and the Songbook chip.)

## 4. How I decided it was done

I stopped when the last round of screenshots stopped turning up layout or legibility problems at the sizes I checked, the build, lint and tests were green, and every state in the brief (live count, `?now`, zero, `PT0S`, 390 to 1440) had been seen on screen or asserted in a test. The remaining gaps are things I cannot check from this environment (real audio, real touch input, real-time animation feel), listed in section 7.

## 5. How the code is organized

```
app/src/
  main.tsx             entry, imports bundled fonts and base styles
  App.tsx              composition: wires clock, stage reducer, ocarina, arrival
  App.css              page layout and breakpoints
  lib/
    countdown.ts       pure maths: remaining seconds, ISO duration, phases, tension, ?now parsing
    clock.ts           external store (subscribe/getRemaining); wall clock or ?now + performance.now()
    format.ts          the visitor's local-time line
  state/
    stage.ts           reducer: what songs and arrival do to the page
    initial.ts         builds the starting stage from ?scene= and ?songs=
  data/
    songs.ts           six songs, note mapping, matcher
    scenes.ts          three scenes and their crops
    omens.ts           phase-based flavour text
  hooks/
    useCountdown.ts    useSyncExternalStore on the clock
    useOcarina.ts      keyboard and button input, note trail, song detection
    usePointerParallax.ts   writes --px/--py to the DOM (no React re-renders)
  audio/               WebAudio ocarina, drum thump, chime
  components/          Backdrop, Particles (canvas), Countdown, Digit, Hundredths, RemainingTime,
                       OcarinaPad, SceneSwitcher, Songbook, Toast, Navi, FinalCount, Arrival (+ CSS)
  styles/              tokens.css, base.css
  assets/              optimised WebP scenes, thumbnails, logo
```

Design notes for the next engineer:

- The clock is a tiny external store, so exactly one component re-renders per second. It schedules to the next whole-second boundary (not a fixed 1000ms interval), so it doesn't drift, and it resyncs when a background tab becomes visible.
- `?now` is anchored to `performance.now()`, which makes it immune to system clock changes during a test.
- Seconds are rounded up (`Math.ceil`), so the display reaches 0 exactly at the moment rather than a second early.
- The pointer parallax and canvas inputs bypass React state.
- The reduced-motion media query is respected in CSS globally, and in the canvas and Navi loops.

## 6. How I verified it

- `npm run build`, `npm run lint` (0 warnings, 0 errors) and `npm test` (7 files, 35 tests) all pass as of the final commit.
- **Unit tests:** ISO duration formatting including `PT0S`; rounding and non-negativity; next-tick scheduling; `?now` parsing including the `+`-as-space repair; phases and tension; the clock store with fake timers (10 seconds out reaches zero after exactly 10 ticks, then stops ticking); song matching; the stage reducer; the URL-derived start state; the local-time line for several zones.
- **App tests (jsdom):** exactly one `<time>`; correct `datetime` at load; it ticks and reaches `PT0S`; it stays `PT0S` for a further minute; loaded after the moment shows the arrival state with no negative numbers; Song of Time via the keyboard shows and then hides hundredths; Sun and Storms toggle `data-day` and `data-rain`; the scene thumbnails switch; the songbook opens with six songs.
- **Screenshots** of the states and viewports listed in section 2, using `?now=` to place the clock at 10 seconds, 3 seconds, exactly zero, and after zero.
- A search of `dist` for `http(s)://` strings (see section 1, Fonts). I did not run the page with network blocked or watch the network panel, so "no runtime requests to other origins" rests on that search and on the code having no fetches or CDN links.

## 7. What's still wrong or unfinished

- **I have not heard the audio.** The ocarina tone, drum thump and chime are synthesised, and I could only verify that they run without errors, not that they sound good. The pitches are plausible for an N64 ocarina but the timbre is untested.
- **No real touch or pointer testing.** Input was tested with synthetic keyboard events in jsdom and by deep links in a screenshot tool. Press behaviour on real touch devices (the pad uses `pointerdown`) is unverified.
- **Animations were only seen as still frames.** I saw the door mid-animation, the digit transitions and the final-count ring only as single frames. Their timing and feel are untested by eye.
- **Short landscape phones** (for example 844×390, `015`): I saw it once and only added generic rules (hiding the logo, eyebrow, local-time line and the scene switcher when the height is under 560px). I did not iterate on it, so it is the least-polished viewport.
- **Time zone line** reads "GMT-3" in the screenshots because that is the machine's zone. For some zones, `Intl` yields raw offsets rather than names like "BRT".
- **Navi's tip bubble** was never captured in a screenshot (it needs a click).
- **The Hyrule Field and Deku Tree crops** were verified at 1440×900 only (`010` to `012`). The other aspect ratios use the `positionNarrow` crops that I checked on the forest scene only.
- **The hundredths display** runs a `requestAnimationFrame` loop that re-renders a small component every frame while Song of Time is active (about 9 seconds). It is cheap, but it is the one place that re-renders at 60fps.
- **`?songs=` ignores one-shot songs** (Time, Saria, Lullaby) by design, since they have no persistent state to start in.
- The page has no social-share image or PWA manifest. The favicon is a simple gold triforce-style mark I drew, not an official asset.
