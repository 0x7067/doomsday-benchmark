# The Return to Hyrule

A frontend-only Ocarina of Time release countdown. React, TypeScript, Vite.

```sh
npm install
npm run dev
npm run build
npm run lint
npm test
```

Tests use Node 22.18+ native TypeScript support. Serve `dist/` to preview the production build. Images and fonts are local; the experience requires no third-party services or network connection beyond its local/static host.

The target is `2026-11-05T00:00:00-05:00` (05:00 UTC). Add `?now=2026-11-04T23:59:50-05:00` for a ten-second countdown that continues ticking. Invalid overrides fall back to the real clock. The target is a supplied concept date, not a verified release announcement.

`src/countdown.ts` contains duration arithmetic and the time source. `src/App.tsx` contains the experience and controls. `src/App.css` defines the responsive presentation and reduced-motion behavior. `src/index.css` loads bundled fonts and shared defaults. Assets are in `public/images/`.

Ambience is an opt-in synthesized soundscape, not game music. Focus mode can be exited with its button or Escape. Save the date downloads a standard calendar event; it does not create notifications or modify your calendar automatically.
