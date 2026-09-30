# Doomsday benchmark: ocarina-remake_opus_2026-09-29T19-53-39

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `claude -p "$(cat BRIEF.md)" --model opus --dangerously-skip-permissions --output-format stream-json --verbose` (exit 0)
- **Harness:** claude-code (inferred from the command)
- **Judges:** opus, judged 2026-09-29 21:38 UTC (verdicts reused; the judges did not see this grading)

## Score: 79.4 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 10 / 10 |
| Code hygiene | automated | 14 / 15 |
| Experience and use of assets | judged | 26.8 / 35 |
| Codebase | judged | 10.8 / 15 |
| Process: self-critique, persistence, verification | judged | 17.8 / 25 |

## Time, tokens and cost

- **Run time:** 1 h 11 min (launch to exit, measured by the benchmark)
- **Turns:** 251
- **Tokens:** 49.4M in total: 48.5M read from cache, 504K written to cache, 304 uncached input, 325K output, 169K of it reasoning
- **Estimated cost:** $20.23 (Claude Code's estimate at API list prices; on a subscription you aren't billed per run)

## Countdown contract: 10 / 10

- ✓ exactly one valid duration <time> at every moment (2/2)
- ✓ correct remaining time (8/8 moments) (4/4)
- ✓ ticks every second (1/1)
- ✓ reaches zero on time (1/1)
- ✓ no console errors or uncaught exceptions (1/1)
- ✓ no horizontal overflow on a 390px phone (0.5/0.5)
- ✓ no requests to other origins (0.5/0.5)

## Code hygiene: 14 / 15

- −1 dead code (knip) (2)

## Experience and use of assets: 26.8 / 35

This run is a strongly on-theme Ocarina of Time countdown: gold Cinzel numerals over the Kokiri Forest art, OoT-style area title cards, a playable N64-style ocarina whose songs change the scene, a designed Song of Time finale, and an arrival at the Great Deku Tree. The weak spots are small-text finish on desktop, a layout shift at T−10, and the textured portrait asset used on phones. No text in the run addressed reviewers or asked for a score.

- **Cohesion with the subject: 8/10.** The page is built in Ocarina of Time's own idiom. Gold Cinzel numerals and EB Garamond italics echo the gold logo, over a firefly-lit Kokiri Forest scene (01). The copy speaks the game's language: "The Hero of Time returns in", "Seven years later" for Hyrule Field (16), "Open the Door of Time" and "The time has come" (08). Clicking a place brings up an OoT-style area title card, e.g. "Great Deku Tree — Where the legend begins" (15). The ocarina dock uses N64 yellow C-buttons and a blue A button. The final seconds dim every unit except seconds and fill Song of Time note slots (07, 11). At zero the scene cuts to the Great Deku Tree with falling leaves (08, 13). Together this has drama and a point of view, not a logo pasted onto a generic timer. One weak spot: the dark glass ocarina dock reads slightly more like modern app UI than game HUD.
- **Visual craft: 7/10.** On desktop the composition is confident. Link and Navi hold the left, and a right-leaning scrim carries a clear stack: logo, kicker, countdown, date, CTA (01). Spacing is even, and the gold gradient digits have a restrained glow. Rough edges: the top nav (KOKIRI FOREST etc.) is tiny, low-contrast letterspaced text. The "Hold A and the arrow keys to play" hint is tiny italic with staff lines running through it, so it is hard to read (01). At T−10 the whole right column shifts up about 37px to make room for the note slots, and the calendar button ends up tight against the dock (07). On mobile the dimmed unit labels in the final seconds nearly vanish, with stray-looking dot separators (11). Overall it looks designed, with some small-scale finish issues.
- **Countdown legibility: 8/10.** The numerals are huge (about 90px on desktop, the full column width on mobile), with clear DAYS/HOURS/MINUTES/SECONDS labels and diamond separators (01, 09). countdown.css gives each digit a fixed-width cell because Cinzel has no tabular figures, so nothing jitters between frames 01–03. Zero units stay visible as 00, so the reading stays stable (06). In the final seconds the lit seconds against dimmed units makes the remaining time obvious (07). The logo competes slightly for attention, but the countdown is clearly the hero.
- **Motion and interactivity: 8/10.** Fireflies drift between frames 01, 02 and 03. Pointer parallax visibly shifts the art between 04 and 05. Place clicks crossfade the scene and show an area title card (15, 16), though the mid-fade double exposure of child Link and Epona looks muddy at capture time. Sound toggles its icon to muted (17). The focus ring is a clear gold outline (19). The source adds digit rolls, a gleam masked to the logo's silhouette, a slow drift push-in, and a playable ocarina whose recognised songs change the world (time warp, night, storm, Triforce). The finale auto-plays the Song of Time one note per tick. The interaction is rich and in theme rather than gimmicky. The calendar click (18) shows no visible feedback.
- **Phone layout and edge states: 8/10.** The 390px layout is designed, not squeezed. It uses dedicated portrait art with Link centred and sky left for the logo. The header becomes icon buttons, the ocarina moves into a "Play the Ocarina" sheet, and the clock spans the width (09, 10). The final seconds are a designed moment on both layouts (07, 11). The arrival has its own heading, scene, leaves and a replay CTA (08, 12), and the zero crossing transitions cleanly (13). Nothing goes negative or overlaps. Minor flaws: on the mobile arrival (12) the Deku Tree crop pushes Link to the right edge, half lost in the scrim. The desktop column also jumps at T−10.
- **Asset selection: 7/10.** All five assets are used, but each has a distinct role and only one scene shows at a time. The strongest asset, Kokiri Forest (Link holding the ocarina, with Navi), is the hero, which suits an ocarina-themed clock. The Great Deku Tree is saved for the arrival ("where the game begins"). Link on Epona covers the adult era via the Song of Time and Epona's Song. The logo is the hero mark. The weak call is the portrait JPG (f55hr5n4xdoh1.jpg) for phones. It duplicates the Kokiri art, and its line-engraving texture shows in the mobile sky (09). Cropping the clean landscape master might have served phones better, a trade-off the handover itself acknowledges.
- **Asset treatment: 8/10.** The images go through a sharp pipeline that outputs AVIF and WebP at several widths, with blurred placeholders. Each scene has a focus point and art-directed portrait crops (scenes.ts). Scrims are shaped to each composition: leaning right on desktop to hold type, and top-and-bottom on tall screens (backdrop.css). Particle types match the art (leaves over the leaf-strewn Deku Tree, fireflies in the forest), so the effects blend into the images rather than fight them. The logo gets a gleam masked to its silhouette and correct alt text, and the backdrops are properly decorative (alt="", aria-hidden). Weak points: the textured portrait on mobile, Link cropped at the edge in the mobile arrival (12), a fairly heavy darkening of the Deku Tree on arrival, and some softness from zooming the 1920px Kokiri master.

## Codebase: 10.8 / 15

A well-organized codebase. It has a pure, injectable clock and countdown store with a single launch constant, feature folders with their CSS alongside, a pure world reducer, good unit and e2e tests, and a README that maps every file. Weak spots are small and mostly about finish: two dead exports, an unused synth getter, eight unused design tokens whose colours are hard-coded elsewhere, a split CSS rule, and some pill-button CSS copied across three files. The run's text contains nothing addressed to reviewers, though HANDOVER.md says the audio graph is 'exercised in tests' and there is no unit test for `synth.ts`.

- **Navigability: 8/10.** `app/README.md` explains what the page is, how to run it, gives a `?now` example table and all six scripts, then an annotated `src/` tree with one line per folder and short sections on Time, Layout, Images, Sound and Motion. The pieces are where the names suggest. The countdown math is in `src/lib/time/countdown-store.ts` (`secondsUntil`, `msUntilNextTick`, `createCountdownStore`) and `src/lib/time/duration.ts`. The `?now` override is in `src/lib/time/clock.ts` (`parseNowParam`, `createClock`) and is wired in `src/main.tsx:14-20` under a one-line comment. The target moment is in `src/config/launch.ts`. The single `<time>` element is in `src/features/countdown/RemainingTime.tsx`, and the README names that file directly. Each visual piece has its own feature folder with its CSS next to it: backdrop, atmosphere, ocarina, effects, hud and countdown. `App.tsx` (129 lines) reads as a map of the whole screen. Unit tests sit next to the code and `e2e/` is separate. A few things blur the map. The README says `lib/` is "framework-free logic", but it holds React hooks (`lib/time/useRemainingSeconds.ts`, `useTabTitle.ts`, `lib/useMediaQuery.ts`, `useRoomyLayout` in `lib/layout.ts`). `components/` holds only `Logo.tsx`. `features/world/` is a pure reducer with no UI. Scene data is in `lib/scenes/` while its renderer is in `features/backdrop/`. None of these would slow a newcomer down by more than a minute.
- **Separation of concerns: 8/10.** The time logic is pure and injectable. `parseNowParam`, `createClock(startAt, realNow)`, `secondsUntil`, `msUntilNextTick`, `splitSeconds` and `toIsoDuration` are plain functions. `createCountdownStore(target, now)` takes the clock as an argument and is shaped for `useSyncExternalStore`. `main.tsx` builds it once and passes it to `<App>` as a prop. All of this is covered by unit tests with fake timers, including the visibility re-sync (`countdown-store.test.ts`). There is one source for the instant: `LAUNCH_AT` in `config/launch.ts`, used by the store, the calendar and the local-time line. World state (scene, night, storm, effect counters) is a pure reducer in `features/world/world.ts` with its own tests. The particle engine is a class with no framework code, and React only configures it (`AtmosphereCanvas.tsx`). Audio is a singleton behind a small API. Songs and notes are data in `lib/ocarina/`. Rough edges: 1) The human-readable date "November 5, 2026" / "Midnight ET" is repeated in `LaunchDetails.tsx:13`, `Arrival.tsx:15`, the `CalendarButton.tsx:27` description and `index.html`, rather than derived from config. 2) `Lightning` in `Effects.tsx:65-68` also owns the rain sound (`synth.setRain`), which doesn't match its name. 3) The storm timeout lives in `App.tsx:64-68` rather than next to the world logic. 4) `App.css` restyles other features' classes (`.time-warp`, `.triforce`, `.launch-details__local`). 5) `Finale` plays audio from a render-driven effect. All of these are small.
- **Readability: 7/10.** Names are clear throughout (`secondsUntil`, `msUntilNextTick`, `launchInLocalTime`, `worldReducer`, `scheduleWarmUp`, `coverSizes`). Components are small; most are 20 to 60 lines. Comments almost always explain why rather than what. Examples: the round-up rule in `countdown-store.ts:4-8`; the '+' decoded as a space in `clock.ts:13-14`; keying digits from the right in `Countdown.tsx:42`; pointerup as the audio gesture in `NoteButton.tsx:35`; the DST note in `launch.ts:4-5`; the canvas DPR budget in `engine.ts:141-142`. Idioms are consistent: `data-*` attributes for state, the 'adjust state while rendering' pattern used knowingly in `RollingDigit`, `AreaCard`, `Backdrop` and `useArrival`, and BEM-style CSS. I'd approve it with a few comments. 1) `useOcarina.ts` (167 lines) is the densest file, with seven refs (`isSolved`, `isPerforming`, `clearTimer`, `timers`, …) mirroring state. It is well commented but takes careful reading. 2) `engine.ts` (342 lines) is full of unnamed tuning numbers, which is acceptable for a particle system. 3) The same pill-button style is copied into `calendar-button.css`, `sound-toggle.css` and `.arrival__relive` in `arrival.css`. 4) `OcarinaDock.tsx:34` destructures part of `ocarina` and then reads `ocarina.solved`, `ocarina.staff` and `ocarina.held` directly. 5) `Countdown.tsx:25` mutates `let glyphIndex` inside a render-time map. 6) The design tokens exist, yet colours like `#3b6fe3`/`#1e3f99` in `NoteGlyph.tsx` and the Navi blues in `navi.css` are hard-coded.
- **Finish: 6/10.** Build and lint pass. There are no suppressions, commented-out code, TODOs or debug logs; the only `console.warn` is the intentional one for a bad `?now` in `main.tsx:17`. The scaffold is fully replaced (README, favicon, `App.css`), and every dependency is justified: fontsource for self-hosted fonts; vitest, jsdom, playwright and sharp for tests and the image pipeline in `scripts/optimize-images.mjs`. Leftovers I confirmed: 1) `LAUNCH_ET_OFFSET_MINUTES` (`config/launch.ts:14`) is never used. 2) `LANDSCAPE_QUERY` (`lib/layout.ts:17`) is referenced only in CSS comments. 3) The `get audible()` getter on the synth (`synth.ts:39`) is never called. 4) Eight design tokens in `tokens.css` are unused: `--ink-800`, `--gold-800`, `--navi`, `--navi-glow`, `--button-a`, `--button-a-deep`, `--button-c`, `--button-c-deep`. Their literal values are hard-coded elsewhere instead. 5) `.staff__placeholder` is split into two rule blocks in `ocarina.css` (lines 195 and 253) with the toast section between them, an iteration artifact. 6) `.hud { justify-content: flex-end }` in `App.css:161-163` repeats the base rule, and there is a stray double blank line at `App.css:188-189`. 7) Scaffold remnants remain: `package.json` is still named `app` at `0.0.0`, and `vite.config.ts:38` keeps the `// https://vite.dev/config/` comment. 8) Nothing in `app/` was committed; HANDOVER.md says this was deliberate. Each item is small, but together they show a final cleanup pass was skipped.

## Process: self-critique, persistence, verification: 17.8 / 25

A disciplined, verification-heavy run: 32 ./shot captures plus about 30 ad-hoc Playwright captures, 37 unit and 45 e2e tests across five browser projects, and a clean rebuild and lint at the end. Visible problems (the clipped dock, Navi covering the clock, landscape overlap, the intro not finished at 1 s) were caught and fixed with re-shoots. The first 35 minutes were a big-bang build with only two looks. The thinking is redacted, so critiques show only through terse notes and actions, and a few visual flaws were never addressed: the engraved-line texture on the phone art, the Triforce crossing the clock labels, and the unopened T-6 phone capture. The handover matches the measured facts and lists its gaps, with only minor understatement. Nothing in the run addressed reviewers.

- **Verification: 8/10.** Very thorough, but late to start. The agent wrote about 3,200 lines before the first capture (001/002 came about 21 minutes in) and about 2,900 more before the second pair (003/004). After that it checked constantly:
- **Viewports:** a sweep of six sizes (007-012: 1280, 1024, 768x1024, 844x390, 1920, 360x640), re-shoots at 932x430 and 844x390 (013-016), and Navi on portrait and landscape (017-021).
- **Timing:** a 1-second-wait capture to catch an intro that wasn't finished (022 to 024), and a 5-digit day count on both layouts (027/028).
- **Critical moments:** final seconds and the arrival on desktop and phone with the shot tool (029-032).
- **States:** about 30 ad-hoc Playwright captures in /tmp/oot-shots, covering every song effect, the time warp, the songbook, the phone sheet, T-5/T-1/T0 flash, live arrival, post-launch, reduced motion, focus order, WebKit vs Chromium and 3x DPR.
- **Build and tests:** `tsc -b` and lint after nearly every edit batch. The final run showed lint 0/0, a clean build, 37/37 unit and 45 passed / 5 skipped e2e across Chromium, WebKit, Firefox, Pixel 7 and iPhone 14. A last `rm -rf dist node_modules/.tmp` rebuild confirmed it from a fresh cache.
- **After the last edit:** the final captures (029-032) came after the last code change, and 0 files changed afterwards. The measured facts agree: all eight countdown moments are correct, with no console errors and no requests to other origins.

Gaps: the first half had only two looks, and the agent never opened 030-390x844 (phone at T-6), which shows an odd empty gap in the Song of Time note row.
- **Critique quality: 6/10.** All thinking is redacted, so critique shows only through terse visible notes and what the agent did next.

The visible notes are specific and not self-congratulatory:
- "On landscape phones the box still overlaps the clock column, so there she'll move to the bottom-left" (49730)
- "Portrait is fixed: Navi floats in the sky between the logo and Link"
- "The logo now downloads once... phone payload dropped from 1,172 KB to 725 KB"
- "That visibility logic came out convoluted"
- "That shortcut was needlessly clever"
- "relive-launch duplicates launch exactly"

The actions imply it correctly spotted:
- the ocarina dock clipped at the bottom of 003
- the clock overlapping Link and running off-screen at 844x390 (010)
- Navi covering the digits (018, 020)
- the page not composed at 1 s (022)
- a storm grade that was too dark
- a time-warp flash that was too weak
- a Triforce that was too strong
- weak phone portrait crops for the Deku Tree and Hyrule Field

A design lead would agree with these. Some real problems went unnamed or were under-called:
- The portrait Kokiri art has a heavy engraved-line moire that is plainly visible at 1x (002, 009, 012). The handover only says "visible at 3x".
- The Triforce still slices through the clock labels and the local-time line (triforce.png).
- The phone ocarina sheet hides the countdown entirely, and "Hyrule Field" is clipped at its right edge (phone-sheet.png).
- The phone at T-6 (030) was never looked at.

Overall: credible and specific, but mostly invisible, with a few blind spots.
- **Follow-through: 7/10.** Most noticed problems were fixed and then confirmed with a re-shoot:
- The clipped desktop dock (003) became a slim bar (005).
- The mobile top bar, where "NINTENDO SWITCH 2" wrapped onto two lines (006), was fixed by 012 with icon-only buttons.
- The landscape overlap (010) got a side-by-side composition and height-capped digits (013).
- Navi over the clock on phone (018) was fixed in 019. On landscape (020) she moved bottom-left in 021.
- The unfinished intro at 1 s (022) was fixed by compressing timings (024).
- Digit slots were tightened (025), and a 5-digit day count was confirmed to fit (027).
- The logo double-download was fixed and phone payload cut. Phone portrait crops were regenerated and re-checked.
- Late fixes: audio unlocks on pointerup, an invalid `?now` now warns, and the phone sheet got focus management.

Early vs late shows clear robustness gains (phone landscape, overlays, finale, arrival). The desktop composition is essentially unchanged from 005 to 025, though it was already decent. Carried-over issues: the engraved-texture phone art was kept rather than treated, and the Triforce overlap was softened but still hurts legibility.
- **Persistence: 7/10.** The run lasted 71 minutes with 251 turns, and about 20 distinct improvement cycles after the first look. It went well past the first working version:
- a real Playwright e2e suite, then extending it to WebKit and Firefox after an initial harness failure (installed the browsers and re-ran)
- a network audit and payload optimisation
- an accessibility pass (reduced motion, tab order, ARIA snapshot)
- 3x DPR comparisons across engines
- a code-quality pass that re-read files it had edited programmatically and removed unused selectors
- a clean-cache rebuild at the end

Little of this was churn; each loop targeted a concrete defect. It is not an exceptionally long session, though, and it didn't revisit bigger design questions such as the phone art texture or the sheet covering the clock.
- **Honest handover: 8/10.** HANDOVER.md is detailed and matches the measured facts:
- Build and lint pass, and there are 0 type errors.
- `<time>` behaves as described: `PT0S` at zero, correct values at every sampled moment, no requests to other origins.
- "Never covers the clock" is borne out by 019 and 021. "Fits at 5 digits" is shown in 027.

It names real gaps:
- no service worker, so a first visit still needs the server
- audio needs a gesture, and the mix was never heard on real speakers
- the logo and forest sources are soft on 2x screens
- the hero image isn't preloaded
- the OG image URL is relative
- night plus storm is very dark
- cross-browser coverage is emulation only
- nothing is committed

The final chat message repeats these faithfully. Minor understatements:
- The engraved texture on the portrait art is called "visible at 3x" when it is obvious at 1x.
- The two dead exports (LAUNCH_ET_OFFSET_MINUTES, LANDSCAPE_QUERY) aren't mentioned.
- "Visual review of every state" is slightly broad, given the unopened 030 capture.

No material overclaiming.

## Process facts

- Screenshots taken by the agent: 32, spanning 47.7 minutes
- Changed after the last screenshot: 0 files, +0/-0 lines
- Agent commits in app/: 0
- HANDOVER.md: present
- Transcript: .bench/transcript.log

## Grader captures

- [37 days out, desktop 1440px, full page](captures/01-weeks-out-desktop.webp)
- [37 days out, desktop, 0.7 s after the first capture](captures/02-motion-a.webp)
- [37 days out, desktop, 1.4 s after the first capture](captures/03-motion-b.webp)
- [37 days out, desktop, pointer moved to the upper left](captures/04-pointer-upper-left.webp)
- [37 days out, desktop, pointer moved to the lower right](captures/05-pointer-lower-right.webp)
- [42 minutes out, desktop 1440px](captures/06-final-hour-desktop.webp)
- [8 seconds out, desktop 1440px](captures/07-final-seconds-desktop.webp)
- [3 hours after the moment, desktop 1440px](captures/08-arrived-desktop.webp)
- [37 days out, mobile 390px, full page](captures/09-weeks-out-mobile.webp)
- [42 minutes out, mobile 390px](captures/10-final-hour-mobile.webp)
- [8 seconds out, mobile 390px](captures/11-final-seconds-mobile.webp)
- [3 hours after the moment, mobile 390px](captures/12-arrived-mobile.webp)
- [Loaded 4 seconds before the moment, captured 2 seconds after it](captures/13-zero-crossing.webp)
- [37 days out, desktop, after clicking "KOKIRI FOREST"](captures/14-click-1.webp)
- [37 days out, desktop, after clicking "GREAT DEKU TREE"](captures/15-click-2.webp)
- [37 days out, desktop, after clicking "HYRULE FIELD"](captures/16-click-3.webp)
- [37 days out, desktop, after clicking "SOUND"](captures/17-click-4.webp)
- [37 days out, desktop, after clicking "ADD TO CALENDAR"](captures/18-click-5.webp)
- [37 days out, desktop, after pressing Tab once (focus style)](captures/19-keyboard-focus.webp)
