# Doomsday benchmark: ocarina-remake_glm-5.3-flash-max_2026-09-30T04-38-52

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `opencode run --auto --format json --thinking --model opencode/glm-5.3-flash --variant max "$(cat BRIEF.md)"` (exit 0)
- **Harness:** opencode, keeping only the newest 13–25 images in the agent's context
- **Judges:** opus, judged 2026-09-30 05:05 UTC

## Score: 67.8 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 9.5 / 10 |
| Code hygiene | automated | 15 / 15 |
| Experience and use of assets | judged | 19.8 / 35 |
| Codebase | judged | 10.1 / 15 |
| Process: self-critique, persistence, verification | judged | 13.4 / 25 |

## Time, tokens and cost

- **Run time:** 25 min 23 s (launch to exit, measured by the benchmark)
- **Turns:** 72
- **Tokens:** 5.6M in total: 5.3M read from cache, 0 written to cache, 253K uncached input, 62K output, 38K of it reasoning
- **Estimated cost:** $0.228 (OpenCode's cost at its provider's prices)

## Countdown contract: 9.5 / 10

- ✓ exactly one valid duration <time> at every moment (2/2)
- ✓ correct remaining time (8/8 moments) (4/4)
- ✓ ticks every second (1/1)
- ✓ reaches zero on time (1/1)
- ✓ no console errors or uncaught exceptions (1/1)
- ✗ no horizontal overflow on a 390px phone (0/0.5)
- ✓ no requests to other origins (0.5/0.5)

## Code hygiene: 15 / 15

- No problems found

## Experience and use of assets: 19.8 / 35

This is an atmospheric, clearly Zelda page. A gold Cinzel countdown sits over the dimmed Great Deku Tree with fog, grain and fireflies, and a night-to-dawn crossfade to Link on Epona is a real arrival moment. Several things hold it back: it follows the familiar 'logo + countdown over key art' template, nothing builds in the final hour or seconds, there are no interactive elements or focus states, unit labels and footer have low contrast, `.content::before` causes page overflow, and the phone layout is weak (a hatched poster behind the digits, and a landscape crop on arrival that leaves only a hoof). No run artifact contained instructions aimed at reviewers.

- **Cohesion with the subject: 6/10.** The idiom is right. There is a near-black forest green and gold palette, Cinzel caps that echo the Zelda title serif, and Cormorant Garamond body text (index.css). Film grain, drifting fog and canvas fireflies/fairies add atmosphere, and the copy fits the fan voice ("A fan-made vigil", "Hey! Listen!" on arrival). The narrative arc is a real idea: at night, child Link stands before the Great Deku Tree (captures 01-07), and at zero it crossfades to dawn over Death Mountain with Link on Epona (08, 13). That works as a small 'the journey begins' story. It feels like Hyrule, not SaaS. The event feel is weak, though. The layout is the stock 'centered logo + gold countdown over key art', and the 'DOOMSDAY CLOCK' eyebrow is a whisper. Nothing builds as zero approaches: the 42-minute and 8-second states (06, 07) look the same as 37 days out apart from the digits. No motif from the subject itself (ocarina, Song of Time, Triforce) is used. It is reverent and moody rather than dramatic.
- **Visual craft: 6/10.** On desktop the typography is well chosen: tracked-out Cinzel caps, gold-gradient digits in Cinzel, thin gold hairline rules beside the eyebrow and dateline, and a soft radial scrim behind the type. Spacing and centering are consistent (01, 06). There are rough edges. The unit labels (gold-dim at 55% alpha, 9-11px, 0.44em tracking) are barely readable on desktop and nearly lost on mobile (09). The footer at 34% alpha is essentially invisible and turns to mush over the bright grass in 08 and 12. The logo is large and saturated and competes with the countdown for hero status. On arrival the logo collides with Epona's head and raised hooves (08), and the labels wash out on the brighter dawn image. `.content::before { inset: -12% -24% }` makes the document overflow: the grader flags horizontal overflow at every moment, and the full-page captures (01 at 1786×1008, 09 at 484×945) show the page is roughly 100px taller than the viewport. A debug 'sim' chip is visible (it only appears with ?now=). The page looks designed, but the finish has gaps.
- **Countdown legibility: 6/10.** The DD:HH:MM:SS digits are large (up to 92px) gold Cinzel, and each glyph sits in a fixed 0.74em-wide slot (`.digit-slot`), so nothing jitters between frames 01→02→03. Unit labels sit under each group and change to singular correctly ('SECOND' at :01 in 04). Colons pulse gently. However, the labels are so faint that the units rely on convention more than on reading them. The ornate full-colour logo pulls the eye first. On mobile (09-11) the 38-40px digits sit directly over Link's hat and the hatched texture, which reduces contrast. After arrival the zeros stay as the hero instead of giving way to the release message.
- **Motion and interactivity: 5/10.** Several layers of ambient motion, all well executed:
- an 80s Ken Burns drift on the backdrop and slow fog drifts
- canvas fireflies that twinkle and are pushed away by the pointer
- two-depth pointer parallax (backdrop and content shift in opposite directions; 04 vs 05 shows the scene offset)
- a blurred 'stamp' drop only on the digit that changed
- a logo bob and a colon pulse
- a one-shot golden flash plus a 3.2s crossfade to dawn at zero (13 catches it mid-fade), and a pulsing 'Hey! Listen!'

Hovering a unit group brightens its label and glow (05, 'SECONDS' lit). All of it is disabled under prefers-reduced-motion. But there is nothing to interact with: zero visible interactive elements and no focus state (14 looks identical to 01). No ocarina or sound, no share, no toggle. Interaction is limited to passive pointer effects. The motion is tasteful but subtle, and it does not escalate in the final seconds.
- **Phone layout and edge states: 5/10.** Mobile gets art direction: a separate portrait poster through `<picture>`, a stacked dateline with its own rules, and the sim chip moved to the top (09-11). Nothing clips or overlaps at 390px. Weaknesses:
- The poster's built-in hatch texture reads as noise, and the countdown and labels sit right on top of Link.
- The grader flags horizontal overflow at 390px (full-page width 484px).
- The final hour and final seconds get no treatment at all (06/07, 10/11 are the weeks-out layout with different digits).
- Arrival is designed: flash, dawn crossfade, 'Hey! Listen!', italic release line, no negatives (08, 12, 13). But on mobile the landscape Epona shot is cropped so only a stray hoof shows at the left edge (12), leaving an empty mountain-and-field frame. The HANDOVER admits this compromise.
- **Asset selection: 6/10.** The picks are mostly sound:
- The logo PNG (8a1enblo1b6h1.png) is used prominently with its transparency intact.
- The Great Deku Tree remake shot is the main desktop scene, which suits a vigil.
- The Link-on-Epona Death Mountain shot is held back as the arrival payoff, a good use of a strong image as a reward.
- The 2.9MB portrait poster (f55hr5n4xdoh1.jpg) was re-encoded into forest-poster.avif for phones. That is a sensible fit for the aspect ratio, but it is the weakest-looking asset because of its heavy engraved hatch texture.
- The clean, luminous widescreen child-Link-and-Navi art (thumb-1920-1414762.png) was dropped entirely. It is arguably the most beautiful asset and could have been cropped for mobile.

There is no dumping: three scenes and the logo each have one clear job.
- **Asset treatment: 5/10.** The desktop night scene is integrated well. A top and bottom gradient scrim, vignette, grain overlay and fog blend the Deku Tree into the gold palette. The logo sits on the trunk, with in-image Navi and Link lined up beneath the countdown and dateline as if Link is looking up at it (01). Formats are sensible: AVIF backdrops, the 2.9MB JPG cut to 212KB AVIF, a 279KB PNG logo. The logo has proper alt text, and decorative layers use alt="" and aria-hidden. The weak spots:
- On mobile the hatched poster is not calmed down and Link's figure sits behind the digits (09-11).
- On the arrival desktop the dawn image is barely dimmed, so the logo lands on Epona's head and hooves and the labels and footer wash out (08).
- On the arrival phone the landscape image is cropped so badly that the subject is lost (12).

It is good on the primary desktop state and uneven elsewhere.

## Codebase: 10.1 / 15

This is a small, well-organized codebase. Pure time logic lives in `lib/time.ts` with a single target constant, the hooks and components are cohesive, the README is accurate, and it has no scaffold leftovers, debug code or extra dependencies. What keeps it from top marks: minor leftovers (a do-nothing inline `animationDelay`, a redundant `rise` class that overrides the logo's `bob` delay, an unused `is-released` class on `<time>`), repeated pluralization, no tests, a HANDOVER that claims more reduced-motion coverage than the CSS delivers, and no commits. None of the run's files, the HANDOVER or the transcript contained text aimed at reviewers.

- **Navigability: 7/10.** The layout fits a small app. `src/lib/` holds the logic and hooks and `src/components/` holds the visual pieces. The countdown math is in `lib/time.ts:23` (`remainingTo`) and the ISO duration in `lib/time.ts:40`. The `?now` override is parsed at `lib/time.ts:73` (`parseSimulatedNow`), consumed at `App.tsx:13` and applied in `lib/useNow.ts:4`. The target moment is at the top of `time.ts`. Each visual piece has its own file: `Backdrop`, `Fireflies`, `Countdown` and `SimBadge`. `app/README.md` says what the project is, lists the scripts, documents `?now` with examples and describes each main file in a 'How it works' section. That section leaves out `SimBadge.tsx` and `usePrefersReducedMotion.ts`, but HANDOVER.md lists them. The styles are one 564-line `app.css` split by comment banners (backdrop, content, countdown, datelines, chrome, responsive, reduced motion). That is easy to scan, though finding a component's styles still means searching one big file. Hooks sit in `lib/` next to pure logic instead of in their own folder. That is a minor point. A new engineer would find anything here in under a minute.
- **Separation of concerns: 7/10.** The time logic is pure and in one place. `remainingTo(nowMs, targetMs = TARGET_MS)`, `formatISODuration` and `describeRemaining` in `lib/time.ts` take plain values and return plain values, so they are easy to unit-test. No tests exist, though. The target has one source of truth, `TARGET_ISO` → `TARGET_MS` (`time.ts:5-6`). `TARGET_LABEL` and the meta tags in `index.html` restate the date by hand. Ticking lives in `useNow`, which is kept apart from presentation. `App` builds the simulated clock once in `useState` so its identity stays stable. Components only present data. `Digit` keeps its own animation state, and `Backdrop` is static markup. Minor issues: `parseSimulatedNow` calls `Date.now()` internally (`time.ts:78`), which makes it harder to test than it needs to be. `Countdown` gets a `released` prop that repeats `value.released`. The reduced-motion query string is duplicated: `usePointerParallax.ts:15` does a one-time `matchMedia` check instead of using `usePrefersReducedMotion`. The zero-crossing flash and title effects live in `App.tsx`, which is acceptable at 78 lines.
- **Readability: 7/10.** Names are precise: `remainingTo`, `formatISODuration`, `describeRemaining`, `parseSimulatedNow`, `currentSimulatedTime`, `usePointerParallax`, `SimulatedClock.offsetMs`. Functions and components are small. Most comments explain why rather than what, e.g. the DST note on the target (`time.ts:3`), the ceil rounding (`time.ts:19-21`), keeping smaller ISO units (`time.ts:37-38`), the self-correcting tick (`useNow.ts:9-16`), the stamp-only-changed-digit remount (`Countdown.tsx:5-9`) and the CSS scrim notes. Nits a reviewer would raise: pluralization is written out eight times (`time.ts:54-57`, `Countdown.tsx:61-67`) where a `plural()` helper would do. The `+ 25` in `useNow.ts:23` has no comment in the code. `Fireflies.tsx` (132 lines, one effect) is full of unexplained magic numbers (120, 30, 42_000, 24/20 wrap margins). Entrance stagger is set with inline `style={{ animationDelay }}` in `App.tsx` while all other motion lives in CSS, which mixes two approaches. `Digit` uses the setState-during-render pattern to detect prop changes. React sanctions that pattern and the code documents it, but it is slightly clever. I would approve this with a few nits.
- **Finish: 6/10.** The scaffold is fully replaced: the default `App.css`, `react.svg` and `vite.svg` are gone, `index.html`, the favicon and `index.css` are rewritten, and the README is real. There is no commented-out code, no TODOs and no console logging. Every CSS class and custom property is used, and every file in `public/` is referenced. No runtime dependencies were added. Small leftovers I verified: `.release-note` has an inline `animationDelay: '0.6s'` (`App.tsx:64`) that does nothing, because the class has no animation, only a transition. The logo keeps a redundant `rise` class that `.logo`'s own `animation` shorthand overrides. Its inline `animationDelay: 0.16s` also silently replaces the intended 2s delay on `bob`. The `is-released` class on `<time>` (`Countdown.tsx:55`) isn't targeted by any selector. The preload media query `max-width: 719.9px` (`index.html:17`) disagrees with the `<source media="(max-width: 719px)">` in `Backdrop.tsx:8`. `TARGET_ISO` and `currentSimulatedTime` are exported but only used inside their own files. `package.json` still has the scaffold's `"name": "app"` and `0.0.0`. The handover docs overclaim: HANDOVER.md says every animation, including 'the zero flash', is disabled under reduced motion, but `.flash` and the `.rise` entrances aren't in the reduced-motion block (`app.css:535-563`). The agent also never committed, so the repo arrives as the scaffold commit plus a pile of uncommitted changes.

## Process: self-critique, persistence, verification: 13.4 / 25

The standout moment was caught through verification: a stale-looking zero-crossing screenshot led the agent to find a ticker that fired once and died, plus a malformed ISO duration. It fixed both, re-verified them with Playwright, and re-shot desktop and mobile after its last edits. Design self-critique was shallow and self-congratulatory: unit labels that are nearly illegible on mobile (dismissed with 'Fine'), an invisible footer, streaks on the mobile poster and measured horizontal overflow were all missed or waved away. The page barely changed after the first render, and the handover leaves out the overflow and legibility issues. No reviewer-directed text was found in the run artifacts.

- **Verification: 7/10.** Broad and done after the final edits. It ran `npm run lint && npm run build` several times, including after the last CSS edits (transcript ~4787, ~9251). It took ./shot captures at 1440x900 and 390x844 for weeks out (001, 002-390, 009-390), for 307 days out (009-1440), for 10 seconds left (002-1440), and for the arrival (007-1440/390, 011-1440/390). The final 011 pair came after all edits, and no files changed after the last shot. The best moment was noticing that 004 (a wait of 12.5 s) showed the same 00:00:00:10 as 002. From that it found the real bug: the ticker never rescheduled, so it fired once and died. It confirmed this with 005/006 and a hand-written Playwright probe, then found the missing `P` prefix (`T10S`). It sampled the zero crossing PT10S→PT0S and probed `?now=garbage`, a date far in the past, exactly one `<time>` element, and reduced motion (transcript ~8495). It also checked the production build with `vite preview`, took an 844x390 landscape shot and grepped dist/ for external URLs. Gaps: it never measured horizontal overflow, which the harness flags at every moment, desktop and mobile (body `overflow-x: hidden` in index.css:62 hides it rather than fixing it; the likely source is the fog layer at `inset: -12% -24%`). It never shot the final seconds on mobile. It never saw the zero flash ('missed in this frame, that's fine').
- **Critique quality: 5/10.** Mixed. Some critiques were real, specific and visual. The mobile eyebrow was 'barely visible' against the bright sky rays in 002-390. The sim badge collided with the footer text in 007-390. The logo's sword nearly touches the digits on the mobile arrival screen. The dawn crop on mobile shows mostly Epona's rear. The digits look pale over the dawn sky on desktop. But much of the commentary congratulates itself: 'This looks genuinely good on first render!', 'Zero state is gorgeous', 'Portrait poster renders beautifully', '3-digit days fit elegantly'. Several of its own findings were talked away in the same breath ('It's fine', 'acceptable', 'Leave it', 'Skip'). It also missed or misjudged real problems a design lead would catch. It called the labels 'readable', but DAYS/HOURS/MINUTES/SECONDS are nearly illegible everywhere and, on mobile, sit on Link's body (009-390). It saw 'MINUT...' and wrote 'Fine.' The footer disclaimer is almost invisible in every shot. A vertical streak texture runs across the mobile poster in 002/009-390, yet it called the poster 'crisp'. The countdown row sits on Link's head in the mobile composition.
- **Follow-through: 5/10.** The problems it chose to act on were fixed and checked. The ticker was rewritten and the zero crossing re-verified. The eyebrow got brighter color, a text-shadow and a stronger top scrim on mobile, and it is visibly clearer in 009-390 than in 002-390. The sim badge moved to the top-left on mobile, confirmed in 011-390 against 007-390. The footer spacing was adjusted. But the other problems it noticed (tight logo-to-digit gap on mobile, pale digits at zero, clipped or illegible labels, the awkward dawn crop on mobile) were acknowledged and then dropped. Visually, 001-1440 and the late pre-zero desktop state (009-1440) are essentially the same design. There was one round of small polish, and nothing like a clear arc from early to late.
- **Persistence: 4/10.** The session ran 25 min 23 s. The first screenshot came about 10 minutes in, and the screenshots cover only 13.7 minutes. Debugging persistence was good. It dug into the frozen tick through several probe attempts, working around Node module-resolution and port problems (transcript ~5657–7368), rather than accepting the stale frame. Design persistence was minimal. It took the first render as 'Strong', made one small CSS pass (eyebrow, scrim, badge, footer), and then moved to docs. It weighed further ideas and turned them down ('Could add a gentle scale on hover? Meh', 'Minor. Skip', 'Leave it'). It stopped at the first 'good enough' on the visual side.
- **Honest handover: 6/10.** HANDOVER.md is present and mostly accurate. These claims match the measured facts: lint and build pass, 0 type errors, no console errors, exactly one `<time>`, correct PT0S at and after zero, ticking verified across zero, no requests to other origins, fonts self-hosted. The one genuine design compromise it names (the landscape dawn crop on phones) is true. It also correctly says that safe-area insets and sleep recovery were checked by code review only, not run. But it says the layout was 'verified at 390×844, 844×390, 900×700 and 1440×900' and describes the typography as clamped and fluid, while the harness measured horizontal overflow at every moment on both desktop and mobile. That is not mentioned. It does not name the near-illegible unit labels or the invisible footer. It describes the golden flash as working without ever seeing it. The 'Known gaps' list leans toward trivia (±25 ms tick slop, the firefly cost) over real visible issues. The final message ('Everything is verified and shipped') overclaims slightly, but nothing in it is false.

## Process facts

- Screenshots taken by the agent: 12, spanning 13.7 minutes
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
- [37 days out, desktop, after pressing Tab once (focus style)](captures/14-keyboard-focus.webp)
