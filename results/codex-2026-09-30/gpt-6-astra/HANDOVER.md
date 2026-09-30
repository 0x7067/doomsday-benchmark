# Return to Hyrule — handover

Built a cinematic, responsive countdown for November 5, 2026, midnight Eastern Time (`2026-11-05T05:00:00Z`). The design uses the supplied Kokiri Forest artwork, warm gold Cinzel typography, atmospheric shading, drifting fireflies, and a large four-part countdown. Mobile uses a taller, scrollable composition so the artwork and clock both have room.

Three scene selectors crossfade between Kokiri Forest, Hyrule Field, and the Great Deku Tree. Optional ambience is a quiet, locally synthesized chord, initially off. Save the date downloads an ICS calendar event; Share the moment copies the URL without its simulated-time query. Motion respects reduced-motion preferences. Controls are keyboard accessible and expose selection states.

## Code

- `app/src/countdown.ts`: release constant, query parsing, and pure remaining-time calculation.
- `app/src/App.tsx`: elapsed-time clock, one semantic `<time>`, release state, scenes, audio, calendar, and clipboard interactions.
- `app/src/App.css`: responsive layout, art direction, transitions, and motion preferences.
- `app/src/index.css`: global styles and focus treatment.
- `app/public/images/`: three supplied images copied into the delivered app.
- `app/tests/countdown.test.ts`: boundary and duration tests.

Fonts come from installed Fontsource packages and are emitted into the production bundle. Images, fonts, and audio require no external network access. Serve `app/dist/` locally or from a static host; the page does not install a service worker for cached reloads when its hosting server is unreachable.

`?now=<ISO timestamp>` establishes a simulated starting instant. A monotonic elapsed timer keeps that simulated time moving. Remaining seconds round up until the release instant, then clamp permanently to zero (`PT0S`). The visible numbers and the single `<time datetime>` update together. Invalid query values use the current time. The release announcement is exposed to assistive technology without announcing every tick.

## Verification

- `npm run build` and `npm run lint` passed.
- `npm run test` passed all four tests (Node 22.18+).
- Automated Chromium checks against the production build passed: exactly one time element, ten-second countdown, zero crossing, stable post-release state, timezone conversion, invalid query fallback, all scene controls, sound on/off, calendar file contents, and clipboard URL.
- No horizontal overflow at 390, 700, 768, 1024, and 1440 pixels.
- Blocked all nonlocal requests during testing: none were attempted. Disabled browser networking after load and verified the timer and scene selection continued to work.
- No browser exceptions were observed.
- Used the supplied `./shot` tool and opened desktop and full-page mobile PNGs. Also captured the release state after letting the last ten seconds elapse in real time. Screenshots are in `.bench/shots/`.
- The additional integration verification script is `.bench/verify.mjs`; it uses the benchmark's existing Playwright installation and is not an app dependency.

## Limits

This is a fan concept based on the supplied brief, not a claim of an independently verified Nintendo announcement. Audio is synthesized ambience, not a licensed game soundtrack. Clipboard access depends on browser permission and a secure context; failure is announced accessibly. Browser verification used Chromium, not physical devices or Safari. There is no backend or subscription system. No known unfinished requirements.
