# Doomsday benchmark: ocarina-remake_codex-sol-6.1-medium_2026-09-30T15-49-16

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox --json --model gpt-6.1-sol "$(cat BRIEF.md)"` (exit 0)
- **Harness:** codex
- **Judges:** claude-opus-5-5, judged 2026-09-30 16:07 UTC

## Score: 59.3 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 10 / 10 |
| Code hygiene | automated | 14 / 15 |
| Experience and use of assets | judged | 19 / 35 |
| Codebase | judged | 8.3 / 15 |
| Process: self-critique, persistence, verification | judged | 8 / 25 |

## Time, tokens and cost

- **Run time:** 15 min 3 s (launch to exit, measured by the benchmark)
- **Turns:** 1
- **Tokens:** 917K in total: 786K read from cache, 0 written to cache, 116K uncached input, 15K output, 1K of it reasoning
- **Estimated cost:** $0.460 (Standard short-context API-equivalent estimate at OpenAI list prices checked 2026-09-30; not a billed charge. Per-request long-context, service-tier and regional premiums are unavailable in Codex turn totals)

## Countdown contract: 10 / 10

- Browser checks stopped early: locator.getAttribute: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button, a[href], [role="button"], summary, input, select, textarea, [tabindex]:not([tabindex="-1"])').nth(1)[22m

- ✓ exactly one valid duration <time> at every moment (2/2)
- ✓ correct remaining time (8/8 moments) (4/4)
- ✓ ticks every second (1/1)
- ✓ reaches zero on time (1/1)
- ✓ no console errors or uncaught exceptions (1/1)
- ✓ no horizontal overflow on a 390px phone (0.5/0.5)
- ✓ no requests to other origins (0.5/0.5)

## Code hygiene: 14 / 15

- −1 dead code (knip) (2)

## Experience and use of assets: 19 / 35

A tasteful, dark-forest, gold-serif Zelda-style landing page, with the Kokiri Forest art as the hero, a clean four-unit serif countdown and three scene cards. It is on-brand but reads as a polished template rather than a dramatic event. The official OoT logo went unused, the hero art is heavily dimmed and sits behind the days digit, the final seconds get no special treatment, and the arrival state only swaps the headline and turns the zeros gold. None of the evidence tried to address reviewers.

- **Cohesion with the subject: 6/10.** Capture 01 has a dark forest palette in greens, golds and cream, a Cinzel-style engraved serif for the headline and digits, a Triforce mark in the header, the eyebrow and divider, and fairy-light particles over the Kokiri Forest key art. It reads as Hyrule, not SaaS. The copy works but is generic launch language ('A legend. Reawakened.', 'Some adventures stay with you.'). None of it draws on Ocarina lore such as the Song of Time, the Temple of Time or ocarina notes, even though the subject is literally a clock. The structure is a premium-studio landing page: a hero, a 'Save the date' CTA, then a card row. It is tasteful rather than dramatic, and the countdown feels like a nicely skinned timer, not an ominous event. The official gold Zelda logo was dropped in favour of a thin generic text wordmark, which weakens the franchise identity.
- **Visual craft: 6/10.** The type pairing is refined: large light serif numerals, widely tracked small caps and Manrope body text. The gold is used consistently for accents, the CTA and the seconds, and spacing and alignment on desktop are clean (capture 01). There are rough edges. The DAYS numeral '37' sits directly on top of Link's shield and body (captures 01 and 06), so the hero's focal points collide. The right-side headline column and the centred countdown use different alignment axes. The micro-labels ('EVERY SECOND BRINGS US CLOSER', 'THE COUNTDOWN IS LIVE', the scene selector) are very small and low contrast. The footer fine print is tiny. Overall it looks like a tasteful template executed well, not a distinctive design.
- **Countdown legibility: 6/10.** The four large numerals are clearly labelled DAYS, HOURS, MINUTES and SECONDS, zero-padded, and the seconds are highlighted in gold. Across captures 01–05 the digit widths and positions hold steady with no visible jitter. The countdown is the largest element on the page, but it shares the hero with a two-line headline of similar visual weight. On desktop the '37'/'00' days digits sit over the busy Link figure, which slightly reduces clarity. The labels are small and dim. It is still readable at a glance.
- **Motion and interactivity: 5/10.** Captures 02 and 03 show only the ticking seconds and slight particle drift (a drift keyframe). The seconds have a tick keyframe; in capture 04 the '00' is mid-fade. Captures 04 and 05 are identical, so there is no pointer response and no parallax. The source shows real interactions: a three-scene background switcher (01/02/03), card clicks that change the scene, hover zoom on the cards, a hover on the primary button, focus-visible styles, a Focus mode with an Esc exit, and a generated WebAudio ambience toggle, plus handling for reduced motion. Capture 14 (clicking home) shows no change. The interactions add something, but motion overall is subdued and there is no signature moment.
- **Phone layout and edge states: 4/10.** The mobile layout (capture 09) is properly re-composed: centred headline, a four-column countdown that fits at 390px, a cropped hero image and stacked cards, with no overflow. The header drops the Switch 2 badge and keeps a mute icon. 'REDISCOVER HYRULE' wraps awkwardly onto two lines, and a stray dot sits beside FOCUS MODE. The final seconds (captures 07 and 11) look identical to the normal state, with no heightened treatment. On arrival (08, 12, 13) the headline becomes 'The time has come.' and the zeros turn gold, but the same hero stays up, 'Save the date' remains after the date has passed, and there is no celebration. Nothing breaks or goes negative, but the edge states feel like afterthoughts.
- **Asset selection: 5/10.** The strongest image, thumb-1920 (Link and Navi in Kokiri Forest), was chosen as the hero and re-encoded as kokiri.webp. Both remake screenshots were used: the Deku Tree and Link on Epona before Death Mountain. Leaving out the poster f55hr5n4xdoh1.jpg, with its heavy line-texture overlay, is defensible. Leaving out the official gold OoT logo with the Hylian Shield and Master Sword (8a1enblo1b6h1.png) is a real miss, because it is the most iconic identity asset and was replaced by a plain text wordmark. The Kokiri image also appears twice, as the hero and as a card.
- **Asset treatment: 5/10.** The hero is cropped so Link sits left, and the image is heavily darkened and desaturated with a green-black overlay. This keeps the text legible, but the bright, luminous key art turns murky, and Link's figure sits right behind the days digit. The mobile crop cuts Link at the left edge. The cards use gradient scrims for the titles and consistent aspect ratios, and they look good. Formats are sensible: AVIF was kept and the 2.8 MB PNG was converted to a 307 KB WebP. Decorative images have empty alt and the cards have descriptive alt. The treatment is competent, but it flattens the art rather than getting more out of it.

## Codebase: 8.3 / 15

This is a compact, tidy codebase. The countdown logic in `countdown.ts` is pure and well tested, the README is accurate, and I found no dead code (the flagged fontsource dependencies are used). It is held back by one 385-line `App` component that mixes audio synthesis, ICS generation and all the UI, by an 860-line flat stylesheet, and by the target date being repeated in the ICS and UI copy. No reviewer-directed text was found in the evidence.

- **Navigability: 6/10.** The structure is small and easy to learn. Countdown math and the ?now override both sit in `src/countdown.ts` (27 lines: `RELEASE_AT`, `getRemaining` and `createClock`). The README (20 lines) says what the app is, lists the commands, explains ?now with an example and maps every file (`countdown.ts`, `App.tsx`, `App.css`, `index.css`, `public/images/`). Tests are in `tests/countdown.test.ts`. The weak spot is the visual pieces. Header, clock, scene selector, discover cards, footer and focus overlay all live in one 385-line `App()` in `App.tsx`, with no component boundaries apart from the small `Triforce` and `SoundIcon` SVG components. The styles are one flat 860-line `App.css`. Finding a visual piece means scrolling through JSX, but the class names (`clock-section`, `scene-selector`, `discover`) make that manageable.
- **Separation of concerns: 5/10.** The time logic is pure and tested. `getRemaining(now)` has no side effects, and five `node:test` cases cover the DST offset, rollover across a day boundary, clamping at zero and partial seconds. `createClock` is injected through `useState(createClock)`. `RELEASE_AT` is the single constant for the math, but the target moment is duplicated elsewhere: the ICS hard-codes `DTSTART:20261105T050000Z` (`App.tsx:134`), and the UI hard-codes "NOVEMBER 5, 2026 / MIDNIGHT ET" (`App.tsx:266-268`). `getRemaining` also returns presentation strings (`description`) alongside the data. The App component mixes several concerns: the Web Audio oscillator synth (`toggleSound`), ICS generation and download (`saveReminder`), the Escape key listener, scene state and all the markup. The scene data is only partly cohesive: image alt text is chosen by a nested ternary on the index (`App.tsx:347-353`) instead of living in the `scenes` array, and the unit labels are an inline array indexed by position.
- **Readability: 5/10.** Names are mostly clear (`released`, `saveReminder`, `toggleSound`, `scenes`). The code has almost no comments, and it doesn't need many. The monolithic `App()` hurts readability, as do a few spots that are clever or ad hoc: `key={index === 3 ? value : index}` forces a remount so the seconds digit replays its tick animation, but nothing explains why; the unit label is `["DAYS",...][index]`; the alt text is a nested ternary; `createClock` computes `initial` even on the real-clock path, where it is never used; `SoundIcon` wraps a single path in a needless fragment. The audio setup has magic numbers (0.035, the four frequencies) with no explanation. `React.CSSProperties` is used without an import. Overall it is readable, but I'd ask for components to be extracted and the scene metadata consolidated before approving.
- **Finish: 6/10.** The codebase is clean. I found no commented-out code, TODOs or console logging. Every selector in `App.css` matches a class that is actually used. The automated dead-code finding for `@fontsource/cinzel` and `@fontsource/manrope` is a false positive: `index.css:1-4` imports both, which self-hosts the fonts as the brief requires. `@types/node` is justified by the test file. The scaffold was replaced properly: new README, index.html title and meta, a test script, and the assets converted to webp/avif. Some leftovers remain: the package is still `"name": "app", "version": "0.0.0"`; `vite.config.ts` keeps the scaffold's `// https://vite.dev/config/` comment; `tests/` sits outside every tsconfig `include`, so `npm run build` never type-checks it; and the agent never committed its work.

## Process: self-critique, persistence, verification: 8 / 25

The Codex run shipped a polished-looking Zelda countdown in 15 minutes with thorough functional checks: build, lint and tests pass, and Playwright scripts cover ticking through zero, overflow at five widths and offline requests. Its visual process was weak: three screenshots, no written critique, and the design was never revised after the first pass, so mobile issues in shot 002 (headline over Link's face, cramped footer) were left as they were. Nothing in the run addressed reviewers or asked for a score.

- **Verification: 6/10.** Strong functional checks, thin visual checks. The agent ran `npm run build && npm run lint` twice: once before the first shot and once after the final edits, where it also ran `npm test` with 5 passing node tests (transcript items 15 and 25). It wrote `.bench/verify.mjs`, a Playwright script that confirms: one `<time>` element; real ticking from `?now=…23:59:50` through to `PT0S`, which then holds; scene buttons and aria-pressed; focus mode and Escape; the audio toggle; the ICS download; no horizontal overflow at 390/600/768/1024/1440; invalid `?now` falls back to the real clock; no external requests. A second script checks the production preview with other origins blocked and confirms reduced motion. It also inspected the ICS bytes for CRLF line endings. The measured facts back all of this: build and lint pass, 0 type errors, every countdown moment is correct, no console errors. Visual coverage is the weak part. There are only three `./shot` captures: weeks-out desktop (001), final seconds on mobile (002) and arrival desktop full-page (003). There is no mobile shot after the ~1,320-line change set, no mobile arrival state and no weeks-out mobile view. Shot 003 was taken after the final edits, and nothing changed after it.
- **Critique quality: 1/10.** The transcript contains no critique of any screenshot. The only comment on the renders is the generic 'The desktop and phone renders are working well' (item_21). Shot 002 has visible issues that went unmentioned. At 390px the 'A legend. Reawakened.' headline and subcopy sit over Link's face and Navi and are hard to read. Link is cropped at the left edge. 'REDISCOVER HYRULE' wraps onto two lines in the footer bar. The countdown digits are crowded and the separators between units are lost. On desktop (001/003), the far-left digits overlap Link's figure. None of this was noticed.
- **Follow-through: 2/10.** No critiques were written, so none could be followed through. Between shot 001 and shot 003 the hero is pixel-identical apart from the arrival copy and gold digits. The ~1,320 changed lines in between are Prettier formatting, tests, a README, removing scaffold files, converting the PNG to WebP (2.8 MB → 307 KB) and trimming the font imports to the latin subset. Those are real engineering improvements, but they don't come from anything seen in a screenshot. The mobile layout problems in 002 were never revisited.
- **Persistence: 2/10.** The whole session ran 15 minutes, and all three screenshots were taken within 4.1 minutes. The design was written in one pass (item_13) and never revised. After that the agent spent its remaining effort on packaging and verification scripts, then stopped. It declared itself done at the first working version and never looked for improvements, even though the brief sets no time limit and says to stop only 'when you'd be proud to ship it'.
- **Honest handover: 6/10.** Most claims are accurate. Build, lint and tests pass, which matches the measured facts. The fonts really are bundled: the build output lists cinzel/manrope woff2 files. The `@fontsource` packages flagged as dead code are imported from CSS, so that flag looks like a false positive. The overflow, offline and ICS checks were actually run. The page does show 'Unofficial fan experience'. The Limits section names real gaps: no Safari or Firefox testing, no service worker, synthesized audio. There are some overclaims. 'Inspected desktop… mobile… screenshots' is not backed by any recorded critique. 'The normal clock resynchronizes after returning to the tab' was never tested. 'No known unfinished requirements' skips the visible mobile readability problems. The final message is short and factual.

## Process facts

- Screenshots taken by the agent: 3, spanning 4.1 minutes
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
- [37 days out, desktop, after clicking "Hyrule countdown home"](captures/14-click-1.webp)
