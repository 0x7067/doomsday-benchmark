# HANDOVER — T-minus Ocarina of Time

A live countdown to the release of The Legend of Zelda: Ocarina of Time on Nintendo Switch 2.
The moment is `2026-11-05T00:00:00-05:00`. Front-end only, no backend, works fully offline.

`app/README.md` is the developer's guide — layout, scripts, and the non-obvious traps in the
code. This document is for whoever picks the work up and wants to know what it is, why it is like
that, and what is still wrong with it.

---

## 1. What I built

A single-page launch site, structured as a poster followed by four chapters.

**The hero** is the countdown, treated as an instrument rather than a widget. A gold medallion dial
— bezel, engraved minute and hour tracks, Roman numerals with a Triforce at twelve and a date
aperture at six — sits at the centre of a drifting, heavily-scrimmed still of the Kokiri Forest. The
hands read the real wall clock *in the moment's own timezone*, so they sweep normally today and
converge exactly on twelve at midnight Eastern, wherever the visitor is. Below the dial, the
remaining time in days, hours, minutes and seconds. Along the bottom, a three-frame rail of the
remaining assets that doubles as a way into the gallery. Over the whole thing, a canvas of drifting
Navi motes and a breath of film grain.

**I. The Great Deku Tree** — a full-bleed band. *"It gave him a year, and no more."*

**II. The world, rebuilt** — an editorial spread: the tall poster plate beside two 16:9 scenes, with
a scroll parallax and captions that lift on hover and focus.

**III. The Song of Time** — a playable ocarina, synthesised in Web Audio, no samples. The Song of
Time is the real one: C-Right, A, C-Down, twice, which at the default tuning is the A–D–F figure the
original actually plays. Play it and the Door of Time opens: the dial's Triforce ignites, the page
warms, and a chord rings out through a synthesised plate reverb. The transposition control is part
of the test, not decoration — the tune is written on A4, and playing it correctly on the wrong
tuning gets you a specific, fixable answer.

**IV. The moment** — the facts, the countdown in words, a copy-to-clipboard button, and a closing
line. The **engine room** in the footer lets you jump the clock to T−1 day, T−30 seconds, midnight
or past it, so you can watch the arrival state without waiting five weeks for it.

Every plate — the hero backdrop, the Deku band, the gallery, the rail — carries an 18-pixel blurred
WebP of itself as a `background-image`, 394 bytes in total. A plate is therefore never an empty
rectangle: while the photograph decodes, or if it never arrives, what shows is a recognisable blur of
the same frame. There is a check for this in `verify.mjs` that aborts the image request outright.

**The arrival** is a treated moment rather than a stop: the hands lock at twelve, the bezel flashes
once, a gold ring sweeps out, the forest lifts into warm dawn, the palette shifts from Navi mint to
gold, and the copy changes to "Out now". From then on the clock holds at zero.

---

## 2. The clock, and how it is wired

`src/lib/clock.ts` is the only place time is read. It is a monotonic virtual clock:

- It reads `performance.now()`, not `Date.now()`, so a corrected system clock or a throttled
  background tab cannot make it drift.
- It fires subscribers when the **displayed second changes**, not on a fixed interval, so the digits
  never flicker mid-second.
- One `requestAnimationFrame` loop drives every subscriber, so the page costs one loop no matter how
  many things are watching. The loop is suspended entirely in a hidden tab and re-synced on return.
- `?now=` is parsed by `parseNowParam` and, if valid, becomes the *origin*: the page behaves as
  though it had loaded at that instant and keeps ticking. An unparseable value is ignored and the
  real clock is used — a typo in a share link lands on a working page.
- `setTravel()` displaces the timeline. The engine room uses it, and nothing else does. The URL is
  never written to, so a preview exercises exactly the code path real time would.

**The single `<time>` element** is the digits in the hero. Its `datetime` is the remaining ISO 8601
duration, updated every tick: `P35DT12H44M10S`, dropping zero components, and `PT0S` from the moment
onward. Seconds are **ceiled**, not floored — floor would reveal a premature zero for the last half
second of every minute.

**Rendering is split deliberately.** The digits and everything downstream re-render once a second
through React. The clock hands are driven imperatively: `DoomsdayDial` writes `style.transform` from
its own frame loop and never re-renders. Moving that work into render state would re-diff a
hero-sized tree sixty times a second to change one character.

**The urgency ramp** (`urgency()` in `time.ts`) returns 0→1 as the moment closes — deliberately
non-linear, so five months out nothing looks alarmed and the last hour does. It is written once per
render to `--urgency` on `<html>`, and every palette shift, glow and accent colour on the page is
derived from it in CSS.

**Announcements.** A screen reader watching a value change once a second is unusable, so the page is
silent and says only three things: one hour, one minute, and ten seconds out — plus arrival. That
state is adjusted during render rather than in an effect.

---

## 3. How I verified it

Three Playwright harnesses run against the **production build** (`npm run build` → serve `dist/`),
plus a performance pass under 4× CPU throttling. 94 checks, all passing. They are in
`verification/` next to this document, so the claims below are checkable rather than assertions:

```bash
cd app && npm run build
cd ../verification && npm install          # just playwright
node verify.mjs        ../app/dist         # 45 checks: the clock contract and placeholders
node interaction.mjs   ../app/dist         # 28 checks: ocarina, engine room, clipboard
node a11y.mjs          ../app/dist         # 21 checks: reduced motion, keyboard, touch
node perf.mjs          ../app/dist         # paint, frame rate, heap, 4x CPU throttled
```

Each script serves `dist/` from a throwaway static server, so nothing is left running and the only
dependency is `playwright`.

### Clock contract — 45/45

| | |
| --- | --- |
| Exactly one `<time>` element on the page | 1 |
| `datetime` is a valid ISO 8601 duration | `P35DT12H42M53S` |
| `datetime` advances every second, never negatives | verified over 2.1 s |
| Day field is 3 digits, others 2 — the column never reflows | `035 12 42 53` |
| `?now=2026-11-04T23:59:50-05:00` shows 10 s on arrival | `000 00 00 10`, `PT10S` |
| …counts to 7 at +3.1 s, reaches zero at +10 s, holds at 0 | `PT0S`, stays `PT0S` |
| `?now=` 45 days out breaks down correctly | `045 13 00 00`, `P45DT13H` |
| `?now=` exactly the moment is zero immediately | `PT0S` |
| Invalid and empty `?now=` fall back to real time | verified |
| No horizontal overflow at 360/390/414/480/640/768/900/1024/1280/1440/1920 px | 11 widths |
| No cross-origin requests; all three fonts loaded; every image decoded | verified |
| One `h1`, five `h2`, `main`/`footer`/`nav`, no `img` without `alt`, `lang="en"` | verified |
| A plate keeps its blurred placeholder when its image request is aborted | verified |
| Captions still read with no image at all | verified |
| No console errors | verified |

### Hero fits the fold — measured, not eyeballed

The hero is `min-block-size: 100svh` with a grid, so if the composition is taller than the viewport
the rail slides under the fold. Measured at eight common sizes:

| Viewport | Hero | Rail caption bottom | |
| --- | --- | --- | --- |
| 1440×900 | 900 | 884 | fits |
| 1920×1080 | 1080 | 1062 | fits |
| 1366×768 | 768 | 754 | fits |
| 1280×800 | 809 | 794 | fits |
| 1024×900 | 900 | 884 | fits |
| 768×1024 | 1024 | 1006 | fits |
| 390×844 | 844 | 829 | fits |
| 360×780 | 780 | 766 | fits |

Below `49rem` of height the kicker line is dropped: on a short laptop the dial and the readout are the
content, and the kicker is a flourish.

### Interaction — 28/28

- No `AudioContext` exists before any user gesture. A note builds the graph lazily: 5 oscillators,
  1 convolver, from a synthesised impulse response.
- A wrong note opens no pips and does not open the door. The correct six notes do, and the dial's
  Triforce computes to `rgb(182, 255, 219)`.
- The tune does **not** open the door when transposed, and the readout says why; retuning to A4
  re-opens it.
- "Play the tune" walks the keys and resets the pips. Sound can be muted.
- Engine room: a preset lands exactly on `PT30S`; "Go to midnight" lands on `PT0S` and flips the
  hero to its arrival state; "Back to real time" restores; the scrubber moves the clock; the URL is
  never touched; copy-to-clipboard yields a sentence and a clean URL.

### Accessibility and motion — 21/21

- Under `prefers-reduced-motion: reduce`: the dial halo and backdrop drift stop, the mote field is
  drawn once and frozen, revealed content is fully opaque, and the countdown still ticks.
- Tab order: skip link first, then the triptych, then the gallery and footer links, then the five
  ocarina buttons, then the engine room. Focus is never trapped. Focused buttons get a 2 px outline.
- `Enter` on a focused note button plays it. Arrow keys do not scroll the page while the instrument
  is in view, and **do** scroll the page — and do **not** play the instrument — anywhere else.
- At 390 px, every interactive target is at least 32 px.

### Performance — 4× CPU throttled, 1440×900

| | |
| --- | --- |
| First contentful paint | 220–260 ms |
| DOMContentLoaded | 72–80 ms |
| Sustained frame rate (canvas + rAF hands) | 54–59 fps |
| Long tasks over 5 s | none |
| JS heap | 10 MB |
| Mobile FCP (390×844, dpr 3, 4× throttled) | 240–290 ms |
| Whole page transferred | 1.7 MB, 165 kB of it text |
| Blurred placeholders | 394 bytes, no request |

Ranges, because the numbers move run to run on a shared machine; the frame rate
figure is the one to watch if you change anything in the render path.

### Also checked by hand

Screenshots at 360–1920 px in both normal and arrival states, the final-minute palette at
`?now=2026-11-04T23:59:22-05:00`, and `prettier --check .`, `tsc -b`, `oxlint` all clean.

### Assets

All five supplied images were re-encoded rather than shipped as-is; the originals are not in the
repo. The 2.9 MB JPEG became 360/560/900-wide WebP, the 2.8 MB PNG became 800/1280/1920-wide WebP,
the logo was trimmed to its alpha bounding box, and the two AVIFs were downscaled from 3840 and
3200 to 800/1280/1920. Rail thumbnails have their own small encodes because the frames are at most
230 CSS pixels wide. Fonts are three latin-subset variable woff2 files totalling 76 kB.

---

## 4. Things I decided, that you may want to overrule

- **The "engine room" is a visible debug panel in the footer.** A countdown you cannot see the end
   of is a poster, and this is how I convinced myself the arrival state is right. It is labelled as a
   control panel rather than dressed as content. If this ships to users, delete `EnginePanel` from
   `SiteFooter` — nothing else depends on it.
- **The tune requires the right transposition.** The default tuning is already correct, so playing
   the six notes untouched is the happy path; only someone who deliberately transposes meets the
   extra rule. I judged that better than a transpose control that changes the sound and nothing
   else, but it is one extra thing to get wrong.
- **The Song of Time is a real, playable instrument, not a button labelled "play tune".** That cost
   roughly 400 lines and a browser bug hunt, and I think it is the thing people will remember. If
   the brief is read as "don't over-build", this is the first thing to cut.
- **The scroll reveal has an idle fallback.** Content fades up on intersection, but if nobody has
  scrolled, touched or pressed anything within 2.4 s, every pending reveal fires at once. Content
   that is `opacity: 0` until observed is content that is *missing* to a screen reader walking the
  DOM, to a print stylesheet, and to any full-page screenshot — the first version of this page
  rendered four black sections in a full-page capture. The first real interaction cancels the
  fallback and the observer takes over. If you would rather have the pure version, delete the
  `IDLE_MS` block in `useInView.ts`.
- **Copy is written in the voice of the games.** "It gave him a year, and no more" is the Deku
  Tree's bargain; the clock is the same bargain. That framing is doing real work in the layout and
  is easy to lose if the text is swapped for something plainer.
- **The Navi mote canvas does not react to `--urgency`.** I planned to warm and thicken the field as
  the moment approached and it did not justify the coupling — the palette and the dial bloom already
  carry it. The field does fade out as the hero scrolls away (`--presence`), because a full-strength
  starfield over the footer read as a nebula rather than the Kokiri Forest. It is the most obviously
  missing piece of motion on the page.
- **I shipped the verification harnesses** in `verification/`, outside `app/`, so that `app/`'s only
  dependency stays React. They need `npm install` in that folder, which needs network. Everything
  about the *site* is offline; the harness is not.
- **Three edits to this file's subject matter went missing.** Two CSS rules and one paragraph of copy
  were "applied" by a scripted find-and-replace that silently matched nothing, and I did not notice
  for a while. One of them was the rail width above, which is why I now measure the layout rather
  than trust that an edit landed. If you change copy, check it rendered.
- **I did not commit anything.** The working tree has the finished state uncommitted. You asked for
  a handover, not a commit, so I left the history alone.

---

## 5. Known wrong or unfinished

1. **The full-page screenshot race.** Gallery images are `loading="lazy"`, and a headless full-page
   capture does not scroll, so a frame can be captured before its image decodes. The blurred
   placeholders make the failure graceful rather than a void, but the sharp image is not there. Give
   the capture a 9 s wait and everything is present.
2. **The scrubber pins at its far end** whenever the real countdown is more than a day out, because
   the range is the last day plus an hour either side. Dragging it *left* walks back toward the
   moment, which is the useful direction, but a user who tries to drag right from 35 days out sees
   nothing happen. The presets are the fast path. I would fix this with a two-stage control if it
   mattered.
3. **No `og:image`.** The social card has no image, so link previews will be text-only. The poster
   at 900 wide would do; it needed a decision about cropping that I did not want to make for you.
4. **The gallery's sticky poster leaves a tall empty column** in a full-page capture, because sticky
   positioning has nothing to stick to in a static image. On screen it behaves correctly.
5. **`prefers-contrast: more` and forced-colors are not handled.** The design leans on low-contrast
   hairlines and a dim type scale, which is the right call on a dark photographic page but will not
   survive a high-contrast mode.
6. **Only English.** `toSpokenDuration`, the number formatting, the `Intl` reads and the document
   title are all English-only. Localising means a real translation pass on the copy, not just a
   locale swap.
7. **The dial's Roman numerals are decorative in the sense that nothing is announced** — the dial is
   `aria-hidden` and the numeric truth is the `<time>` element. I think that is right, but it does
   mean a screen reader user gets no sense of the instrument, only the number.
8. **The Ocarina's audio is not tested in Safari or Firefox.** It is plain Web Audio with a
   `webkitAudioContext` fallback and I verified it only in Chromium. The `setEnabled` path calls
   `suspend()`/`resume()` on the context, which I have not seen behave under rapid toggling.
9. **Section III's heading promises something the ocarina cannot do**, deliberately — "It will not
   move the clock. It was never going to move the clock." If a reviewer reads that as a broken
   feature, the line is doing the wrong job.

---

## 6. Things to know if you touch the code

- **`min(100% - x, y)` is not a valid `min()`.** The bare product makes the whole declaration
  invalid, the browser drops it, and the element silently sizes to its content. I wrote
  `inline-size: min(100% - var(--gutter) * 2, 60rem)` on the hero rail, spent a while wondering why
  the rail was 190 px too wide, and found it by measuring rather than by reading. Use
  `calc()` with a separate `max-inline-size`. There is a note on the rule.
- **A CSS `url()` shorthand is not a `background-image` value.** `background-image: url(x) center /
  cover` is dropped for exactly the same reason — the positioning and sizing belong in their own longhands.
- **`<picture>` is forced to `display: block` in `styles/base.css`.** It is inline by default, which
  makes `height: 100%` on the image inside it resolve against an auto-height box, so the image
  quietly falls back to its intrinsic aspect ratio and stops filling its frame. This bit me: every
  backdrop and plate was leaving a strip of empty page underneath. The comment is in the file; do not
  remove the rule.
- **The SVG `#naviGlow` filter must stay `filterUnits="userSpaceOnUse"`.** A vertical line has a
  zero-width object bounding box, and a filter on one renders nothing at all — that is why the
  second hand was invisible for a while.
- **`timeOfDayAtMoment` is memoised at module scope on purpose.** It is called on every animation
  frame; constructing an `Intl.DateTimeFormat` sixty times a second is one of the more expensive
  things you can ask a browser to do.
- **`OcarinaPanel` does not dispose its `AudioContext` in an effect cleanup.** Doing so breaks under
  React Strict Mode's deliberate mount/unmount/mount, which leaves a disposed context in place. It
  closes on `pagehide` instead. Do not "fix" this.
- **`Reveal` accepts an optional `observerRef`** so a component can watch its own box (the ocarina
  uses it to know when to listen for the arrow keys) while still using the shared reveal behaviour.
  It has to be threaded *into* `useInView`; passing it and swapping it in afterwards leaves the hook
  watching an unattached ref and the reveal never fires.
- **CSS custom properties `--urgency`, `--depth` and `--parallax` are load-bearing.** `--parallax`
  is clamped in JS specifically so a full-page capture or a deep link cannot shove a plate out of
  its own frame.
- **The gallery's parallax travel is a percentage, not pixels** (`calc(var(--parallax) * var(--depth)
  * -38%)`) so it stays inside the frame at every plate size. If you increase the image `scale`,
  check the travel stays under half of it.
