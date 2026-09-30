# Hyrule Time — handover

## What shipped

A cinematic, full-screen countdown to the Ocarina of Time remake release at `2026-11-05T00:00:00-05:00`. The page uses the supplied Hyrule artwork and game logo, a gold-accented four-unit clock, a share-link button, and an arrival message once the countdown reaches zero. It adapts to narrow phone and desktop viewports and respects reduced-motion preferences.

The app accepts `?now=<ISO 8601 timestamp>` to set its clock origin. Countdown values never go below zero. Exactly one visually hidden `<time>` exposes the remaining duration in ISO 8601 form and becomes `PT0S` at release. Artwork and font files are local; the page makes no runtime requests to other origins.

## Code map

- `app/src/App.tsx`: target time, override clock, duration calculation, countdown display, and share interaction.
- `app/src/App.css` and `app/src/index.css`: responsive layout, visual styling, local font declarations, and motion preferences.
- `app/public/art/`: selected supplied images.
- `app/public/fonts/`: locally served Cinzel and DM Mono font files.

## Verification

- `cd app && npm run build` — passed.
- `cd app && npm run lint` — passed.
- `./shot --width 1440 --height 900` and `./shot --width 390 --height 844` — reviewed desktop and phone screenshots; no console errors were reported.
- `./shot --width 390 --height 844 --now '2026-11-04T23:59:50-05:00'` — showed `00:00:09` at capture, confirming the override advances.
- `./shot --width 390 --height 844 --now '2026-11-05T00:00:00-05:00'` — reviewed the completed state; layout remains intact and the timer is replaced by the arrival message.

## Known limitations

The share action copies the current URL, so sharing a `?now=` preview also shares that preview timestamp. Clipboard access depends on browser support and a secure context; if it is unavailable, the page remains usable but does not show a copy confirmation. The release time and game details follow the supplied brief.
