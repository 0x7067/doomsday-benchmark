# Handover: Ocarina of Time remake countdown

The app is in `app/` (git history: 6 commits on top of the scaffold). Run `npm run dev`, or `npm run build && npm run preview`.

## 1. What I built and why

**The idea.** A countdown you can *play*. The Doomsday Clock works because it is one ominous number. Ocarina of Time's signature is its instrument. So the page is a big gilded clock over the game's key art, with a working ocarina underneath. The songs you play change the world around the clock.

**What a visitor sees, top to bottom:**

- **Top bar.** The current location (a gold diamond pin plus "Kokiri Forest", "Hyrule Field" or "The Great Deku Tree") and a **Sound on/off** toggle (`aria-pressed`). On phones the toggle collapses to its icon.
- **Logo.** The official Zelda: Ocarina of Time logo (`8a1enblo1b6h1.png`, alpha-trimmed and converted to WebP). It is the `<h1>` with real alt text.
- **The clock.** DD:HH:MM:SS in Cinzel, filled with a gold gradient and a hard "engraved" drop shadow that matches the logo's lettering. When a digit changes, only that digit drops in with a short blur. The unchanged ones stay still, because each digit is keyed by its place and value. In the **last 10 seconds** the clock warms to orange and the seconds pulse like a heartbeat. If sound has been unlocked, each second also gets a wooden tick, accented for the last 3.
- **The `<time>` element.** The clock *is* the page's single `<time>`. Its `datetime` holds the ISO duration (`P34DT12H59M58S`, then `PT0S` from launch on), and inside it a visually hidden sentence ("34 days, 12 hours, … until launch") is read to screen readers. The visible digits are `aria-hidden`.
- **Date line.** "November 5, 2026 · Midnight Eastern" plus the moment in the visitor's own time zone via `Intl` (e.g. "Thursday, November 5 at 2:00 AM GMT-3 where you are").
- **Add to calendar.** Generates an `.ics` file locally, with a 15-minute reminder. No network needed.
- **The ocarina panel** (bottom dock):
  - A five-line staff that fills with the notes you play, each one sitting on its real pitch line and sliding in from the right. It holds the last 8 notes.
  - The N64 pad: blue **A** plus four yellow C buttons (▼ ▶ ◀ ▲). The buttons fire on `pointerdown` so a note sounds the instant you touch it.
  - **Keyboard:** `A` / `←` `↑` `→` `↓` (or `1`–`5`). Tab focus plus Enter/Space on a pad button also plays it.
  - The notes are synthesised in Web Audio at the real ocarina pitches (D4 F4 A4 B4 D5), with breath noise, delayed vibrato and a feedback-delay "temple" reverb. There are no audio files.
  - When the last six notes match a song, the title turns into "You played *Saria's Song*", the panel border lights up, the notes glow, the secret-found chime plays, and about 0.9 s later the world changes.
- **Songs** (button in the panel header) opens a native `<dialog>` song list. Each song shows its notes and what it does, and has a **Play** button that performs it with its rhythm. That way nobody has to know the songs already. Close it with Esc, the × button, or a click on the backdrop.

**What each song does:**

| Song | Notes | Effect |
| --- | --- | --- |
| Saria's Song | ▼ ▶ ◀ ▼ ▶ ◀ | Crossfades back to **Kokiri Forest** |
| Epona's Song | ▲ ◀ ▶ ▲ ◀ ▶ | Crossfades to **Hyrule Field** (Link on Epona) |
| Zelda's Lullaby | ◀ ▲ ▶ ◀ ▲ ▶ | Crossfades to **the Great Deku Tree** |
| Sun's Song | ▶ ▼ ▲ ▶ ▼ ▲ | Toggles **night**: art darkens and cools, motes become blue fireflies |
| Song of Storms | A ▼ ▲ A ▼ ▲ | Toggles **rain** (canvas rain, desaturated art). Play again to clear it |
| Song of Time | ▶ A ▼ ▶ A ▼ | **A glimpse through the Door of Time**: about 6.5 s preview of the launch screen, with a "Return to the present" button |

**Ambient motion.** One canvas, one rAF loop. It draws drifting motes tinted per scene (green in the forest, warm in the field) and **Navi**, a glowing fairy with fluttering wings who follows your pointer on a spring. After 2.6 s without input she drifts back to an idle spot beside the logo (by the top bar on phones). The backdrop also has a 40 s Ken Burns drift.

**The moment (zero).** The clock never shows negative numbers. At zero:

- a gold bloom washes over the screen
- "The legend awakens / Available now on Nintendo Switch 2" rises in
- golden sparks fountain from the bottom
- a rising fanfare plays (if sound was unlocked)
- the clock stays on the page, small and dimmed at 00:00:00:00, with `datetime="PT0S"`
- the tab title switches to "Ocarina of Time is out now"

Loading the page after launch shows the same state. Before launch, the tab title counts down too.

**Assets: what I used and why.**

- `thumb-1920-1414762.png` (young Link in Kokiri Forest, landscape): the **default desktop backdrop**. It is the most iconic image, and Link sits left of centre, which leaves the middle free for the clock.
- `f55hr5n4xdoh1.jpg` (the same scene, a tall 1178×2552 portrait): the **phone backdrop** for Kokiri Forest. It was clearly made for vertical screens, so phones get real art instead of a crop.
- `link-on-epona…avif` and `link-standing-before-the-great-deku-tree…avif` (3200/3840 px remake screenshots): the **Hyrule Field** and **Deku Tree** scenes, reached through songs. For phones I made portrait crops framed on Link and Epona, and on Link and the tree (`scripts/build-art.mjs`).
- `8a1enblo1b6h1.png`: the logo.

The originals are kept in `app/art-src/`. A sharp script turns them into responsive WebP sets (960/1600/1920–2560 wide, 640/1080 tall) and 32 px blurred placeholders. A `<picture>` with an aspect-ratio media query picks wide or tall art. Total art shipped is about 2.4 MB across every size, and a visitor downloads one size of one scene up front.

**Fonts.** Cinzel (a variable font, used for the display text and the clock) and Cormorant Garamond (body text), self-hosted through `@fontsource`. I checked `dist/` for CDN references and found none.

**Beyond the brief:** the ocarina and songs, the scene/weather system, Navi, synthesised audio, local-time display, the `.ics` export, a live tab title, screen-reader announcements for the final 10 seconds and the launch, and reduced-motion support. Under reduced motion, CSS animations collapse to near-zero duration and the canvas freezes the motes and Navi and skips rain and sparks.

## 2. How I worked

Shot numbers refer to `.bench/shots/NNN-*.png`.

1. **Asset review.** I converted the AVIFs and looked at all five images (scratch previews, since deleted). I picked the landscape forest as the default because of its composition, and the tall JPG for phones. I made portrait crops for the other two scenes and checked them directly (`src/art/*-portrait-640.webp`). The first crop offsets cut Epona's head and the tree, so I moved them right (`left: 1350` and `280`) and they framed correctly.
2. **Logic first.** I wrote and tested `countdown.ts`, `songs.ts` and `world.ts` (19 tests) before any UI.
3. **Shot 001** (1440×900, first render). The overall composition worked. Wrong: the date line wrapped so that "· Midnight Eastern" was orphaned on its own line, and the top staff line was clipped, so only 4 of 5 lines showed. Fix: a nowrap span for the date line, and staff lines offset by half their height.
4. **Shot 002** (390×844) and **shot 003** (zero moment on desktop). The phone layout fit, but the logo sat on the brightest part of the portrait sky and lost contrast. At launch, the small clock's labels ("DAYS HOURS…") collided into one unreadable row. Fix: a stronger top scrim on narrow screens, and at launch I hide the small clock's labels and the eyebrow line. I also shortened the eyebrow to "Arrives on Nintendo Switch 2 in" so it fits on one line on phones.
5. **Shots 004–006** (phone again, Hyrule Field at night, Deku Tree in rain). These used a dev-only `?world=` param I added, because `./shot` can't click. The phone logo contrast was confirmed fixed. Night and rain read clearly, and the Deku Tree scene centres the tree behind the clock.
6. **Shot 007** (`?play=saria`, another dev-only param). This was the first look at the ocarina in action. The notes sat on the correct pitch lines and the "You played Saria's Song" title showed, but the staff felt cramped, so I raised it from 52 to 64 px.
7. **Shots 008–011.** Songbook (008), Song of Time vision (009), final seconds (010), launch on phone (011). 008 and 010 looked right: the orange heartbeat state was visible. 011 is the screenshot that showed the launch-label collision mentioned above, before the fix landed. In 009 the vision's text sat on top of the date line and calendar button.
8. **Shots 012–013** (retakes). 013 confirmed the launch fix on the phone (a clean "00:00:00:00" with no labels). 012 still showed the date row and calendar button under the vision, which muddled it, so I hid `.hero__meta` during the vision. **Shot 022** confirmed that fix.
9. **DOM tests.** I added `App.test.tsx` (jsdom) to check: exactly one `<time>`, `?now=` ticking, PT0S, songs changing the scene. It found a real bug. The keyboard handler called `e.target.closest` on a non-Element target and crashed. I fixed it with an `instanceof Element` guard. It also found that my own expected day count was off by one (34 days, not 35), which confirmed the code was right and the test was wrong.
10. **Shots 014–016** (768×1024 tablet, 1280×680 short laptop, 390×664 short phone). Wrong: the tablet used the phone portrait art, which was blurry and upscaled behind a wide layout. The short laptop cut off the bottom of the ocarina panel, and the short phone cut off the pad. Fix: tall art only below a 2:3 aspect ratio, and a `max-height: 760px` block that tightens the logo, staff, pad and paddings and hides the keyboard hint. **Shots 017–019** confirmed all three. The tablet now gets landscape art framed on Link, and the whole panel fits on both short screens.
11. **Shots 020–021** (phone Epona's Song transition, forest storm at night). 020: the scene crossfade and pin label update work on the phone, but Navi idled right over the logo. 021: the storm-night effect reads well. Fix: Navi's idle home is now by the top bar on narrow screens. **Shot 025** confirmed that she starts and idles clear of the logo.
12. **Shot 023** (songbook at 390). The dialog fits and scrolls internally. It also made me notice that the Zelda's Lullaby copy promised a "Triforce" effect that doesn't exist, so I rewrote it to say what actually happens.
13. **Shot 024** (390 wide with 293 days left). Checked that a three-digit day count still fits on a phone. It does.
14. **Audio validation round.** Screenshots can't verify sound, so I made the synth accept any `BaseAudioContext` (`Ocarina.attach`). That let me render it through `node-web-audio-api`, a real Rust Web Audio engine and not a mock, inside vitest. I measured the output samples:
    - each of the five notes: autocorrelation pitch within 3% of D4/F4/A4/B4/D5
    - peak levels: a single note 0.17, the chime 0.19, the fanfare chord 0.27, the worst case (a song plus the chime overlapping, or ten notes mashed in one second) 0.31. So there is plenty of headroom and nothing clips.
    - notes decay to under 1% RMS, the echo is quieter than the note it repeats, the tick is short, and mute renders exactly zero.

    I mutation-tested these checks to make sure they can fail. Detuning the oscillator by 6% failed 5 tests, and zeroing the master gain failed 9. I also rendered Zelda's Lullaby, the chime and the fanfare to a WAV and looked at an ffmpeg spectrogram (since deleted, like the scratch previews). It showed six distinct notes on the expected bands with the specified rhythm (long-short-longest), a descending-then-rising chime, and a sustained D major chord at the end. Mean level was -22 dB, max -10 dB.

    New jsdom tests check when sounds fire:
    - keys play the right frequencies, and the chime fires once per completed song
    - the sound toggle sets `muted` and `aria-pressed`
    - the final seconds tick 4, 3, 2, 1 with the last three accented, and the fanfare plays exactly once and never repeats
    - nothing plays at zero if the visitor never interacted

    Writing these surfaced one test-harness subtlety. A single `act()` across several seconds batches every tick into one React render, so per-second effects only ran once. Stepping one second per `act()` reflects the browser. The app code was correct.

## 3. What I looked for

- Does the clock read in one glance from across a room, and does it stay the hero over busy art? (contrast, scrim, size)
- Do the assets look like they were chosen, not just placed? Is the subject framed on every aspect ratio, and is no art upscaled or blurry?
- Does anything collide, wrap badly or get clipped at 390, 768, 1280×680, 1440, or with 3-digit days?
- Is the interaction discoverable by someone who has never played the game? (the Songs list with Play buttons)
- Does every effect the copy promises actually happen?
- Is the zero moment an event, not just a 0? And is the post-launch page correct on a fresh load?
- Does the `<time>` contract hold exactly: one element, every tick, `PT0S`?
- Could a staff engineer review this? Pure logic separated from React, no free-running `setInterval`, no effects restarting every second, lint-clean without suppressions.

## 4. How I decided it was done

I stopped once a full pass across every state (default, each scene, night, rain, songbook, vision, final ten seconds, launch) at phone, short phone, tablet, short laptop and desktop found nothing left that I would fix before launch. The last few rounds turned up only small things (Navi's resting spot, one line of copy), and each fix was confirmed by a follow-up shot. All gates were green: build, lint at 0 warnings, 44 tests, and no off-origin URLs in `dist/`.

## 5. How the code is organized

```
app/
  art-src/                 original assets, renamed for meaning
  scripts/build-art.mjs    sharp pipeline → src/art/*.webp (output committed; build never needs sharp)
  src/
    main.tsx, index.css    entry; all styles, tokens at the top, sectioned by component
    App.tsx                composition: clock, world reducer, sound, launch/vision, title, a11y live region
    art.ts                 scene manifest: srcsets, placeholder, focus points, mote tint
    components/
      Backdrop.tsx         layered <picture> crossfade between scenes, memoised
      Atmosphere.tsx       single canvas/rAF: motes, rain, sparks, Navi; props via ref so the loop never restarts
      Countdown.tsx        the one <time>, per-digit keyed animation
      OcarinaPanel.tsx     staff + pad
      Songbook.tsx         native <dialog>
    hooks/
      useClock.ts          ?now offset captured once; timeouts aligned to the countdown's second boundary; resync on tab visibility
      useOcarina.ts        phrase state, keyboard, song recognition, rhythmic playback, timer cleanup
      useReducedMotion.ts  useSyncExternalStore over matchMedia
    lib/                   pure, framework-free
      countdown.ts         remainingUntil, toIsoDuration, ?now parsing, msUntilNextTick
      songs.ts             notes, songs, matchSong
      world.ts             scene/night/rain/vision reducer (+ dev-only worldFromSearch)
      audio.ts             Web Audio ocarina, ticks, chime, fanfare
      calendar.ts          .ics generation
    *.test.ts(x)           vitest
```

Dev-only URL params (`?world=`, `?play=`, `?songbook`) sit behind `import.meta.env.DEV`. I checked that the production bundle doesn't contain them. `?now=` works in every build.

## 6. How I verified it

- `npm run build` and `npm run lint` pass with 0 warnings and 0 errors.
- `npm test` runs 44 vitest tests:
  - Time math: Nov 5 05:00Z target, the 37d11h10m5s example → `P37DT11H10M5S`, the 10-second example, ceiling rounding at the boundary, never negative, `PT0S`.
  - `?now=` parsing, including garbage input and an unencoded `+`.
  - Tick alignment.
  - Song matching, including partial phrases and songs at the end of a longer phrase.
  - Key mapping and the world reducer.
  - jsdom tests that mount the real `<App/>` with fake timers: exactly one `<time>`; `?now=…23:59:50-05:00` reads `P0DT0H0M10S`, then `…9S` after one second, then `…6S`; it reaches `PT0S` and stays there 60 s later with no negative numbers; a load after launch is in the launched state; Epona's Song on the keyboard changes the scene; a pad click plays a note; the Song of Time shows the vision without changing `datetime`.
  - Sound cues in the app: note frequencies per key, chime once per song, the mute toggle, ticks 4-3-2-1 with accents, the fanfare exactly once, and silence for visitors who never interacted.
  - `audio.test.ts` renders the synth through a real Web Audio engine (`node-web-audio-api`, a dev dependency only, not in the bundle) and checks the samples: pitch for all five notes, no clipping, audible level, decay, echo level, tick length, and mute = digital silence. I mutation-tested these checks to confirm they fail when the synth is broken.
- Offline: I grepped `dist/` for URLs. The only hits are the SVG namespace and React's error-doc string. All 5 font files are bundled.
- Visual: 25 `./shot` screenshots across 390×844, 390×664, 768×1024, 1280×680 and 1440×900, every world state, the final seconds, and launch. `./shot` reported no console errors.

## 7. What's still wrong or unfinished

- **The sound was checked by measurement, not by ear.** Rendered output was confirmed for pitch, levels, envelopes and timing, and inspected as a spectrogram. But whether it *sounds* like an ocarina rather than a sine wave with breath is a taste call nobody has made by listening. I also only rendered it in the node engine, not in Safari or Firefox. Audio only starts after a first click or keypress (browser autoplay rules), so someone who never interacts gets a silent launch. A test confirms this behaviour.
- **The interactions were never exercised with a real pointer.** These are Navi following the cursor, touch on the pad, crossfade timing, and the songbook's Play button. They are covered by code and jsdom tests, and by screenshots of the resulting states driven through the dev params, but not by clicking in a real browser.
- **Song melodies are simplified.** The note sequences are correct, but the in-game Song of Time and Zelda's Lullaby have more nuanced rhythms than my beat values.
- **The portrait key art (`kokiri-portrait-1178.webp`, about 500 KB) is the heaviest file.** I encoded it at quality 68, but a phone on a slow connection will see the blurred placeholder for a moment.
- **The `.ics` download** was not tested in a real calendar app. The format follows RFC 5545 but no one has imported it.
- **Long locale strings.** The "where you are" line uses the browser's locale format. A very long localized string could wrap onto two lines on a 390 px phone. It won't overflow, but I only checked it in English.
