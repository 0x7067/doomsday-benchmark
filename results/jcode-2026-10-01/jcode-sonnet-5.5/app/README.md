# Ocarina of Time: The Door of Time countdown

A launch-night countdown to the Ocarina of Time remake on Nintendo Switch 2.
The clock reaches zero at `2026-11-05T00:00:00-05:00`.

React 19, Vite and TypeScript. No backend, no runtime network requests: fonts are
bundled from `@fontsource`, images are optimised WebP in `src/assets`, and every sound
is synthesised with WebAudio.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Vite |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Oxlint |
| `npm test` | Vitest unit and integration tests |

## URL parameters

| Parameter | Effect |
| --- | --- |
| `?now=<ISO 8601>` | Act as if the page loaded at that instant, then keep ticking. `?now=2026-11-04T23:59:50-05:00` is ten seconds out. |
| `?scene=forest\|deku\|field` | Start in that scene. |
| `?songs=sun,storms` | Start as if those stateful songs had been played. |
| `?songbook` | Open the songbook on load. |

## Interactions

Arrow keys play the ocarina's C buttons and `A` plays A. Playing a six-note song changes
the page: see the in-app Songbook for the list.

## Layout

```
src/
  App.tsx              composition and the moment of arrival
  lib/                 pure logic: countdown maths, ISO durations, clock store
  state/               reducer for what songs do to the page, URL-derived start state
  data/                songs, scenes, omen copy
  hooks/               clock subscription, ocarina input, pointer parallax
  audio/               WebAudio ocarina and drum synth
  components/          one folder-level file (+ css) per UI piece
  styles/              tokens and base styles
```
