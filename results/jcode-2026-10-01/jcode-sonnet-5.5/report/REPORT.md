# Doomsday benchmark V1.1: ocarina-remake_jcode-sonnet-5.5_2026-10-01T17-12-20

- **Scenario:** The Legend of Zelda: Ocarina of Time (remake), counting down to 2026-11-05T00:00:00-05:00
- **Agent:** `jcode -p claude -m claude-sonnet-5-5 run --ndjson "$(cat BRIEF.md)"` (exit 0)
- **Harness:** unknown
- **Judges:** opus, judged 2026-10-01 17:53 UTC

## Score: 84.2 / 100

| Area | Kind | Points |
| --- | --- | --- |
| Countdown contract | automated | 5 / 5 |
| Code hygiene | automated | 10 / 10 |
| Experience and use of assets | judged | 37.1 / 45 |
| Codebase | judged | 12.7 / 15 |
| Process: self-critique, iteration, verification | judged | 19.4 / 25 |

## Time, tokens and cost

- **Run time:** 39 min 39 s (launch to exit, measured by the benchmark)
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

## Code hygiene: 10 / 10

- No problems found

## Experience and use of assets: 37.1 / 45

A cohesive Hyrule-themed countdown: the official logo and the Kokiri key art carry the page, the visitor plays a working N64-style ocarina whose five notes and six songs are canonically correct and change the page, and the final seconds and the Door-of-Time opening are designed moments. The main drags are a small logo, tiny secondary labels, overdarkened alternate scenes, and an arrival state that leaves a small leftover 00 row. Nothing in the run addressed reviewers.

- **Cohesion with the subject: 9/10.** Feels like Hyrule throughout. The backdrop is the client's Kokiri Forest key art, with drifting fireflies and a Navi orb (01–05). The title is the official logo. Headings and digits are set in a gold Trajan-like serif with italic Cormorant body copy, which matches the logo's gilded lettering. The copy uses the game's own lore: 'The Door of Time opens in', 'The Door of Time stands sealed.', 'Hey! Listen!', 'The hour is upon you. Take up the ocarina.' The ocarina pad matches the N64 controller, with gold C-arrow buttons and a blue A button (01). Its notes match canon (D4/F4/A4/B4/D5), and all six songs in songs.ts have the correct button sequences. Scenes switch between the Deku Tree and Hyrule Field (16, 17). The final-seconds vignette (07) and the door opening at the zero crossing (13) turn the moment into an event. Minor nit: the gold-on-green palette is a little uniform, and the darkened Deku/Field scenes lose some of the art's warmth.
- **Visual craft: 8/10.** The desktop composition is confident. Link holds the left third, and the logo, eyebrow, headline, digits, date and omen stack cleanly on the right (01). The controls sit on one bottom rail: scene thumbnails, ocarina pad and chips. Spacing is consistent, gold gradient digits carry a soft glow, the chips are pill-shaped with gold hairlines, and there are no clipped edges and no scroll-to-nothing. Rough spots: the logo is small (~140px wide) for a hero mark during the countdown (01), and only grows on arrival (08). The scene-thumbnail labels are tiny (8.5px desktop, 7.5px mobile). The arrival layout shrinks the countdown into a small row of 00s, which looks leftover (08, 12). The 'Play a melody' hint is very faint.
- **Legibility: 8/10.** The countdown is clearly the hero: huge gold digits with dotted colon separators and spaced uppercase unit labels (01, 06). Colon positions stay fixed across frames 01–05 (x≈680/920/1162), so the cells are stable. The Cormorant numerals are proportional, though, so digit widths shift slightly inside each cell ('01' vs '04'). The phone 2×2 grid stays readable (09). The final-seconds giant '7' is unmistakable (07, 11). The faint spots are secondary text: the thumbnail labels at 7.5–8.5px, 'Play a melody', and the mobile 'Coming to Nintendo Switch 2' at 10.5px and contrast 4.3.
- **Motion and interactivity: 8/10.** Fireflies drift and Navi floats (01→02→03). Pointer parallax shifts the art and Navi (04, 05). Clicking Navi opens an in-world speech bubble with a real tip, 'Press the arrow keys and A to play the ocarina' (14). Scene thumbnails swap the backdrop and mark the active thumb with a gold outline (15–17). Pressing an ocarina button floats a note glyph above the pad (18). Keyboard focus is a clear gold ring on Navi (19). The final seconds dim everything behind a giant digit inside a ring (07), and the door opens at zero (13). Restrained and purposeful. Minor: no hover states are captured on the pad buttons, and the click on Kokiri Forest (15) shows little visible change because that scene was already active.
- **Phone layout and edge states: 8/10.** The 390px layout is redesigned, not squeezed: it uses the portrait key art crop (forest-tall), a 2×2 digit grid, the ocarina pad and chips stacked, and the thumbnails along the bottom (09, 10). Final seconds get a designed vignette moment on both viewports (07, 11). Arrival has its own headline, 'The Door of Time is open', plus a larger logo and a copy line (08, 12). The zero crossing animates a door opening (13). Nothing is negative or overlapping. On mobile, Link is blurred behind the controls and the logo is small. The arrival row of 00s is a weak afterthought.
- **Asset selection: 10/10.** All five assets are used, each in a distinct job. The official logo is the title mark. The Kokiri Forest wide art is the desktop hero backdrop, and the portrait Kokiri art is the mobile backdrop. The Deku Tree and Epona/Death Mountain art are switchable scenes, with thumbnails, tied to Saria's/Epona's Song. The strongest asset (Kokiri Forest, with the blue ocarina) gets top billing. Nothing was imitated or typeset in place of the logo.
- **Asset treatment: 8/10.** Everything is re-encoded to WebP at sensible sizes (80–260 KB) with small thumbnails. The Kokiri art is graded darker on the right so the gold type reads, while Link and the blue ocarina stay vivid on the left (01). The portrait art is used for mobile instead of cropping the wide one (09). The Deku Tree and Hyrule Field scenes are darkened heavily, though: the Deku Tree's face gets lost behind the digits, and Link is hidden behind the pad (16). The Epona crop drops Navi and mutes the vivid pink sky (17). On mobile the portrait art is blurred and Link sits behind the countdown (09).
- **Concept: 8/10.** The page is organised around the ocarina and the Door of Time, not just a hero image with digits. The visitor plays the ocarina, and the six canonical songs do things: Song of Time reveals hundredths, Saria's/Epona's songs change the scene, Sun's Song toggles daybreak and Song of Storms brings rain. The omens advance with the countdown phase, the final seconds focus on a single digit, and the Door of Time opens at zero. It's well executed in the captures.
- **Initiative: +4 on −5 to +5.** Extras: the launch time converted to the visitor's local zone and correct ('Thursday, November 5 at 2:00 AM GMT-3'; 05:00Z is 02:00 at −3). A songbook dialog with all six songs, correct sequences and 'Play it for me' buttons. Keyboard play with the arrow keys and A. Navi tips (14). A scene switcher (15–17). Omens that rotate by phase. A sound toggle. All of them are faithful to the subject and verified in captures or code. No add-to-calendar or share, but what's there clearly improves the product.
- **Sound: +3 on −5 to +5.** Sound plays only on the visitor's ocarina presses. The non-ocarina controls were silent (sound begins at 3.0s in 20). Each button plays its canonical note (D5, B4, D4, A4, F4), and each tone has harmonics and a shaped decay, not a drone. Spectral change is 0.053, dynamic range 30.5 dB, peak −6.3 dB, with no clipping. There is a mute toggle. Faint broadband onset transients show as vertical lines, a slight click or breath, but this isn't harsh. The note mapping is faithful and the songs are correct.

### Changes before shipping (6)

- [small, trivial] Make the official logo larger during the countdown. At ~140px it's undersized as the hero mark; give it the presence it gets on arrival. (01, 06 top centre)
- [medium, moderate] Rework the arrival layout: drop or restyle the small row of 00:00:00:00 so the arrival reads as a celebration rather than a leftover clock. (08, 12)
- [small, trivial] Raise the scene-thumbnail labels to at least 11px and lift 'Play a melody' and the mobile eyebrow ('Coming to Nintendo Switch 2', 4.3 contrast at 10.5px). (bottom rail 01, 09)
- [small, trivial] Use tabular or fixed-width numerals (or centre each glyph in a fixed box) so the digit widths don't shift every second. (countdown digits 01–05)
- [small, moderate] Ease the darkening on the Deku Tree and Hyrule Field scenes, and reposition the crops so the Deku Tree's face and Link aren't buried behind the countdown and pad. (16, 17)
- [small, trivial] Add visible hover states to the ocarina buttons and chips. (bottom rail)

### Asset ledger

- `report/assets/8a1enblo1b6h1.png`: used. Official logo as the title mark; small during the countdown, larger on arrival.
- `report/assets/thumb-1920-1414762.png`: used. Desktop hero backdrop (Kokiri Forest) and its scene thumbnail; Link and the blue ocarina kept vivid.
- `report/assets/f55hr5n4xdoh1.jpg`: used. Portrait Kokiri art used as the mobile backdrop.
- `report/assets/link-standing-before-the-great-deku-tree-in-the-ocarina-of-time-remake-on-switch-2.avif.png`: used. Switchable Great Deku Tree scene and thumbnail; heavily darkened.
- `report/assets/link-on-epona-with-death-mountain-in-the-distance-in-zelda-ocarina-of-time-remake.avif.png`: used. Switchable Hyrule Field scene (tied to Epona's Song) and thumbnail.

## Codebase: 12.7 / 15

A well-organised, carefully layered codebase. Pure countdown math, an injectable clock store, a pure reducer for song effects, data modules, hooks, an audio module and one component per visual piece. Unit and integration tests cover the behaviour. It stops short of 10s because of small leftovers: an unused `songs` return value, a stale comment, a redundant branch, a hook file whose name doesn't match its export, and `SONGS[0] as Song` used to mean the Song of Time. No run content tried to address reviewers.

- **Navigability: 9/10.** The README (app/README.md) says what the project is and gives the target moment, the scripts (including `npm test`), every URL parameter including `?now`, the controls, and a directory map (`lib/` pure logic, `state/`, `data/`, `hooks/`, `audio/`, `components/`, `styles/`). The countdown math is easy to find in `src/lib/countdown.ts`: RELEASE_ISO, remainingSeconds, splitSeconds, toIsoDuration and phaseFor. The `?now` override is `parseNowParam` in the same file, wired into `src/lib/clock.ts`. Each visual piece has its own file with a co-located CSS file: Backdrop, Particles, Countdown/Digit/Hundredths, FinalCount, Arrival, Navi, OcarinaPad, Songbook, SceneSwitcher, Toast and RemainingTime (the single `<time>`). Tests sit next to their modules. The structure fits a project of about 60 files. What keeps it below 10: `hooks/useCountdown.ts` exports `useRemaining`, so a search by name misses it; the README phrase "one folder-level file (+ css) per UI piece" is awkward; and App.tsx also holds the arrival detection and the timer wiring for song effects, which a newcomer has to discover by reading it.
- **Separation of concerns: 9/10.** The time logic is pure and parameterised. `remainingSeconds(nowMs, targetMs = RELEASE_MS)`, `msUntilNextTick`, `splitSeconds`, `toIsoDuration`, `phaseFor` and `tensionFor` are all plain functions in lib/countdown.ts. `createClock` in lib/clock.ts takes injected `wallNow`/`perfNow`/`search`, and `useRemaining` subscribes to it through `useSyncExternalStore`. Both have tests. RELEASE_ISO/RELEASE_MS is the only source for the target moment: format.ts and Hundredths.tsx import it rather than redefining it. The hero copy in App.tsx still hardcodes "November 5, 2026 / 12:00 AM Eastern". What songs do to the page is a pure reducer (state/stage.ts) with URL-derived initial state (state/initial.ts), and both are tested. Song data and matching live in data/songs.ts. Audio is a separate singleton, and visual components take props. What keeps it below 10: App.tsx manages the toast/slow-time setTimeouts (never cleared on unmount) and detects arrival in an effect. Hundredths and FinalCount reach for the global clock and audio singletons directly instead of receiving them.
- **Readability: 8/10.** Names are clear and domain-flavoured (stageReducer, applySong, matchSong, msUntilNextTick, omenFor). Most functions and components are small. Comments explain why, for example the repair of `+` decoding to a space in parseNowParam, rounding up so the display flips at the moment, right-aligned digit keys, the derived-state pattern in Digit, and the visibilitychange resync. Idioms are consistent (BEM-ish CSS, typed props, refs for animation loops). Issues a reviewer would flag: `SONGS[0] as Song` in App.tsx:69 picks the Song of Time by array index and needs a cast. Countdown.tsx:23 has a branch whose two arms do the same thing (`String(days).padStart(2,'0')` vs `pad2`). The comment in state/initial.ts:25 names `time` and `saria` while the code also skips `lullaby`. App.tsx mixes the named SLOW_TIME_MS with magic numbers (4300; 1400 in useOcarina). Particles.tsx packs 220 lines into one effect with terse names (inp, k, s). `useCallback` deps include stable `dispatch`/`setBookOpen`.
- **Finish: 8/10.** The scaffold is gone: no Vite/React logos, counter or default App.css content. There's a real README, index.html has its own title, meta description and theme colour, and the favicon is custom. Assets are optimised WebP and every one is used. No commented-out code, TODOs or console logs, and the automated checks find no dead code. The CSS selectors I checked all match rendered classes. Dependencies are justified: fontsource for offline fonts, and testing-library/jsdom/vitest for the tests that exist. The final commit, 'Remove unused hook', shows a cleanup pass. Small leftovers remain: `useOcarina` returns `songs: SONGS`, which nothing reads; `Clock.simulated` is used only by tests; and there is the stale comment in initial.ts. Commit messages don't follow a conventional format, which is minor. Overall it reads as a finished handover.

## Process: self-critique, iteration, verification: 19.4 / 25

A strong, disciplined process: about 11 short look-fix-look rounds, each confirmed in a later screenshot. The agent ran build, lint and tests itself, and its jsdom tests caught a real bug. The handover is honest and specific, and even admits a write outside the project directory that the automated check missed. Weak spots: it declared the Deku and Field scenes fine when 011–012 show the tree buried, it never raised the small logo or labels or the leftover arrival clock row, it took no phone final-seconds shot, and it made a final dead-code edit with no new screenshot. The run contained nothing addressed to reviewers.

- **Verification: 8/10.** 46 screenshots over 7 viewports (320×640, 390×844, 768×1024, 1024×768, 844×390, 1440×900, 1920×1080). They cover weeks out, final seconds on desktop (003, 024, 029, 030, 043, 046), a live zero crossing (029/043 mid-door, 030/044 settled) and arrival on phone (025, 045). Deep links were added so click-only states could be shot: scenes 010–012, songbook 027/028, and a temporary auto-play hook for Song of Time (032–040). The agent ran build, lint and tests itself and stopped on test failures (transcript ~5577, ~58681, ~59133). It finished with build passing, lint at 0 warnings and 35/35 tests (75150–75153). The App tests check exactly one <time>, ticking to PT0S and staying at PT0S. Gaps: the agent never shot phone final seconds, the final day or the final hour. Tablet was shot only weeks out. The last change (dead-code removal, 2 files ±36) was checked only by build, lint and tests, with no new screenshot.
- **Critique quality: 7/10.** The critiques were specific and visual, and each led to a real fix. The agent caught: the backdrop too dark (001); Link hidden behind the digits (001 → 008); Link cropped at 1024×768 (014 → 018); a dangling date separator at 320 (016 → 019); hatching in the portrait JPG (021 → 022); the regular clock showing through the final-seconds overlay (024 → 046); the arrival title wrapping badly (025 → 045); hundredths clipped off the right edge and the toast over the logo (035 → 039). Its tests also caught a real keyboard-handler bug. Misses: in 011 and 012 the Deku Tree scene is heavily darkened and the countdown sits over the tree's face, yet the agent wrote 'All three worked'. The undersized logo, the small thumbnail labels and 'Play a melody', and the leftover 00:00:00:00 row on arrival were visible in nearly every shot and never raised. For the arrival, it shrank the clock but never asked whether the row should be there at all. In 040 the phone toast still covers the logo and eyebrow, which it called right.
- **Follow-through: 8/10.** Each fix can be checked in the next screenshot. The backdrop and composition changed a lot between 001 and 008. The overlay darkening shows in 024 vs 046, the hundredths move in 035 vs 039, the arrival title in 025 vs 045, and the Link crop in 014 vs 018. In 031 the scene switcher was still clipped at the bottom of the phone; it fits in 040 and 045. The early, middle and late shots show steady, clear improvement. Two weaker spots: the eyebrow contrast fix left the mobile eyebrow at about 4.3:1, and the toast fix still covers the logo on phone (040).
- **Iteration: 8/10.** About 11 look-change-look rounds in about 12 minutes of screenshots. Nearly every round fixed something visible. Nothing was reverted except the temporary tmpplay hook, which was removed on purpose and checked by grep. There was no spinning on trivia. The agent stopped once its shots looked clean. It did stop with the Deku and Field crop and darkening problem, the small logo and the small labels still visible in its own shots, and it took only one look at 844×390.
- **Self-assessment: 8/10.** HANDOVER.md has all seven sections. It is detailed and mostly accurate, and each round cites screenshots that show what it describes (004 full-size arrival clock, 024 overlay bleed, 035 clipping, 043 mid-door). It is candid about its gaps: unheard audio, no real touch, animations seen only as stills, the weak 844×390 viewport, and Deku and Field crops checked only at 1440. It also admits its own slip of writing previews to a scratch directory outside the project, confirmed in the transcript at line ~805, even though the measured fact says it never went outside. Overstated: 'All three worked' for the scenes (012 shows the Deku Tree buried) and 'Both look right now' for the toast (040 covers the phone logo). It never mentions the small logo or labels.

### Defect ledger

- never-mentioned, in 38 of its screenshots from shot 1: Official logo undersized (~140px) during countdown. Small logo in every countdown shot (001, 008, 012, 039…); the agent even shrank it on phone in round 2.
- never-mentioned, in 8 of its screenshots from shot 4: Arrival keeps a small 00:00:00:00 row that reads like a leftover clock. Round 1 shrank the clock to a 'compact' variant but kept it, and the handover presents it as a design choice (044, 045).
- never-mentioned, in 44 of its screenshots from shot 1: Scene-thumbnail labels, 'Play a melody' and mobile eyebrow too small or low contrast. Eyebrow contrast was raised in round 4 for the Deku scene only; the labels were never addressed.
- never-mentioned, in 30 of its screenshots from shot 1: Proportional numerals make digit widths shift every second. Visible from shot to shot as the digit spacing changes; never raised.
- never-mentioned, in 3 of its screenshots from shot 10: Deku Tree and Hyrule Field scenes over-darkened; countdown buries the Deku Tree face and Link. 010–012 show it; the agent wrote 'All three worked'. Section 7 only notes that the crops were checked at 1440 alone.
- never-mentioned, in 0 of its screenshots: No visible hover states on ocarina buttons and chips. Can't be seen in static screenshots.

### Claims

- accurate: npm run build, npm run lint (0 warnings) and npm test (35 tests) all pass — Transcript 75150–75153; measured build and lint pass with 0 type errors.
- accurate: Exactly one visually hidden <time> with correct ISO duration, PT0S after zero — All 8 measured moments correct; ticks every second and reaches zero.
- accurate: Round 1: backdrop too dark; arrival clock at full size competing; brightened and added compact clock — 001 is dark and 004 shows a 2×2 full-size arrival clock; 008 and 044 show the fixes.
- accurate: Round 2/3: Link moved left, hero pushed right; confirmed in 008 — 001 has Link behind the digits; 008 has Link clear on the left.
- oversold: Round 4: scenes and weather via deep links; 'All three worked' — 011 and 012 show the Deku Tree scene heavily darkened, with the countdown covering the tree's face.
- accurate: Round 5: fixed Link crop at 1024×768 and dangling separator at 320 — 018 and 019 re-shots.
- accurate: Round 6: portrait hatching removed by blur and re-encode (022 clean) — 021 vs 022.
- accurate: Round 7: darker final overlay, title wrap fixed, phone tightened — 024 vs 046 overlay; 025 vs 045 title.
- accurate: Round 8: tests caught a real window.closest bug, fixed — Transcript ~58681–59499: failures, then 35 pass.
- oversold: Round 10: hundredths clipping fixed and toast moved to the top; 'Both look right now' — Clipping is fixed (039), but on phone the toast covers the logo and eyebrow (040).
- accurate: Round 11: 043 mid-door, 044 settled desktop, 045 phone after the moment, 046 final count — Shots match the descriptions.
- accurate: Round 0: preview files were written to a scratch directory outside the project, then redone inside — Transcript ~805–938 shows /Users/pedro/.jcode/scratch; the agent disclosed it honestly, although the measured fact records no outside access.
- accurate: Known gaps: audio unheard, touch untested, animations seen as stills, 844×390 least polished, Deku/Field crops checked only at 1440 — Consistent with the screenshot coverage (015 shot only once).
- oversold: Stopped when the last screenshots stopped turning up layout or legibility problems — Its own shots still showed the Deku crop and darkening, the small logo and the small labels.
- accurate: All five assets used — Forest wide, portrait, Deku, Epona and logo all appear in the shots.

## Sound

- **pressing each of 10 controls once, in page order:** 13.6 s, 48% active, -19.1 dBFS average, dynamic range 30.5 dB, spectral change 0.053 ([spectrogram](captures/20-sound-controls.png))

Notes each control played:

- button "Play C-Up": D5
- button "Play C-Left": B4
- button "Play A": D4
- button "Play C-Right": A4
- button "Play C-Down": F4

## Ground rules

- Stay-inside rule in this run's brief: yes
- Its tool calls stayed inside the run folder.

## Process facts

- Screenshots taken by the agent: 46, spanning 11.9 minutes
- Changed after the last screenshot: 2 files, +36/-36 lines
- Agent commits in app/: 3
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
- [37 days out, desktop, after clicking "Navi. Ask for a tip."](captures/14-click-1.png)
- [37 days out, desktop, after clicking "KOKIRI FOREST"](captures/15-click-2.png)
- [37 days out, desktop, after clicking "GREAT DEKU TREE"](captures/16-click-3.png)
- [37 days out, desktop, after clicking "HYRULE FIELD"](captures/17-click-4.png)
- [37 days out, desktop, after clicking "Play C-Up"](captures/18-click-5.png)
- [37 days out, desktop, after pressing Tab once (focus style)](captures/19-keyboard-focus.png)
- [Sound: spectrogram and level of pressing each of 10 controls once, in page order](captures/20-sound-controls.png)
