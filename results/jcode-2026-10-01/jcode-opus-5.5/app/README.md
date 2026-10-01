# Ocarina of Time · Countdown

A launch countdown for *The Legend of Zelda: Ocarina of Time* on Nintendo
Switch 2, reaching zero at **2026-11-05T00:00:00-05:00**. React + Vite +
TypeScript, no backend, fully offline (fonts and art are bundled).

```sh
npm install
npm run dev      # local server
npm run build    # type-check + production build into dist/
npm run lint     # oxlint
npm test         # vitest: time math, song matching, world rules, DOM contract
npm run art      # regenerate src/art/*.webp from art-src/ (needs sharp)
```

## URL parameters

| Param | Where | Effect |
| --- | --- | --- |
| `?now=<ISO 8601>` | always | Behave as if the page loaded at that instant, then keep ticking. |
| `?world=field,night,rain` | dev only | Start in a given scene / weather (for screenshots). |
| `?play=<song id>` | dev only | Perform a song shortly after load (`time`, `saria`, `epona`, `zelda`, `sun`, `storms`). |
| `?songbook` | dev only | Open the song list on load. |

## Layout

```
src/
  App.tsx              page composition and world state
  art.ts               scene image manifest (srcsets, focus points, tints)
  index.css            all styles, design tokens at the top
  components/          Backdrop, Atmosphere (canvas), Countdown, OcarinaPanel, Songbook
  hooks/               useClock (?now + boundary-aligned ticks), useOcarina, useReducedMotion
  lib/                 pure logic: countdown, songs, world reducer, audio synth, calendar (.ics)
art-src/               original source art, as supplied
scripts/build-art.mjs  sharp pipeline: art-src → src/art
```
