# Return to Hyrule

A self-contained Ocarina of Time release countdown, built with React, TypeScript, and Vite.

```sh
npm install
npm run dev
npm run test
npm run lint
npm run build
npm run preview
```

Use Node 22.18+ for the TypeScript test runner. The production output is `dist/` and can be served by any static HTTP server. No backend, CDN, remote fonts, or external APIs are required.

To preview the last ten seconds, open `/?now=2026-11-04T23:59:50-05:00`. The simulated clock continues ticking after load. Invalid timestamps fall back to the current time.

The release instant is `2026-11-05T05:00:00Z`. `src/countdown.ts` owns the arithmetic; `src/App.tsx` owns the presentation and browser interactions. Styles are in `src/App.css` and `src/index.css`. Artwork is in `public/images/`; fonts are bundled from Fontsource.

This is an unofficial fan concept using the supplied event date and artwork.
