# Ocarina of Time countdown

A responsive, offline-ready countdown to November 5, 2026 at midnight Eastern Time.

```sh
npm install
npm run dev
npm run build
npm run lint
```

For a repeatable preview, pass an ISO 8601 instant with an explicit offset:

```text
?now=2026-11-04T23:59:50-05:00
```

The preview starts at that instant and continues at normal speed. The single `<time>` element carries the remaining ISO 8601 duration in its `datetime` attribute and becomes `PT0S` at launch.
