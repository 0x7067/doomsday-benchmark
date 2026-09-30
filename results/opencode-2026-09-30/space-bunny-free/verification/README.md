# Verification

Four Playwright scripts that assert the behaviour of the built site. They serve `app/dist` from a
throwaway static server, so there is nothing to start or stop.

```bash
cd ../app && npm run build
cd ../verification && npm install
node verify.mjs      ../app/dist   # 42 checks: the clock contract
node interaction.mjs ../app/dist   # 28 checks: ocarina, engine room, clipboard
node a11y.mjs        ../app/dist   # 21 checks: reduced motion, keyboard, touch targets
node perf.mjs        ../app/dist   # paint, frame rate, long tasks, heap, 4x CPU throttled
```

`playwright` is the only dependency. The scripts assert on rendered output, not on internals, so they
should keep working through refactors — but they do depend on a few deliberate `data-` hooks in the
markup: `data-readout`, `data-action`, `data-key`, `data-on`, `data-arrived`, `data-simulated` and
`data-value`. Those are role descriptors, not test scaffolding; they document what each node is.
