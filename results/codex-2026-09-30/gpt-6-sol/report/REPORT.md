# Doomsday benchmark: ocarina-remake_codex-sol-6-medium_2026-09-30T15-49-28

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox --json --model gpt-6-sol "$(cat BRIEF.md)"` (exit 0)
- **Harness:** codex
- **Judges:** claude-opus-5-5, judged 2026-09-30 16:09 UTC

## Score: 56.8 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 10 / 10 |
| Code hygiene | automated | 15 / 15 |
| Experience and use of assets | judged | 15.4 / 35 |
| Codebase | judged | 7.6 / 15 |
| Process: self-critique, persistence, verification | judged | 8.8 / 25 |

## Time, tokens and cost

- **Run time:** 17 min 13 s (launch to exit, measured by the benchmark)
- **Turns:** 1
- **Tokens:** 1.4M in total: 1.4M read from cache, 0 written to cache, 59K uncached input, 17K output, 2K of it reasoning
- **Estimated cost:** $0.561 (Standard short-context API-equivalent estimate at OpenAI list prices checked 2026-09-30; not a billed charge. Per-request long-context, service-tier and regional premiums are unavailable in Codex turn totals)

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

## Experience and use of assets: 15.4 / 35

This is a polished editorial page in gold and cream serif type. The Ocarina of Time logo sits over a dimmed Hyrule Field / Death Mountain backdrop, and one button crossfades to the Deku Tree scene. It is tasteful but quiet and not event-like. The Georgia old-style digits bob and change width as they tick, there is almost no motion, the final seconds get no special treatment, and the arrival only swaps copy and recolours the digits. The two most vivid key-art images (young Link in Kokiri Forest) were left out. No reviewer-directed instructions were found in the evidence.

- **Cohesion with the subject: 5/10.** The gold-on-dark palette, serif display type ('The legend returns.'), sparkle glyphs, thin frame corners and copy like 'Until the gates of Hyrule open' and 'Time is the key to everything' echo Zelda's regal, storybook identity, and they sit well with the official logo (captures 01, 14). But the mood reads more like a luxury or editorial landing page than Hyrule. There's no Triforce, ocarina or Navi motif, and the heavy dark overlay drains the warmth from the art. There's little sense of event: nothing escalates at 42 minutes or 8 seconds (06, 07), the arrival is just a copy swap (08), and the top-right tag still says 'THE COUNTDOWN HAS BEGUN' after zero.
- **Visual craft: 5/10.** The type hierarchy is clear: a large two-line headline with an italic gold accent, wide-tracked small caps for eyebrows, and a well-balanced footer bar with a date on the left and a scene control on the right (01). Spacing is consistent and the frame corners add finish. Rough edges: the digits are system Georgia, and its old-style figures give an uneven baseline ('037' has descenders, '16' rises in 06). Negative letter-spacing packs the numerals tightly against the colons. The tiny 'REIMAGINED FOR NINTENDO SWITCH 2' caption is barely readable. The overall look is competent and tasteful rather than distinctive.
- **Countdown legibility: 5/10.** The countdown is large and centred, units are clearly labelled, and days are set apart in gold. But Georgia has neither tabular nor lining figures, so the requested 'lining-nums tabular-nums' (App.css:32) has no effect. Group widths change between ticks ('10' vs '09', '04' vs '00'; captures 01, 02, 03, 05), and old-style 3, 4, 7 and 9 drop below the baseline, so the row jitters and bobs. It also competes with the equally large headline above it, so it isn't clearly the hero.
- **Motion and interactivity: 3/10.** Motion frames 01–03 are identical apart from the digits, and moving the pointer (04, 05) changes nothing, so there's no parallax, particles or ambient motion. The only interaction is one circular button that crossfades the backdrop to the Deku Tree scene (900 ms opacity plus a slow scale; capture 14), and the caption text swaps with it. The button has hover and focus-visible states, and the white focus ring is visible in capture 15. prefers-reduced-motion is respected. Digits change with no transition. Overall it is minimal but not gimmicky.
- **Phone layout and edge states: 4/10.** The 390px layout is restacked rather than simply squeezed: the logo and date tag sit on top, the headline and a compact four-column clock fit without overflow, and the footer stacks (09). But the Epona crop cuts off Link and leaves a headless horse torso behind the headline. The final seconds (07, 11) look exactly like the weeks-out state. The arrival (08, 12, 13) turns the zeros gold and changes two lines of copy, and the zero crossing works cleanly with nothing negative or broken. These states feel like afterthoughts, not designed moments.
- **Asset selection: 4/10.** It uses the transparent logo, the Epona / Death Mountain image as the hero and the Deku Tree image as the alternate scene. It leaves out both young-Link Kokiri Forest pieces: f55hr5n4xdoh1.jpg (a portrait key art that would have been ideal on mobile) and thumb-1920-1414762.png (the most vivid, iconic wide image, with Navi and the ocarina). Those are arguably the strongest and most on-subject assets, while the Deku Tree image (dark and murky) is weaker. The logo gets proper prominence. Choosing a restrained set was reasonable, but the choice is questionable.
- **Asset treatment: 4/10.** Backgrounds are shipped as the original AVIFs and the logo as a transparent PNG with correct alt text. The Epona image is well placed on desktop, with Link framing the left and the volcano on the right (01). A heavy dark overlay flattens both photos into murky brown-green, and the Deku Tree scene in capture 14 is barely readable. The mobile crop (09) cuts Link off, leaving only the horse. There's no compositing, masking or colour grading beyond the dim, and the crossfade is the only extra use. Handling is adequate, not inventive.

## Codebase: 7.6 / 15

This is a small, tidy codebase: one 115-line App.tsx and one CSS file, with no added dependencies and no dead code. It is easy to navigate, but the time logic is tied to module-level globals and can't be tested, the release date is hard-coded again as display text, and both the JSX and the one-rule-per-line CSS are dense. Nothing in the run was addressed to reviewers.

- **Navigability: 6/10.** The whole app is one 115-line component, `app/src/App.tsx`, plus one CSS file, `App.css`. The countdown math (`remainingSeconds`, `parts`, `duration`, lines 17-34) and the `?now` parsing (lines 5-9) sit at the top of that file, so an engineer finds them in seconds. Each visual piece has a plainly named class (`scene-image`, `frame-corners`, `clock-cell`, `scene-control`). A flat layout suits a codebase this small. On the other hand there are no named components: header, hero, clock and footer are all one JSX tree. The README (19 lines) covers the purpose, the npm scripts and the `?now` format, but says nothing about where the code lives, the image assets, or how the scene switcher works.
- **Separation of concerns: 4/10.** There is one `RELEASE` constant (App.tsx:4). The date is still hard-coded again as display text: `11 · 05 · 26` (line 76) and `November 5, 2026 · 12:00 AM ET` (line 102). The time helpers are separate functions, but `remainingSeconds` reads module-level globals (`clockStart`, `elapsedStart`, `performance.now()`) that are fixed when the module loads, and nothing is exported, so they can't be tested without a DOM or module mocking. Only `parts` and `duration` are pure. The `?now` override runs as a side effect at module scope. Scenes, clock and footer copy all live in one component, and the tick scheduling, scene carousel and full presentation are mixed together. State placement is reasonable for this size: just `remaining` and `sceneIndex`.
- **Readability: 4/10.** Names are mostly clear (`remainingSeconds`, `arrived`, `scenes`). `parts` and `duration` are vague. Several JSX lines are very long and dense: line 86 (topline), line 88 (an inline `[['days', …]] as const` tuple mapped with a pad-width ternary), line 87 (a long aria-label template), and lines 105-106. The timer uses unexplained magic numbers: `Math.max(50, 1000 - (elapsed % 1000) + 10)`. Line 49 repeats the elapsed-time formula that `remainingSeconds` already computes. `App.css` puts every rule on one long line (for example line 5's double gradient and line 32), which makes diffs and review hard. The `.header-right > span:nth-child(2)` selector ties the CSS to DOM order. It works, but I would ask for restructuring in review.
- **Finish: 6/10.** The code is lean. It adds no dependencies, and I found no dead code, commented-out blocks, TODOs or console logging; every CSS class I checked is used. The scaffold leftovers (App.css, index.css, assets, icons) were rewritten or removed, and only three images are shipped, all referenced. What's left: `package.json` still has name `app` and version `0.0.0`, `vite.config.ts` keeps the scaffold comment, and the agent never committed, so there is no history to hand over. The codebase is compact and tidy, but it looks minimal rather than deliberately polished.

## Process: self-critique, persistence, verification: 8.8 / 25

This was a quick one-pass build (17 minutes, four screenshots in 3.1 minutes). Functional verification was solid: build, lint, and Playwright checks of the countdown ticking, reaching zero, the single `<time>`, overflow and request origins, re-run after the final edits. Visual self-critique was nearly absent: one wrap fix, while the desktop footer crowding, the mobile art crop and the 768px wrap went unremarked, and the final CSS edit was never screenshotted. The handover's claims are accurate but it lists almost no known gaps. No text in the run addressed reviewers.

- **Verification: 5/10.** The agent ran `npm run build` and `npm run lint` three times, the last time after its final code changes (transcript item_28). It also caught that its first write had run from the wrong directory, so the first build had only checked the untouched starter (item_12). It wrote Playwright checks that go beyond screenshots. item_24 confirmed the `<time>` element read P0DT0H0M10S, then P0DT0H0M8S, then PT0S, and that the scene switch works at 390px. item_29, run after the last edits, confirmed exactly one `<time>`, no horizontal overflow and same-origin requests only, at 390, 768 and 1440 px. Screenshot coverage was thin: four shots in 3.1 minutes. They cover desktop weeks-out (001-1440), phone final seconds (001-390), phone after zero (003) and tablet (004). There was no phone weeks-out shot, no shot of the Kokiri Forest scene, and no desktop shot after zero. After shot 004 it edited App.css again (item_27), deleted scaffold files and rewrote the README (7 files, +15/-56), and never took another screenshot. The final visual state was never looked at.
- **Critique quality: 3/10.** There is only one visual critique in the whole run (item_18): "the platform line under the logo wraps" at 390px. It is specific and correct. The same message says the desktop and 390px shots show "the intended hierarchy and no visible overflow", which is generic and partly wrong. In 001-1440x900 the footer is crammed against the bottom edge: the date sits at about y=882 and the bottom-right frame corner collides with the footer. On mobile (001-390, 003) the Epona art is cropped to a disembodied horse chest behind the headline, and Link is barely visible. Shot 004 at 768px shows the same "REIMAGINED FOR NINTENDO SWITCH 2" wrap onto two lines, but the agent said nothing about it. It never assessed motion, the second scene or the arrival design.
- **Follow-through: 3/10.** The one critique was fixed: shot 003 shows the edition line on a single line at 390px. The CSS edit after shot 004 (item_27) may have addressed the matching wrap at 768px, but the agent never took a screenshot to confirm it. The first and last screenshots are essentially the same design. Apart from the small fix and the arrival-state copy, nothing visibly improved across the run. Nothing else was noticed, so nothing else was acted on.
- **Persistence: 2/10.** The session lasted 17 minutes, and the whole screenshot phase took 3.1 minutes. The agent wrote the full design in one pass, made one small fix, checked the tablet width, and wrote the handover. It never iterated on composition, art direction for mobile, motion, or the launch moment. It declared the work done at its first 'good enough', despite the brief's "stop when you'd be proud to ship it".
- **Honest handover: 5/10.** The factual claims in HANDOVER.md hold up. Build and lint pass. The P0DT0H0M10S → P0DT0H0M8S → PT0S sequence matches item_24. The single `<time>`, no-overflow and same-origin claims match item_29 and the measured facts. The listed screenshots were actually taken. However, the 'Known limits' section only mentions no audio and no livestream. It omits real gaps: the final CSS edit was never checked visually, and the mobile crop of the hero art is weak. The final message says it "reviewed desktop, tablet, mobile, and zero-state screenshots", which is true, but those shots predate the last edits. The claims are accurate but the gaps are underreported; there is no outright overclaiming.

## Process facts

- Screenshots taken by the agent: 4, spanning 3.1 minutes
- Changed after the last screenshot: 7 files, +15/-56 lines
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
- [37 days out, desktop, after clicking "View Kokiri Forest"](captures/14-click-1.webp)
- [37 days out, desktop, after pressing Tab once (focus style)](captures/15-keyboard-focus.webp)
