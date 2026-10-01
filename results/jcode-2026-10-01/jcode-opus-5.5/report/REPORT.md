# Doomsday benchmark V1.1: ocarina-remake_jcode-opus-5.5_2026-10-01T16-07-35

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `jcode -p claude -m claude-opus-5-5 run --ndjson "$(cat BRIEF.md)"` (exit 0)
- **Harness:** unknown
- **Judges:** opus, judged 2026-10-01 17:02 UTC

## Score: 77.6 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 5 / 5 |
| Code hygiene | automated | 8.3 / 10 |
| Experience and use of assets | judged | 33.7 / 45 |
| Codebase | judged | 12.7 / 15 |
| Process: self-critique, iteration, verification | judged | 17.9 / 25 |

## Time, tokens and cost

- **Run time:** 53 min 33 s (launch to exit, measured by the benchmark)
- **Tokens and cost:** not reported (no transcript this benchmark can read)

## Countdown contract: 5 / 5

- ✓ exactly one valid duration <time> at every moment (1/1)
- ✓ correct remaining time (8/8 moments) (2/2)
- ✓ ticks every second (0.5/0.5)
- ✓ reaches zero on time (0.5/0.5)
- ✓ no console errors or uncaught exceptions (0.3/0.25)
- ✓ no horizontal overflow on a 390px phone (0.3/0.25)
- ✓ no scrolling to an empty page (0.3/0.25)
- ✓ no requests to other origins (0.3/0.25)

## Code hygiene: 8.3 / 10

- −0.7 dead code (knip) (2)
- −1 unreferenced files in src/ or public/ (3)

## Experience and use of assets: 33.7 / 45

A polished, on-subject Ocarina of Time countdown: official logo, Kokiri Forest art, gold serif digits and a playable N64-style ocarina. Its strong concept is that canon-correct songs change the scene, weather and time of day around the clock, so all five assets get distinct roles. It falls short on the final seconds, which have no escalation; on art that collides with the UI (the digits over Link on desktop, Link buried on mobile); and on sound, which exists in code but was never captured. No run text addressed reviewers.

- **Cohesion with the subject: 9/10.** The page reads as Hyrule. It uses the official logo with the Master Sword and shield (01), with Kokiri Forest key art full-bleed under a dark green shade. The digits and small caps are in a gold engraved serif that matches the logo's gilt. The ocarina pad uses N64-style controls: a blue A and yellow C-buttons with the right glyphs (01). A Navi-like fairy drifts across the scene (02, 05, 15) and green fireflies float over it. The songbook lists six songs, and every button sequence in it matches canon (16). Each song is themed to its place (Saria's → Kokiri Forest, Epona's → Hyrule Field, Zelda's Lullaby → Deku Tree). The arrival line 'The legend awakens' (08) keeps the tone. One thing keeps it from 10: the final seconds (07, 11) look almost identical to weeks out, so the countdown's climax doesn't feel like an event until zero.
- **Visual craft: 8/10.** Finish is generally refined: the gold gradient digits are well spaced, the ghost buttons are consistent, the ocarina panel is glassy and the songbook modal is well set (16). Rough edges: the local-time italic line ('Thursday, November 5 at 2:00 AM GMT-3 where you are') sits over Link's busy shield and path, so it reads poorly (01, 09; contrast 6.5 on mobile with no backing). On desktop the '37' digits sit on top of Link's backpack and shield, so the art and the numbers fight (01). On mobile, Link is hidden behind the Add to calendar button and the ocarina panel (09), and 'Arrives on Nintendo Switch 2 in' measures only 4.9 contrast. The arrival state's dimmed 00:00:00:00 under the headline (08) looks like a leftover.
- **Legibility: 8/10.** The countdown is clearly the hero: very large gold digits with dot separators and DAYS/HOURS/MINUTES/SECONDS labels, readable at a glance (01, 06). The digits hold their width across ticks (01 → 02 → 05) and the time element is correct at every moment. Weaknesses: the unit labels and the 'Songs' and 'Kokiri Forest' labels are 10–11.5px with wide tracking. On mobile the labels sit under the digits at 10px (09). The italic local-time line is faint over busy art.
- **Motion and interactivity: 8/10.** There is ambient motion: fireflies and a wandering fairy, which moves to the clicked control (15, 17, 18). Pressing a button puts a note glyph on the five-line staff (17: A on the bottom line, 18: C-down on the next line up), so playing has visible feedback. The songbook opens as a dimmed, blurred modal with Play buttons (16). Keyboard focus shows a clear gold ring (19). The sound toggle changes its label and icon (14). In code, songs crossfade to new scenes, night or rain. What's missing: the final ten seconds have no visual escalation (07), and the zero crossing (13) is a state swap with only a firefly burst.
- **Phone layout and edge states: 7/10.** The 390px layout is designed, not squeezed: it swaps to the portrait key art, restacks the clock, puts the CTA on its own row, keeps a full-width ocarina pad and shrinks the sound button to an icon (09). Nothing overlaps or goes negative. The arrival is designed on both viewports: headline, 'Available now', a swarm of motes and a dimmed clock (08, 12). The final hour and final seconds are visually the same as weeks out on both viewports (10, 11), so the last seconds aren't a designed moment. On mobile the portrait art's subject is buried under the UI.
- **Asset selection: 9/10.** All five assets are used, each in a distinct role. The official logo is the hero mark. The Kokiri landscape is the desktop default scene. The Kokiri portrait is the mobile scene. Epona/Hyrule Field and the Deku Tree art are scene changes unlocked by playing Epona's Song and Zelda's Lullaby. That is a smart way to use the redundant key art without crowding the page. The strongest asset, the Kokiri art with the blue ocarina, gets the default slot. Nothing is imitated.
- **Asset treatment: 8/10.** Images are re-encoded to responsive WebP at several widths, with separate tall crops for portrait screens. A shade gradient darkens the edges for text, and scenes crossfade after decode. The logo is crisp with a soft glow, and decorative images have empty alt text while the logo has real alt text. Placement issues: on desktop the countdown overlaps Link's body (01). On mobile the portrait art's Link and the ocarina are covered by the CTA and the panel (09), which wastes the art's focal point. The source's hatched texture shows at full strength on mobile.
- **Concept: 8/10.** The page has a real central idea: the visitor plays the ocarina, and the songs change the world around the clock. Saria's, Epona's and Zelda's songs travel to their places, Sun's Song toggles night, the Song of Storms brings rain, and the Song of Time opens the Door of Time for a glimpse of launch night. A live location label names the current place. This goes well beyond the default, and the songbook (16) and staff (17) show it working.
- **Initiative: +3 on −5 to +5.** Useful extras that all work: Add to calendar (an .ics download), the launch time in the visitor's own zone (correct: 05:00Z is 2:00 AM GMT-3), a tab title that counts down, keyboard play (A and the arrow keys), a songbook with demo Play buttons and canon-correct sequences, a screen-reader live region in the last ten seconds, and a sound toggle. All are faithful to the subject and none clutter the page.
- **Sound: 0 on −5 to +5.** The code has a synthesised ocarina voice at the canon pitches (D4 293.66, F4 349.23, A4 440, B4 493.88, D5 587.33) plus final-seconds ticks and a fanfare. The grader's recording shows no AudioContext, though: no audio was captured for the sound toggle or the note clicks (14, 17, 18). With nothing measurable to judge, this scores as silent.

### Changes before shipping (7)

- [medium, moderate] Make the final ten seconds a visible moment: escalate the digits' glow or scale, pulse the separators, or brighten the fairy and motes. Right now 8 seconds out looks identical to 37 days out. (07, 11)
- [medium, moderate] Reposition or recrop the desktop scene so the countdown digits don't sit over Link's backpack and shield, for example by shifting the focal point left or pushing the clock right. (01, 06)
- [medium, moderate] On mobile, reveal Link and the blue ocarina instead of covering them with the CTA and the ocarina panel. Tighten the stack or move the art's focus up. (09)
- [small, trivial] Give the local-time italic line and the mobile eyebrow a backing scrim or stronger shadow. They're hard to read over the busy art. (01, 09 (hero__local, eyebrow))
- [small, trivial] Raise the unit labels and small UI labels from about 10–11px to at least 12–13px. (01, 09)
- [small, trivial] Drop or restyle the dimmed 00:00:00:00 under the arrival headline. It reads as a leftover. (08, 12)
- [medium, moderate] Make sure a note press creates and resumes the AudioContext, so the ocarina is actually audible on the first click. No audio was captured. (14, 17, 18 (audio unlock))

### Asset ledger

- `report/assets/8a1enblo1b6h1.png`: used. Official logo as the hero h1 mark, above the clock.
- `report/assets/thumb-1920-1414762.png`: used. Default Kokiri Forest backdrop on desktop and landscape screens.
- `report/assets/f55hr5n4xdoh1.jpg`: used. Portrait Kokiri backdrop on phones; Link ends up mostly covered by the UI.
- `report/assets/link-on-epona-with-death-mountain-in-the-distance-in-zelda-ocarina-of-time-remake.avif.png`: used. Hyrule Field scene, reached by playing Epona's Song.
- `report/assets/link-standing-before-the-great-deku-tree-in-the-ocarina-of-time-remake-on-switch-2.avif.png`: used. Great Deku Tree scene, reached by playing Zelda's Lullaby.

## Codebase: 12.7 / 15

A well-organised codebase. The time math is pure and tested in `lib/countdown.ts`, the launch moment is defined once, the reducer, song and audio modules are cohesive, and the README is useful. What holds it back is a busy `App.tsx` with inline title formatting and dev-only screenshot hooks, three orphaned portrait LQIP images, a stale doc comment and a duplicated CSS rule. The automated finding that the fontsource packages are unused is a false positive: `index.css` imports them. I saw no text in the run addressed to reviewers.

- **Navigability: 9/10.** The layout is clear and fits the project's size. `src/lib/countdown.ts` holds the time math and says at the top that it is pure. `src/hooks/useClock.ts` handles `?now` through `clockOffsetFromSearch`, and its doc comment says so. Each visual piece has its own named component (`Backdrop`, `Atmosphere`, `Countdown`, `OcarinaPanel`, `Songbook`), and `art.ts` is the image manifest. The README says what the app is, lists the dev, build, lint, test and art commands, has a URL-parameter table that separates `?now` from the dev-only params, and maps the folder layout, including `art-src/` and `scripts/build-art.mjs`. A newcomer could find the clock math, the override and each visual piece in under two minutes. What keeps it below 10: `App.tsx` mixes composition with world state, dev hooks, sound cues and the tab title, so a few behaviours (the final-ten-seconds ticks, the title countdown) take reading to find. The README also never explains the songs or interactions to someone working on them.
- **Separation of concerns: 9/10.** The time logic is pure and well tested. `remainingUntil`, `toIsoDuration`, `clockOffsetFromSearch` and `msUntilNextTick` take the time as a parameter, and `countdown.test.ts` covers rounding, zero, negative times, `+` decoding and tick alignment. The target moment has one source of truth: `LAUNCH_ISO` and `LAUNCH_MS` in `countdown.ts`, imported by `useClock`, `calendar.ts` and `App`. World rules sit in a pure reducer (`lib/world.ts`), song matching is pure (`lib/songs.ts`), and audio lives behind an `Ocarina` class with an `attach(ctx)` seam for offline rendering in tests. Ocarina state is in `useOcarina`, and `Atmosphere` reads its props through a ref so the canvas loop never restarts. What keeps it below 10: `App.tsx` still does presentation formatting inline. The tab title rebuilds `padStart` logic even though `pad2` and `toSpokenDuration` exist, and the doc comment on `toSpokenDuration` claims the title uses it. The final-seconds sound side effects in `App` could have lived in a small hook.
- **Readability: 8/10.** Names are clear throughout (`msUntilNextTick`, `clockOffsetFromSearch`, `worldReducer`, `dropOld`, `EFFECT_DELAY_MS`). Components and modules are mostly small, and comments explain why: the timer is aligned to second boundaries to avoid drift, `+` is restored after URLSearchParams decodes it, pointerdown is used instead of click, `detail === 0` marks keyboard activation, and state is adjusted during render in `Backdrop`. Idioms are consistent: memo, data-attributes for CSS state, and `useSyncExternalStore` for reduced motion. Review comments I'd leave: `App.tsx` (224 lines) is busy, with a long inline title template on line 84 and a nested ternary in the live region on line 194. `msUntilNextTick` ends with a slightly clever `1000 + remainder || 1000`. The `Backdrop` img ref callback calls setState during commit. The 233-line `Atmosphere` canvas loop is one large effect, though it is sectioned with comments. I'd approve it after a couple of small requests.
- **Finish: 8/10.** The build and lint pass. There is no commented-out code, debug logging, suppression or stale TODO, and the scaffold was fully replaced (custom favicon, index.html meta tags, README). The automated dead-code report on the `@fontsource` packages is a false positive: `index.css:1-4` imports them. Every dev dependency is used: sharp by the art script, `node-web-audio-api` by the audio tests, jsdom and Testing Library by `App.test.tsx`. Leftovers I confirmed: `build-art.mjs` writes an LQIP for every job, so three portrait LQIPs (`*-portrait-lqip.webp`) are committed but never imported. The `toSpokenDuration` doc comment is stale (it says it feeds the tab title). `index.css:477-484` sets `--digit-size` twice for the post-launch clock. Dev-only screenshot params (`?world`, `?play`, `?songbook`) stay in `App.tsx`; they are behind `import.meta.env.DEV` and documented, but they are iteration scaffolding in the main component. These are small, but a reviewer would ask for them before handover.

## Process: self-critique, iteration, verification: 17.9 / 25

This was a disciplined, well-verified run: broad viewport coverage, every raised defect fixed and confirmed by a later shot, gates and tests run after the last code edit, and inventive offline audio validation. The critique, though, missed the page's biggest composition problems, all visible in its own shots: the desktop clock sits on Link, phone UI covers Link, text is small and low-contrast, and the final ten seconds barely escalate. The handover also oversells the framing and the 'nothing left to fix' verdict. No reviewer-directed instructions were found in the evidence.

- **Verification: 8/10.** 25 shots across 390×844, 390×664, 768×1024, 1280×680 and 1440×900. They cover weeks-out at every size, final seconds on desktop (010), arrival on desktop (003) and phone (011, 013), the vision (009/012/022), the songbook (008/023), each world state through dev params, and 3-digit days on a phone (024). The transcript shows build plus lint run repeatedly, ending at 0 warnings after the last code edit (line ~81936). It also shows 44 vitest tests, including jsdom tests of the <time> contract and audio rendered through node-web-audio-api with mutation checks. Gaps: no final-day or final-hour shots. The desktop launch was never re-shot after the label fix (only phone 013). Final seconds were never shot on a phone. The last ~290 lines changed after shot 025 (audio.ts attach refactor, tests) were never looked at visually, though they are non-visual and were gated by tests and build.
- **Critique quality: 6/10.** Real, specific defects were found and named. Examples: the orphaned '· Midnight Eastern' and the clipped top staff line (001), weak logo contrast on phones (002), launch labels colliding (011), the vision overlapping the meta row (009/012), blurry upscaled art on tablet and the clipped panel on short screens (014–016), Navi idling over the logo (020), and a copy promise (Triforce) that nothing delivered. But the critique missed the biggest composition problems, visible in almost every shot. On desktop the digits sit right on Link's backpack and shield (001–022); the handover even claims the art 'leaves the middle free for the clock'. On phones the CTA and panel cover Link (002, 004, 011, 013, 025). The italic local-time line has low contrast, the labels are tiny, and the final-ten-seconds state barely differs from the default (010 vs 001). None of these were ever raised.
- **Follow-through: 8/10.** Every raised critique was fixed, and a later shot confirms it. The date line is on one row with all 5 staff lines from 002 on. Phone logo contrast is fixed in 004. Launch labels are hidden and clean in 013. Meta is hidden during the vision in 022. Tablet art switched to landscape and the panel fits at 1280×680 and 390×664 (017–019). Navi is clear of the logo in 025. The DOM tests also caught a real keyboard crash, which was fixed. Early to late, the page improved in polish but not in composition: 001 and 022 frame Link and the clock identically.
- **Iteration: 7/10.** A tight 13-minute shot span. Almost every round followed look→change→look, with confirmed improvements and no reverts or spinning. The audio validation round was a substantive, non-visual iteration. It stopped with visible problems it had seen in its own shots and never addressed: clock over Link, Link hidden on mobile, a weak final-seconds escalation, small low-contrast text. 'How I decided it was done' says a full pass 'found nothing left that I would fix', which the screenshots don't support.
- **Self-assessment: 7/10.** All seven sections are present, specific and largely accurate. Rounds cite shots that show what's claimed (001, 013, 017–019, 022, 025). Section 7 honestly names gaps: audio never heard, no real pointer testing, .ics untested. Build/lint/test claims match the measured facts. Some overselling: 'Link sits left of centre, which leaves the middle free for the clock' is contradicted by every desktop shot. The 'orange heartbeat' final-ten-seconds state is only a slight warmth. Round 4 attributes the launch-label collision to shot 003, where the labels are cramped but readable; the real collision is in 011, which round 7 then cites. 'Found nothing left that I would fix' overstates the result. It doesn't mention the unused @fontsource deps or the unreferenced LQIP files.

### Defect ledger

- never-mentioned, in 1 of its screenshots from shot 10: Final ten seconds not a distinct moment (only a slight orange warmth). Handover says 010 'looked right: the orange heartbeat state was visible'. It's treated as a feature, never as a weakness.
- never-mentioned, in 11 of its screenshots from shot 1: Desktop countdown digits sit over Link's backpack and shield. Present in 001, 003, 005–010, 012, 022. The handover claims the art leaves the middle free for the clock.
- never-mentioned, in 8 of its screenshots from shot 2: On mobile the CTA and ocarina panel cover Link and the ocarina. Visible in 002, 004, 011, 013, 020, 023–025.
- never-mentioned, in 18 of its screenshots from shot 1: Italic local-time line and mobile eyebrow have low contrast over busy art. Present in nearly every non-launch shot.
- never-mentioned, in 22 of its screenshots from shot 1: Unit labels and small UI labels ~10–11px. Visible in every shot.
- never-mentioned, in 3 of its screenshots from shot 3: Dimmed 00:00:00:00 under arrival headline reads as leftover. A deliberate choice per the handover; the agent only fixed its labels.
- disclosed, in 0 of its screenshots: Ocarina audio not captured on first click (AudioContext unlock). Code calls unlock()/resume() on note press. The handover discloses that audio was never heard or tested in a real browser.

### Claims

- accurate: Shot 001: date line orphaned and top staff line clipped; fixed — Both are visible in 001. 002 and later show one-line dates and 5 staff lines.
- oversold: Shot 003 showed launch labels colliding; fixed by hiding labels at launch — 003 shows cramped but readable labels. The clear collision is in 011. The fix is confirmed on phone (013) but was never re-shot on desktop.
- accurate: Phone logo contrast fixed, confirmed in 004 — A stronger top scrim is visible in the later phone shots.
- oversold: Shot 010: orange heartbeat final-seconds state visible — Digits are slightly warmer in 010 and capture 07, but the state is barely distinguishable from weeks-out.
- accurate: Vision overlapping meta row fixed, confirmed in 022 — 012 shows the date and calendar button under the vision; 022 shows them hidden.
- accurate: Tablet blurry art, short-laptop and short-phone panel clipping fixed (014–016 → 017–019) — 015 shows the panel cut off at 680px; 018 shows it fully visible.
- accurate: Navi idled over the logo in 020; fixed, confirmed in 025 — In 025 Navi sits near the top bar, clear of the logo.
- false: Landscape forest art leaves the middle free for the clock — In every desktop shot and in capture 01 the digits overlay Link's backpack and shield.
- accurate: Build and lint pass with 0 warnings; 44 tests pass — Measured: build and lint pass, 0 type errors. The transcript shows the final lint/build after the last code edit.
- accurate: <time> holds the ISO duration, ticks every second, PT0S at launch — All measured moments are correct; it ticks every second and reaches zero.
- accurate: Audio validated by rendering through node-web-audio-api with pitch/level checks and mutation tests — The transcript shows audio.test.ts and the failing-test counts (5, 9) when the synth was mutated.
- accurate: No runtime requests to other origins; fonts bundled — Measured: requestsToOtherOrigins is empty.
- oversold: Stopped when a full pass found nothing left to fix — Composition and readability issues were visible in its own shots and never addressed.
- accurate: Known gaps: audio not heard by ear, no real pointer testing, .ics untested — These gaps are honestly disclosed in section 7.

## Sound

- The page makes no sound through Web Audio.

## Ground rules

- Stay-inside rule in this run's brief: yes
- Its tool calls stayed inside the run folder.

## Process facts

- Screenshots taken by the agent: 25, spanning 13.1 minutes
- Changed after the last screenshot: 5 files, +290/-8 lines
- Agent commits in app/: 6
- HANDOVER.md: present
- Transcript: .bench/transcript.log

## Grader captures

- [37 days out, desktop 1440px, full page](captures/01-weeks-out-desktop.png)
- [37 days out, desktop, 0.7 s after the first capture](captures/02-motion-a.png)
- [37 days out, desktop, 1.4 s after the first capture](captures/03-motion-b.png)
- [37 days out, desktop, pointer moved to the upper left](captures/04-pointer-upper-left.png)
- [37 days out, desktop, pointer moved to the lower right](captures/05-pointer-lower-right.png)
- [42 minutes out, desktop 1440px](captures/06-final-hour-desktop.png)
- [8 seconds out, desktop 1440px](captures/07-final-seconds-desktop.png)
- [3 hours after the moment, desktop 1440px](captures/08-arrived-desktop.png)
- [37 days out, mobile 390px, full page](captures/09-weeks-out-mobile.png)
- [42 minutes out, mobile 390px](captures/10-final-hour-mobile.png)
- [8 seconds out, mobile 390px](captures/11-final-seconds-mobile.png)
- [3 hours after the moment, mobile 390px](captures/12-arrived-mobile.png)
- [Loaded 4 seconds before the moment, captured 2 seconds after it](captures/13-zero-crossing.png)
- [37 days out, desktop, after clicking "SOUND ON"](captures/14-click-1.png)
- [37 days out, desktop, after clicking "ADD TO CALENDAR"](captures/15-click-2.png)
- [37 days out, desktop, after clicking "SONGS"](captures/16-click-3.png)
- [37 days out, desktop, after clicking "Play A button, D"](captures/17-click-4.png)
- [37 days out, desktop, after clicking "Play C-down, F"](captures/18-click-5.png)
- [37 days out, desktop, after pressing Tab once (focus style)](captures/19-keyboard-focus.png)
