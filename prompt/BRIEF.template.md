# Doomsday Clock: {{title}}

In January 2026, Marvel Studios started a YouTube livestream called **DOOMSDAY CLOCK**: one ominous countdown, ticking every second until *Avengers: Doomsday* reaches theaters. The countdown turned into an event of its own.

Build that kind of countdown for **{{event}}**.

## The moment

The clock hits zero at **{{targetLabel}}** (`{{target}}`).

{{context}}

## What you have

Everything is in your current directory:

- `app/`: a fresh Vite + React + TypeScript project (`create-vite`, `react-ts` template) with dependencies installed. It is a git repository. This is the codebase you'll hand over.
- `assets/`: the assets for this event. You don't have to use all of them. Choose well, make the most of them, and copy what you use into `app/`.
{{assetList}}
- `./shot`: a screenshot tool. It serves `app/` with Vite, opens the page in headless Chromium, saves a PNG and prints its path, along with any console errors. Open the PNG to look at it.

  ```
  ./shot [--width 1440] [--height 900] [--now <ISO timestamp>] [--wait <ms>] [--full-page] [--path /route]
  ```

## Requirements

1. Frontend only: React, Vite and TypeScript. No backend. You may add npm dependencies.
2. It must work offline. Bundle or self-host everything, fonts included; no runtime requests to other origins.
3. A live countdown to the moment, updating every second, showing at least days, hours, minutes and seconds.
4. `?now=<ISO 8601 timestamp>` makes the page behave as if it loaded at that instant, then keep ticking from there. For example, `?now={{nowExample}}` shows 10 seconds left and reaches zero 10 seconds later.
5. Expose the remaining time as exactly one `<time>` element whose `datetime` attribute is the remaining ISO 8601 duration in days, hours, minutes and seconds (for example `P37DT11H10M5S`), updated every tick. It may be visually hidden if your design calls for it.
6. When the moment arrives, handle it gracefully: no negative numbers, no broken layout. What happens then is up to you. From then on, `datetime` reads `PT0S`.
7. It must look right on everything from a 390px-wide phone to a 1440px desktop.
8. `npm run build` and `npm run lint` pass in `app/`.

## The bar

This will be reviewed like a real launch. People will judge the experience itself: design, motion, interactivity and how it uses the assets. Engineers will read the codebase you hand over. Work the way a staff engineer paired with a great designer would.

You're on your own. Nobody will answer questions or look at anything until you say you're done. There is no time limit: stop when you'd be proud to ship it, and not before.

When you're done, write `HANDOVER.md` in this directory (next to this brief, not inside `app/`), with these sections:

1. **What I built and why.** What a visitor sees and can do, feature by feature, including how to trigger each interaction (which control, key or moment), and the reasoning behind your main decisions: which assets you used and where, the layout, anything you added beyond the brief.
2. **How I worked.** Your iterations, round by round: what you looked at (cite your screenshots by the number in the file name `./shot` prints, or by file for any others you took), what you found wrong, what you changed, and whether your next look confirmed the fix.
3. **What I looked for.** The questions you asked of your own work when you critiqued it.
4. **How I decided it was done.** Why you stopped when you did.
5. **How the code is organized.**
6. **How I verified it.**
7. **What's still wrong or unfinished.**

Be specific and accurate. Reviewers will compare every section with your screenshots, the code and the page.
