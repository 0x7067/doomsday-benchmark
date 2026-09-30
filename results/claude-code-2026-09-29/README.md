# Claude Code: Claude Opus 5.5 result — September 29, 2026

One unattended run of Claude Opus 5.5 on `ocarina-remake`, using Claude Code 2.1.285 with `--model opus` (resolved to `claude-opus-5-5`). The agent exited successfully. Three independent `opus` judges graded it on September 29; on September 30 the report was regenerated with `--reuse-judges` to pick up later grader fixes, keeping those verdicts. It is a [V1](../../README.md#versions) run.

| Model | Total / 100 | Countdown / 10 | Hygiene / 15 | Experience / 35 | Codebase / 15 | Process / 25 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [Claude Opus 5.5](claude-opus-5-5/report/REPORT.md) | 79.4 | 10 | 14 | 26.8 | 10.8 | 17.8 |

| Model | Run time | Uncached input | Cache reads | Cache writes | Output, including reasoning | Reasoning | Total tokens | API-equivalent estimate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Claude Opus 5.5 | 1 h 11 min 18 s | 304 | 48,536,489 | 504,012 | 324,593 | 168,602 | 49,365,398 | $20.23 |

The cost is Claude Code's own estimate at API list prices. The run used a Claude subscription, which isn't billed per run. Claude Code counted 251 turns. Run time measures agent launch to exit and excludes setup and grading. Judge usage is excluded.

## What the judges found

A strongly on-theme page: gold Cinzel numerals over the Kokiri Forest art, Ocarina of Time-style area title cards, a playable ocarina whose songs change the scene, and a designed Song of Time finale that arrives at the Great Deku Tree. The codebase has a pure, injectable clock, feature folders, unit and end-to-end tests, and a README that maps every file. The process was verification-heavy: 32 screenshots through `./shot`, about 30 more through its own Playwright scripts, 37 unit and 45 end-to-end tests, and fixes for the visible problems it found. Hygiene lost one point for two unused exports found by knip. See the report for the criterion-level evidence.

## Conditions and limits

- Benchmark `v1`. The run predates two harness changes: it was launched without `--thinking-display summarized`, so the transcript has no reasoning and the process judge saw only the agent's messages and tool calls; and `.bench/run.json` doesn't record the harness, so the report infers it from the command.
- Claude Code loaded the normal user configuration: the user-level `CLAUDE.md`, 9 plugins and 9 MCP servers. This was not an isolated clean-configuration comparison.
- Claude Code kept every image in context; the OpenCode image window doesn't apply to it.
- This is a single run with noisy LLM grading.

## Artifacts

The model folder contains the unchanged app source and lockfile, the brief and handover, `.bench/run.json`, the full report and score JSON, grader screenshots as WebP (quality 80, as on the results site), and `provenance.json` with the original run folder name, the transcript's SHA-256 and hashes of every app file and original PNG. Local machine paths are normalized. The raw transcript, the cleaned transcript the judges read, the judges' PNG previews of the assets, and the app's git history stay in the original run folder, which is needed for regrading.

To run the archived app, install its dependencies in `claude-opus-5-5/app/`, then run its `dev`, `build`, `lint` or `test` script.

## Repeat the benchmark

```sh
npm run bench -- run --scenario ocarina-remake --agent claude-code --model opus --label opus
npm run bench -- grade runs/<run-folder>
```

The `claude-code` preset now adds `--thinking-display summarized`, so a repeat gives the process judge the agent's reasoning, which this run didn't have.
