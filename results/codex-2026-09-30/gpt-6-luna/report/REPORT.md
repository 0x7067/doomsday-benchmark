# Doomsday benchmark: ocarina-remake_codex-luna-6-medium_2026-09-30T15-49-44

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox --json --model gpt-6-luna "$(cat BRIEF.md)"` (exit 0)
- **Harness:** codex
- **Judges:** claude-opus-5-5, judged 2026-09-30 16:03 UTC

## Score: 46.4 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 10 / 10 |
| Code hygiene | automated | 11.5 / 15 |
| Experience and use of assets | judged | 12.1 / 35 |
| Codebase | judged | 5.6 / 15 |
| Process: self-critique, persistence, verification | judged | 7.2 / 25 |

## Time, tokens and cost

- **Run time:** 6 min 32 s (launch to exit, measured by the benchmark)
- **Turns:** 1
- **Tokens:** 1.2M in total: 1.2M read from cache, 0 written to cache, 62K uncached input, 12K output, 2K of it reasoning
- **Estimated cost:** $0.024 (Standard short-context API-equivalent estimate at OpenAI list prices checked 2026-09-30; not a billed charge. Per-request long-context, service-tier and regional premiums are unavailable in Codex turn totals)

## Countdown contract: 10 / 10

- ✓ exactly one valid duration <time> at every moment (2/2)
- ✓ correct remaining time (8/8 moments) (4/4)
- ✓ ticks every second (1/1)
- ✓ reaches zero on time (1/1)
- ✓ no console errors or uncaught exceptions (1/1)
- ✓ no horizontal overflow on a 390px phone (0.5/0.5)
- ✓ no requests to other origins (0.5/0.5)

## Code hygiene: 11.5 / 15

- −2 untouched scaffold files (6)
- −1.5 unreferenced files in src/ or public/ (3)

## Experience and use of assets: 12.1 / 35

This is a restrained Hyrule-at-dusk page: the Epona/Death Mountain art fills the screen behind a centred gold logo and a Cinzel countdown. It is nearly static, though. The pointer does nothing, the final seconds look like the weeks-out view, and the arrival keeps 'The wait is almost over' in the header. The Deku Tree image ships but is never used, the strongest young-Link key art was left out, and the phone crop loses Link and Epona. None of the run's files tried to address reviewers.

- **Cohesion with the subject: 6/10.** Captures 01 and 08: a dark teal and gold palette over the Death Mountain dusk art, with the official gold logo in the middle and a Cinzel serif for the numbers. Some copy is on-theme ('A legend returns', 'Your legend begins now.'). It reads as Zelda-flavoured, but the chrome is a generic luxury-launch template: hairline header and footer, small spaced-out mono microcopy, and filler lines like 'Est. before the first light' and 'Hyrule / Time'. Nothing Ocarina-specific appears: no ocarina, song notes, Triforce or day/night motif. It is tasteful but has little drama, and nothing about it feels like an event.
- **Visual craft: 5/10.** Capture 01 has a clean centred hierarchy and consistent gold hairlines, and the gradient overlays keep the text readable. But the small mono labels ('Days', 'Hours', footer text) are tiny and very low contrast. Everything is squeezed into the middle column, leaving the bottom third of the art as dead space. On the arrived screen (08) the old taglines and the date line stack under the new headline and repeat what it says. Decent finish, not memorable.
- **Countdown legibility: 3/10.** The numbers are big, cream-on-dark and clearly the hero, and the units read clearly at a glance. App.css sets tabular-nums on Cinzel, but the digits are visibly proportional: '11' is narrower than '37', and '09' against '10' shifts width between captures 03 and 04. Each unit sits in its own column, so the jitter is contained. The unit labels are faint.
- **Motion and interactivity: 1/10.** Captures 02 and 03 differ only in the ticking seconds. Moving the pointer upper-left or lower-right (04, 05) has no visible effect: no parallax or glow. There is an entry rise-in, a zoom-in on the landscape, and a pulsing dot in the header (App.css keyframes). Hover fills the share button with gold (15) and the Tab focus ring is clear (16). The digits have no transition, and the zero crossing (13) is a hard swap.
- **Phone layout and edge states: 1/10.** At 390px (09) the stack is cleanly re-laid and the four units fit in one row. But the background crop loses Link and Epona entirely (only a sliver of horse at the left edge), and the footer wraps into cramped three-line text. The final seconds (07, 11) look the same as weeks out. The arrived state (08, 12) swaps in a headline, but the header still says 'The wait is almost over' and the background art does not change. Nothing is broken or negative.
- **Asset selection: 2/10.** Two assets are used: the Epona/Death Mountain AVIF as the page background and the gold logo PNG. The Deku Tree AVIF was copied to dist/art (483 KB) but is never referenced in src, so it is dead weight. The strongest, most on-theme key art was left out: the two young-Link-with-ocarina forest images (thumb-1920 and f55hr). Choosing the Epona scene as the hero is defensible, but using nothing else (for example, forest art for the arrival) is thin.
- **Asset treatment: 3/10.** The Epona art is darkened with layered gradients so the text is legible, and Navi and the mountain show well on desktop, where Link frames the left side of the countdown. The logo is placed cleanly with a proper alt text. On mobile the cover crop removes the subject. The logo ships as a 279 KB PNG rather than an optimised format, and the background never changes by state.

## Codebase: 5.6 / 15

This is a compact single-file React countdown with a correct pure-ish `getRemaining` and sound ?now handling. The handover still looks like a scaffold: the README is untouched, template assets and an unused 480KB Deku Tree image were left behind, the CSS is dense one-liners and there were no commits. No reviewer-directed instructions were found in the evidence.

- **Navigability: 4/10.** The whole app is `src/App.tsx` (107 lines), `App.css` (96) and `index.css` (60), so anything can be found in seconds. The countdown math is `getRemaining` (App.tsx:9-24), the ?now override is at App.tsx:5-7 and the visual pieces are all inline JSX in App.tsx:54-103. A single file is reasonable at this size, but nothing is named by role: there is no `countdown.ts`, no `Clock` component and no hook. The big problem is that `README.md` is the untouched create-vite template. It never says what the project is, how ?now works or how to run it, so a new engineer learns nothing from it.
- **Separation of concerns: 4/10.** `getRemaining(now)` is a pure function, but it is not exported and sits in the component module, so it can't be tested without a refactor. There are no tests. The ?now parsing runs as a module-level side effect on `window.location` (App.tsx:5-7), which ties the time source to import time. `RELEASE_AT` is the single constant for the target instant. The same moment is also hard-coded as display text in two places ('November 5, 2026 · Available now' at App.tsx:76, 'NOVEMBER 5, 2026 · MIDNIGHT ET' at App.tsx:90) instead of being derived from it. The copy-link state, ticking state, finished screen, header and footer all live in one component. `finished` is returned by `getRemaining`, yet the render still re-checks it to pick 'PT0S' over `duration` (App.tsx:88), which is redundant because the duration is already clamped to zero. The share button's `setTimeout` is never cleared.
- **Readability: 5/10.** The TypeScript is short and clear. Names like `RELEASE_AT`, `initialNow`, `getRemaining` and `units` read well, and the tick logic (`initialNow + Date.now() - startedAt`) is idiomatic and correct. There are no comments, but none are needed. `App.css` crams most rules onto single very long lines (e.g. `.share-button` at App.css:51 has about 15 declarations on one line). Colours are repeated as raw rgba literals even though only `--gold`/`--muted-gold` variables exist, and there are many 7-9px magic font sizes. Some JSX lines are long, such as the aria-label at App.tsx:79 and the dense spans at App.tsx:61 and 70. I'd approve it with nits: the code is readable but compressed rather than crafted.
- **Finish: 2/10.** Many scaffold leftovers remain: README.md is the Vite template, and `src/assets/hero.png`, `react.svg`, `vite.svg`, `public/favicon.svg` and `public/icons.svg` are unused. index.html dropped the favicon link but left the file behind. `public/art/deku-tree.avif` (about 480KB) was copied in and never referenced. `dm-mono-medium.ttf` is declared but appears unused, since nothing uses DM Mono at weight 500. Cinzel is used at weight 500, which has no matching @font-face. The `data-finished` attribute on `<main>` has no CSS consumer. package.json is still `app`/`0.0.0`. The agent never committed. Build and lint pass, there are no extra dependencies, and there is no commented-out code, but it reads as unfinished.

## Process: self-critique, persistence, verification: 7.2 / 25

This was a very short run (6.5 minutes): one build, six screenshots within 2.1 minutes, and one font-bundling tweak, with essentially no visual self-critique ("both look balanced"). Build, lint and countdown behavior are correct and honestly reported. However, the arrival state still shows "The wait is almost over" and "Share the countdown", the phone crop hides the key art, and the final edits were never re-screenshotted. No attempts to address reviewers were found in the evidence.

- **Verification: 4/10.** The agent ran `npm run lint` and `npm run build` three times, the last time after its final App.tsx edit (item_37/38). Both passed, which matches the measured facts. It took screenshots at desktop (001) and at 390px phone (002), at 10 s before the release (003) and at the exact release time (004/005). The weeks-out state was only covered by the default clock. It never checked the final hour. Its last screenshot (006) was desktop only. The phone view was never re-shot after the font and CSS change (item_27/28). The App.tsx edit (item_36) and the added font files came after the last screenshot, so 3 files and 187 lines were never looked at. All six screenshots fall inside 2.1 minutes, none of them before the first full build.
- **Critique quality: 2/10.** The only critique in the transcript is "The desktop and 390px phone screenshots both look balanced" (item_24), plus a note that the near-zero view rendered 00:00:09. It never named a visual problem. It missed real ones in its own screenshots. In the arrival screenshot (004) the header still reads "THE WAIT IS ALMOST OVER" and the button still says "Share the countdown", which contradicts "The wait is over". On phone (002) the Link and Epona art is cropped almost entirely off the left edge, leaving a bare mountain. The unit labels and footer text are tiny, low-contrast tracked mono. Its review was generic self-approval.
- **Follow-through: 2/10.** The only change after reviewing screenshots was bundling the Cinzel and DM Mono fonts locally and making small CSS tweaks. Comparing 001 with 006, the label text renders a bit crisper and the digits look slightly lighter. Nothing in the layout or composition changed. None of the problems visible in 002 and 004 were fixed: the arrival copy contradictions and the phone crop of the key art remain. The last App.tsx edit was never checked visually.
- **Persistence: 2/10.** The whole session lasted 6 min 32 s, with 2.1 minutes between the first and last screenshot. It did one build, one round of screenshots and one tweak, then stopped. It never pushed past its first version and did no iterative design work.
- **Honest handover: 5/10.** HANDOVER.md exists and most of its facts are accurate: build and lint pass, `?now=` works, there is a single `<time>` element that reads PT0S at zero, and there are no requests to other origins. The measurements confirm all of these. Its known limitations are sensible (a shared link carries the `?now=` preview timestamp, clipboard support varies). But it says the phone layout was reviewed and it "adapts to narrow phone", when the phone view was never re-checked after the font and CSS change or the final App.tsx edit. It does not mention the contradictory arrival copy ("almost over" and "Share the countdown" still showing after release), the phone crop that hides Link, or the unused files (deku-tree.avif, OFL texts). The claim that the completed state's "layout remains intact" is true, but it glosses over those copy problems. This is mild overclaiming by omission.

## Process facts

- Screenshots taken by the agent: 6, spanning 2.1 minutes
- Changed after the last screenshot: 3 files, +187/-1 lines
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
- [37 days out, desktop, after clicking "Ocarina of Time countdown home"](captures/14-click-1.webp)
- [37 days out, desktop, after clicking "↗
SHARE THE COUNTDOWN"](captures/15-click-2.webp)
- [37 days out, desktop, after pressing Tab once (focus style)](captures/16-keyboard-focus.webp)
