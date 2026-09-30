# Handover — Ocarina of Time countdown

## Built

A cinematic, responsive countdown for the supplied November 5, 2026, 12:00 AM Eastern Time moment. The page pairs the supplied Zelda logo with the Hyrule Field and Great Deku Tree art. Visitors can switch scenes; the background crossfades while the countdown continues. At zero, the numbers stay at zero and the page changes its message to welcome the start of the adventure.

The app runs entirely in the browser. Images are served from `app/public/images`; typography uses system fonts. It makes no requests to external origins.

## Code

- `app/src/App.tsx`: release instant, repeatable `?now=` clock, duration formatting, one semantic `<time>` element, scene control, and launch state.
- `app/src/App.css`: visual design, responsive layout, scene transition, and reduced-motion handling.
- `app/src/index.css`: base styles.
- `app/public/images`: the three supplied assets used by the page.
- `app/README.md`: run and preview instructions.

The query override accepts an ISO 8601 timestamp with an explicit `Z` or numeric offset. It anchors to a monotonic clock when the page loads, so a ten-second preview continues ticking from that point. The release instant is encoded with the supplied `-05:00` offset.

## Verified

- `npm run build --prefix app` and `npm run lint --prefix app` pass.
- Reviewed screenshots at 1440×900, 768×1024, and 390×844, plus the 390px state after the countdown reached zero.
- Browser check: `?now=2026-11-04T23:59:50-05:00` initially produced `P0DT0H0M10S`, advanced to `P0DT0H0M8S`, and reached `PT0S` with no negative display. Scene switching changed the active scene to Kokiri Forest.
- At 390px, 768px, and 1440px, the document had exactly one `<time>` element and no horizontal overflow. Captured requests used only the app origin.

## Known limits

The page uses the release date and event premise supplied in the brief; it does not verify or fetch release information. There is no audio or livestream feed.
