# Handover — Ocarina of Time "Doomsday Clock"

A front-end-only countdown to **The Legend of Zelda: Ocarina of Time** on Nintendo Switch 2.
The clock hits zero at **November 5, 2026, 00:00 Eastern (`2026-11-05T00:00:00-05:00`)**.

Everything lives in `app/`; the brief's assets live in `assets/` and were copied into
`app/src/assets/art/` when used.

---

## 1. The experience

**One scroll, three acts.**

1. **Hero — the clock.** Full-bleed key art (Link on Epona, Death Mountain burning at dusk),
   the gold logo, and a four-unit countdown carved in Cinzel with a metallic gold gradient.
   Drifting canvas embers, a slow Ken Burns on the art, hairline corner brackets on each tile,
   separator diamonds that pulse once per second, and a scroll-out fade as you leave.
   Two working calls to action: **Add to calendar** (builds a real `.ics` in the browser and
   downloads it) and **Share** (native share sheet, clipboard fallback).
2. **"Return to Hyrule" — the promise.** The Great Deku Tree at full bleed with a scroll
   parallax, a short pitch and three feature columns that slide in on scroll.
3. **"Play the Song of Time" — the invitation.** The forest clearing behind a working ocarina:
   five note buttons laid out like the N64 controller (C-up / C-left / A / C-right / C-down),
   each synthesising a real tone through the Web Audio API. A staff records what you play;
   playing **▶ A ▼ ▶ A ▼** unlocks a hidden message and a shower of golden notes.

Two more things hide in the hero: **Navi** — a fairy who follows your pointer around the key
art and whispers one of several lines when clicked — and the **sound toggle**, which arms all
of the page's audio. Sound is off until a visitor asks for it.

At zero the countdown switches to **AVAILABLE NOW**: the tiles lock at zero with a golden
glow, a flash of light and sparks fires across the screen, a chime plays if sound is on, and
the tab title becomes "Ocarina of Time — out now on Nintendo Switch 2".

### Time travel

`?now=<ISO 8601>` makes the page behave as if it loaded at that instant, then keep ticking:

```
/?now=2026-11-04T23:59:50-05:00   # 10 seconds left; hits zero 10s later, live
/?now=2026-11-05T00:00:01-05:00   # already released
```

---

## 2. Run it

```bash
cd app
npm run dev      # dev server
npm run lint     # oxlint — passes clean
npm run build    # tsc -b && vite build — passes clean
npm run preview  # serve dist/
```

No dependencies were added: React 19 + Vite 8 + TypeScript, plus the browser's own canvas,
Web Audio and Intl APIs.

---

## 3. Code map

```
app/
  index.html                  title, meta, theme colour, favicon
  public/favicon.svg          gold Triforce mark
  src/
    App.tsx                   page composition; tab-title clock; release chime
    main.tsx                  React root
    lib/
      time.ts                 release instant, ?now parsing, unit split, ISO-8601 duration
      audio.ts                Web Audio synthesis: ocarina voice, glass-bell chime
      calendar.ts             .ics builder/download + share/clipboard
      random.ts               deterministic pseudo-random (pure renders)
    hooks/
      useCountdown.ts         the virtual clock (real/virtual origin pair)
      useSound.ts             one source of truth for mute state
      useReducedMotion.ts     live prefers-reduced-motion
      useScrollFx.ts          useParallax + useReveal (rAF-throttled, IntersectionObserver)
    components/
      Hero.tsx / .module.css        act one
      Countdown.tsx / .module.css   the <time> element and its units
      Embers.tsx                    canvas particle field (pre-rendered sprites, DPR-aware)
      Navi.tsx / .module.css        pointer-following fairy with speech bubble
      HyruleChapter.tsx             act two (Deku Tree)
      OcarinaChapter.tsx            act three shell (forest)
      Ocarina.tsx / .module.css     the instrument + Song of Time easter egg
      ReleaseBurst.tsx / .module.css  zero-moment celebration
      Footer.tsx / .module.css      small print + ?now hint
      Icons.tsx                     inline SVG icons
    styles/
      fonts.css               @font-face for self-hosted Cinzel + Inter
      global.css              reset, design tokens, buttons, kicker, grain, reveal
    assets/
      art/                    hero-epona.avif, deku-tree.avif, forest.avif, logo png
      fonts/                  cinzel/inter woff2 (latin + latin-ext)
```

### The countdown contract (requirements 3–6)

`useCountdown` captures a **real/virtual origin pair** on mount:

```ts
const origin = { real: Date.now(), virtual: parseNowParam(location.search) ?? Date.now() }
```

Every 200 ms it re-derives `virtual = origin.virtual + (Date.now() - origin.real)`, computes
`ceil(remaining / 1000)` and only re-renders when that whole second changes. Background-tab
throttling, clock drift and `visibilitychange` therefore self-correct on the next tick.

`Countdown.tsx` renders exactly **one `<time>` element**, wrapping the four visible units, with
`datetime` set to an ISO 8601 duration of the remaining time — all units written out
(`P36DT2H43M53S`), and the canonical `PT0S` once the moment has passed. A `released` flag
clamps everything at zero and flips the page into its release state, so no negative numbers
can ever reach the DOM.

### Assets

| asset | where it went |
| --- | --- |
| `link-on-epona-…avif` | hero key art, desktop and mobile (responsive `object-position`) |
| `link-standing-before-the-great-deku-tree-…avif` | act two full-bleed art |
| `thumb-1920-1414762.png` | act three forest, re-encoded to AVIF (2.8 MB → 169 KB) |
| `8a1enblo1b6h1.png` | hero logo |
| `f55hr5n4xdoh1.jpg` | reviewed and deliberately not used — the portrait lenticular wallpaper fought the logo for attention on phones; the landscape key art crop reads better and keeps one art direction across breakpoints |

---

## 4. Design system

Tokens live in `src/styles/global.css`: ink `#08070f`, gold ramp `#f8e7b4 → #a97c2f`,
cream `#f6efe1`, ember and Navi accents. Cinzel carries the display voice (logo, digits,
titles); Inter carries labels and body. The metallic digits are a vertical gold gradient
clipped to each glyph face — deliberately applied per digit, not to the parent, because a
`background-clip: text` window containing an animated descendant does not paint reliably in
Chromium.

Type and spacing scale with **both** viewport axes where the composition needs it
(`clamp(240px, min(38vw, 46vh), 440px)` for the logo, `min(6.2vw, 8.6vh)` for the digits), so
short laptops (1280×720), portrait tablets (768×1024) and phones (390×844) all fit the hero in
one screen without clipping.

---

## 5. Performance, offline, accessibility

- **Offline by construction.** Fonts are woff2 files in the bundle, art is AVIF/PNG in the
  bundle, and every sound is synthesised. Verified with a request log: the production build
  makes 9 requests, all same-origin, zero failures. No `<link>` to any CDN, no analytics.
- **Particles** are pre-rendered sprites on a DPR-capped canvas, paused when the tab is hidden.
- **Motion** respects `prefers-reduced-motion`: Ken Burns, embers, Navi's wandering, digit
  stamps and parallax all stand down; the countdown keeps ticking.
- **Accessibility.** The visible countdown *is* the `<time>` element; its `aria-label` reads
  the remaining time ("36 days, 2 hours…") while the digits are `aria-hidden`. The kicker is a
  polite live region, so the release announces itself exactly once. All controls are real
  buttons with visible focus rings; the ocarina has an `aria-label` per note with its pitch.
- **No layout shift on feedback:** the hero's action feedback line is absolutely positioned.

---

## 6. How this was verified

- `npm run lint` and `npm run build` both pass clean (oxlint reports zero warnings; `tsc -b`
  is part of the build).
- A scripted Chromium pass (Playwright, same engine as `./shot`) asserted:
  - exactly one `<time>` element at every `?now` value tested (36 days out, 10 s left, 1 s
    left, exactly zero, 10 s past, 2027, 2030) and a well-formed ISO duration in `datetime`;
  - the value ticks down between two samples 2.2 s apart;
  - loading 3 s before zero produces `PT0S`, the "AVAILABLE NOW" kicker, the celebration
    overlay and the released tab title **live**, without a reload;
  - Navi's click produces a whisper; the Song of Time unlocks the easter egg;
  - "Add to calendar" downloads `ocarina-of-time-remake.ics` containing
    `DTSTART:20261105T050000Z`.
- Production build served via `vite preview`: same-origin requests only, no console errors, all
  images decode, only the two Latin font subsets load.
- Screenshots at 1440×900, 1440×760, 1280×720, 768×1024, 390×844, 360×640 and 1440×600, in
  normal, released, reduced-motion and full-page modes. `.bench/shots/` holds the whole
  iteration history; the final frames are the last few numbered shots.

---

## 7. Known gaps and judgement calls

- **Sound needs a gesture.** Browsers won't let a page create an `AudioContext` before the
  visitor interacts. If someone loads the page and never touches it, the zero-moment chime is
  silent (the visuals still fire). This is deliberate: no autoplay, no nagging.
- **`?now` is read once, at mount.** Changing the query string without a reload won't re-time
  the clock; the page is a static SPA with no router.
- **The ocarina is an approximation.** The five buttons map to a pentatonic set (D4 F4 A4 B4
  D5) and the Song of Time is ▶ A ▼ twice; it is not a sample-accurate recreation of the N64
  instrument.
- **Navi follows a mouse, not a finger.** On touch devices there is no `pointermove`, so she
  wanders on her own — tap her for a whisper.
- **Only AVIF for the artwork.** Every browser that can run this build supports it, but there
  is no JPEG/WebP fallback if that ever stops being true.
- **Chromium was the only engine exercised** (it's what `./shot` drives). The CSS sticks to
  widely supported features (`backdrop-filter`, `clamp()`, `min()` in `clamp`, `:has` is not
  used); Safari and Firefox should be fine but have not been run.
- **The `.ics` uses a fixed UID and a placeholder `DTSTAMP`.** Fine for a one-off save-the-date,
  not for a calendar feed.
- **The tab title changes every second** by design (it's part of the clock); if that is
  considered noise, the effect in `App.tsx` is one line to change.
- **Nothing is committed.** The working tree is the deliverable; `git status` in `app/` shows
  the scaffold deletions/additions, and the root run directory holds this file.
