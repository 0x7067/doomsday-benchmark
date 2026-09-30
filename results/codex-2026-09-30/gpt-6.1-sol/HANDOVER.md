# Handover — The Return to Hyrule

## Built

A cinematic, responsive Ocarina of Time countdown with a forest-green and antique-gold palette, locally bundled Cinzel and Manrope fonts, supplied Hyrule artwork, drifting fireflies, and three crossfading landscapes. An accompanying gallery lets visitors return to their chosen scene.

The countdown targets **November 5, 2026, midnight Eastern** (`2026-11-05T05:00:00Z`). It displays days, hours, minutes, and seconds. Exactly one visually hidden `<time>` contains the matching ISO duration. Values clamp at zero, `datetime` becomes `PT0S`, and the page changes to “The time has come.”

`?now=<ISO timestamp>` starts a simulated clock that continues with elapsed time. Invalid values fall back to the real clock. The normal clock resynchronizes after returning to the tab. Partial seconds round upward so the release state never appears early.

Additional controls: opt-in Web Audio ambience, focus mode with an Escape shortcut, and a downloadable calendar event. Buttons have keyboard focus treatments, scene controls expose their selection, and reduced-motion preferences disable animation and CSS smooth scrolling. The artwork is decorative in the hero and described in the gallery.

## Code and running

All application code is in `app/`.

- `src/countdown.ts`: release timestamp, duration arithmetic, simulated/real time source.
- `src/App.tsx`: countdown lifecycle, scenes, audio, focus mode, calendar download, gallery.
- `src/App.css`: responsive layout, transitions, release and focus states.
- `src/index.css`: bundled font imports and global defaults.
- `public/images/`: three selected supplied assets. The main PNG was converted to a 307 KB WebP, down from 2.8 MB.
- `tests/countdown.test.ts`: five behavioral tests covering the target timezone, duration formatting, final seconds, rounding, and day rollover.

From `app/`: `npm install`, then `npm run dev`. Build with `npm run build`; preview with `npm run preview`. Tests use Node 22.18+ native TypeScript support. No backend, CDN, remote fonts, APIs, or other runtime external origins are required. The production `dist/` can be served locally without internet access.

## Verified

- `npm run build`, `npm run lint`, and `npm test`: passed.
- Used the provided `./shot` and inspected desktop (1440 × 900), mobile (390 × 844), and full-page release-state screenshots. No screenshot console errors were reported.
- Chromium browser checks: one `<time>`, actual ten-second ticking through zero, stable post-release duration, invalid query fallback, scene selection, focus/Escape, audio on/off, and calendar download.
- No horizontal overflow at widths 390, 600, 768, 1024, and 1440.
- Calendar download contains the correct UTC start (`20261105T050000Z`) and standard CRLF line endings.
- Production preview loaded every image and local fonts with requests to all other origins blocked. No failed requests or external requests occurred. Reduced-motion styling was also checked.

Screenshots and the ad hoc Chromium verification scripts are retained in `.bench/` next to this file. Those scripts use the benchmark workspace's existing Playwright installation; the permanent countdown tests are self-contained in `app/`.

## Limits

No known unfinished requirements. Browser verification used headless Chromium; Safari and Firefox were not separately tested. The calendar button downloads an event for the visitor to import; it does not schedule notifications itself. Ambience is synthesized, not official game music. No service worker is included: offline use means serving the bundled build locally, rather than revisiting a previously cached hosted URL.

This is an unofficial fan concept. The release date is the target supplied in the brief, not an independently verified Nintendo announcement; the page states its unofficial status.
