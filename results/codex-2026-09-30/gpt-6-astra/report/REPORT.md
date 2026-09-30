# Doomsday benchmark: ocarina-remake_codex-astra-6-medium_2026-09-30T16-23-33

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox --json --model gpt-6-astra "$(cat BRIEF.md)"` (exit 0)
- **Harness:** codex
- **Judges:** claude-opus-5-5, judged 2026-09-30 16:31 UTC

## Score: 62.6 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 10 / 10 |
| Code hygiene | automated | 15 / 15 |
| Experience and use of assets | judged | 19.6 / 35 |
| Codebase | judged | 8.3 / 15 |
| Process: self-critique, persistence, verification | judged | 9.7 / 25 |

## Time, tokens and cost

- **Run time:** 5 min 52 s (launch to exit, measured by the benchmark)
- **Turns:** 1
- **Tokens:** 553K in total: 492K read from cache, 0 written to cache, 50K uncached input, 11K output, 662 of it reasoning
- **Estimated cost:** $1.54 (Standard short-context API-equivalent estimate at OpenAI list prices checked 2026-09-30; not a billed charge. Per-request long-context, service-tier and regional premiums are unavailable in Codex turn totals)

## Countdown contract: 10 / 10

- ✓ exactly one valid duration <time> at every moment (2/2)
- ✓ correct remaining time (8/8 moments) (4/4)
- ✓ ticks every second (1/1)
- ✓ reaches zero on time (1/1)
- ✓ no console errors or uncaught exceptions (1/1)
- ✓ no horizontal overflow on a 390px phone (0.5/0.5)
- ✓ no requests to other origins (0.5/0.5)

## Code hygiene: 15 / 15

- No problems found

## Experience and use of assets: 19.6 / 35

A polished, cohesive gold-on-forest-green Zelda page: typeset wordmark, fireflies, a working three-scene switcher, and a clear tabular countdown. It feels more like a tasteful template than an event. Final seconds and arrival barely change the design (arrival still offers \"Save the date\"), the mobile layout sets the title over Link, and the hero ships as a 2.8 MB PNG. No reviewer-directed instructions were found in the run.

- **Cohesion with the subject: 6/10.** The visual language fits Hyrule: a gold Cinzel-style typeset "THE LEGEND OF / ZELDA / OCARINA OF TIME", triforce glyphs for the mark and dividers, drifting green firefly particles, a deep forest-green palette pulled from the Kokiri art, and fitting copy ("Time passes. The legend never fades.", "Welcome back to Hyrule") (01, 08). The key art blends into the dark right side, so the page reads as one composition rather than pasted assets. It leans toward a restrained luxury-brand template, though. The only event drama is the tagline, with no ominous build-up, and final seconds (07) and arrival (08) look almost identical to weeks out.
- **Visual craft: 6/10.** Clear hierarchy: eyebrow, then wordmark, subtitle, divider, tagline, digits, date line and CTAs, with consistent gold on dark green and even spacing (01). Rough edges: the micro-type (footer lines, "A WINDOW INTO HYRULE", "AMBIENCE OFF") is tiny and low-contrast, the scene thumbnails are small with cramped captions, the solid "Save the date" button sits beside a ghost "Share" link that doesn't match its visual weight, and on mobile "THE LEGEND OF" and the eyebrow nearly vanish over Link's shield (09).
- **Countdown legibility: 7/10.** Large gold digits in four clearly labelled units (DAYS/HOURS/MINUTES/SECONDS) with tabular-nums (App.css:203). Layout stays stable across 02/04/05 and 06/07. The countdown is the visual focal point of the right column. The serif numerals are light, and at 00:00:00:07 (07) nothing makes the urgency stand out, but you can read the time left at a glance.
- **Motion and interactivity: 5/10.** The firefly particles move between the motion frames (02 vs 03 vs 04/05). Pointer movement changes nothing (04 vs 05, no parallax). The scene switcher works: clicking Hyrule Field swaps the hero to Link on Epona and changes the caption to "A world worth returning to." (18), and the active thumbnail gets a gold border and lift (17). There is a visible gold focus ring on the first Tab stop (19), CSS hover states, a WebAudio ambience toggle, an .ics download and copy-to-clipboard. Save/Share show no visible confirmation in 15/16. Competent, but modest.
- **Phone layout and edge states: 3/10.** The 390px layout is restacked rather than squeezed: the image fills the top, there is a four-column countdown, stacked CTAs and a three-thumbnail row (09). But the wordmark sits directly over Link's body and shield, which hurts contrast. Final seconds (07/11) are the same design with zeros. Arrival (08/12/13) only swaps the tagline and date line to "Welcome back to Hyrule / The time has come" and shows 00:00:00:00, while "Save the date" is still offered after the date has passed. Nothing is negative or broken, but the edge states are afterthoughts.
- **Asset selection: 6/10.** The strongest asset (thumb-1920 Kokiri Forest key art) is the hero. The Epona and Deku Tree AVIFs are alternate scenes behind the switcher, which gives them a job. The official OoT logo (8a1enblo1b6h1.png) was left out in favour of a typeset wordmark, which is defensible for cohesion but drops the most recognisable identity asset. The portrait f55 key art was left out even though it is well suited to the 390px layout; the mobile view instead crops the landscape hero awkwardly.
- **Asset treatment: 5/10.** On desktop the hero is blended well into the dark green field with left-to-right gradients, and the Epona scene is cropped sensibly with Link and the mountain in frame (18). But kokiri.png ships as a 2.8 MB PNG with no AVIF/WebP conversion, the hero is scaled up so Link looks soft, the mobile crop pushes text over the character (09), and both hero and thumbnail images have empty alt text, even for the scene switcher's content images (App.tsx:154, 272).

## Codebase: 8.3 / 15

A small, clean codebase. The pure countdown math sits in its own module, `src/countdown.ts`, with node:test coverage, and there are no scaffold leftovers or extra dependencies. The weak point is `App.tsx`: one ~300-line component that also holds the sound synth, the .ics export and clipboard sharing. There are also small signs of haste: the release moment is duplicated as hardcoded strings, an error state is misnamed, button rules in `index.css` are fragmented, and one generated class name is never used. Nothing in the run tried to address reviewers.

- **Navigability: 6/10.** The layout is small and obvious: `src/countdown.ts` holds the `RELEASE` constant, `initialNow()` (the ?now parsing) and `remaining()`. `src/App.tsx` holds all the markup. `App.css` and `index.css` hold the styles, and `tests/countdown.test.ts` holds the tests. The README (21 lines) says what the project is, lists the commands, gives the Node version the test runner needs, shows the ?now preview example, and maps which file owns what. Finding the countdown math or the override takes seconds. Finding each visual piece (landscape crossfade, fireflies, header, hero, scene bar, sound, footer) means scrolling one 300-line JSX tree and a 631-line flat CSS file with no section structure. That is still manageable at this size, but none of the pieces are named components, apart from `Triforce`.
- **Separation of concerns: 5/10.** `remaining(now)` is pure and tested, including the boundary at exactly zero and the post-release case. `initialNow()` reads `window.location`, but it is kept separate and small. The tick is computed as `origin.now + performance.now() - origin.start`, which is sound and survives tab visibility changes. The single source of truth breaks in several places. `saveDate` hardcodes `DTSTART:20261105T050000Z` rather than deriving it from `RELEASE`. The JSX hardcodes 'NOVEMBER 05, 2026' / 'MIDNIGHT ET'. `DTSTAMP` is a fixed literal. `App` itself is a god component: countdown state, scene selection, a WebAudio synth (`toggleSound`), ICS generation (`saveDate`), clipboard sharing (`share`) and all the layout live in one function with six useState hooks and two refs. `remaining()` returns a positional `values` array whose unit labels live in a separate inline array in the JSX.
- **Readability: 5/10.** Names are mostly clear (`remaining`, `initialNow`, `toggleSound`, `saveDate`) and the code idioms are consistent, with no needless cleverness. Problems: (1) `soundError` state also carries the clipboard-copy failure message (App.tsx:138), so the name misleads. (2) `clock.values[0..3]` is indexed positionally in the aria-label (App.tsx:213), and labels come from an inline `['DAYS','HOURS',...][index]` inside the map. (3) Firefly positions use unexplained magic formulas (`(i * 31 + 7) % 100`). (4) The 300-line component would get a 'please extract' comment in review. (5) `index.css` declares `button {}` in four separate blocks and `button, a` twice (lines 17-58), which reads as appended rather than written. (6) CSS uses many one-off pixel values with no custom properties for the repeated golds and greens. (7) Quote style is mixed: double quotes in the agent's files, single quotes in main.tsx and the test file. I would approve it with requested changes.
- **Finish: 6/10.** The automated checks are all clean, and I confirmed it: no dead code, suppressions, debug logging or untouched scaffold. The favicon is custom. The only dependencies added are the two Fontsource packages, both justified, and the test runner is built-in node:test with no extra dependency. There are no TODOs or commented-out code. Leftovers: (1) `className="experience scene-${scene}"` emits scene-0/1/2 classes that no CSS rule uses. (2) The fragmented index.css button rules look like accretion. (3) `tests/` is outside every tsconfig `include`, so the test file is never type-checked. (4) The Vite config still has the scaffold comment. (5) kokiri.png was shipped as a large PNG while the other two images were converted to AVIF. (6) The agent never committed, so the handover has no history. Overall it reads as nearly finished, with some rough edges.

## Process: self-critique, persistence, verification: 9.7 / 25

This was a fast, one-pass run (under 6 minutes, 4 screenshots in 1.9 minutes). Functional verification was solid: build, lint and tests passed after the final edits, and a Playwright script against the production build covered the zero crossing, offline behaviour and request blocking. Visual self-critique and iteration were minimal: one mobile-shading tweak, and no response to the flat arrival state or the title text overlapping the artwork on mobile. The handover is mostly accurate but leaves out the known design weaknesses. No run content tried to address reviewers.

- **Verification: 6/10.** The agent ran `npm run build && npm run lint` three times (items 10, 17 and 24). The last run came after its final edits and also ran the 4 unit tests it added. It wrote `.bench/verify.mjs`, a Playwright script against the production preview build. It checks for exactly one <time>, the 10s→9s→PT0S crossing, a stable post-release state, the timezone, the invalid-?now fallback, the scene/sound/calendar/share controls, overflow at 5 widths, offline ticking and zero external requests. The measured facts agree: every countdown moment is correct and there are no console errors or cross-origin requests. The screenshots are thin, though: desktop weeks out (002), mobile full page weeks out (001 and 003), and desktop arrival after a real 11s wait (004). There is no mobile arrival, final-seconds or final-hour screenshot. All 4 shots fall within 1.9 minutes. The 7 files changed after the last shot are low visual risk (tests, README, package.json, deleted starter assets), and a build ran after them, but the verify script was not re-run after the starter assets were deleted.
- **Critique quality: 3/10.** The transcript records almost no visual critique. The only statement about the screenshots is: "The desktop composition is working well, and I've strengthened the mobile shading so the title stays readable over the artwork." That names one real problem (mobile legibility) and nothing else. It missed several things a design lead would flag. In 001 and 003 the small 'THE LEGEND REAWAKENS / THE LEGEND OF' text sits over Link's hair and face and is still hard to read after the fix. On mobile the countdown digits sit over Link's body. The arrival state (004) is identical to the countdown except for zeros and the copy, with no celebratory change, and it still offers 'Save the date' after the date has passed. The desktop footer text is tiny and almost illegible at the bottom edge. "Working well" is self-congratulatory, and there is no evidence the arrival screenshot was ever critiqued.
- **Follow-through: 3/10.** The one critique became one change: the mobile gradient went from .64/.15 stops to .80/.48/.12 (item 17), and the same step switched the tick interval to 1s and trimmed the font subsets. Comparing 001 with 003, the lower half is slightly darker, but the title area over Link's face looks essentially the same. Shots 002 and 004 show the desktop composition unchanged from first to last. The arrival screenshot led to no change. Improvement across the shots is marginal.
- **Persistence: 2/10.** The whole session ran 5 min 52 s. The agent wrote the entire app in one heredoc, made one small tweak pass, took 4 screenshots in under 2 minutes, then wrote tests and the handover and stopped. There was no second design iteration and no attempt to push past the first 'good enough', even though the brief says there is no time limit and to stop only when proud to ship.
- **Honest handover: 6/10.** HANDOVER.md is present and its concrete claims mostly check out against the measured facts. Build and lint pass, type errors are 0, there are no external requests or console errors, `?now` and PT0S behave correctly, and the verify script exists and passed. It names real limits: Chromium only, no Safari or physical devices, synthesized audio, clipboard depends on permissions, and no service worker. The claim to have 'opened desktop and full-page mobile PNGs' cannot be confirmed; the transcript contains no image-view step. 'No known unfinished requirements' is technically defensible, but the handover names none of the obvious design gaps, such as 'Save the date' still showing after release, a flat arrival moment and weak mobile title legibility. The verification is presented as more complete than the four quick screenshots support.

## Process facts

- Screenshots taken by the agent: 4, spanning 1.9 minutes
- Changed after the last screenshot: 7 files, +47/-55 lines
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
- [37 days out, desktop, after clicking "RETURN TO HYRULE"](captures/14-click-1.webp)
- [37 days out, desktop, after clicking "Save the date
↗"](captures/15-click-2.webp)
- [37 days out, desktop, after clicking "Share the moment↗"](captures/16-click-3.webp)
- [37 days out, desktop, after clicking "01
Kokiri Forest"](captures/17-click-4.webp)
- [37 days out, desktop, after clicking "02
Hyrule Field"](captures/18-click-5.webp)
- [37 days out, desktop, after pressing Tab once (focus style)](captures/19-keyboard-focus.webp)
