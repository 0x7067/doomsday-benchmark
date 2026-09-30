# Codex Astra, Sol and Luna results — September 30, 2026

One unattended run each of GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna on `ocarina-remake`, using Codex CLI 0.159.2 with medium reasoning effort. All four agents exited successfully. Each run was graded once with three independent `claude-opus-5-5` judges; all twelve judges returned valid verdicts.

| Model | Total / 100 | Countdown / 10 | Hygiene / 15 | Experience / 35 | Codebase / 15 | Process / 25 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [GPT-6 Astra](gpt-6-astra/report/REPORT.md) | 62.6 | 10 | 15 | 19.6 | 8.3 | 9.7 |
| [GPT-6.1 Sol](gpt-6.1-sol/report/REPORT.md) | 59.3 | 10 | 14 | 19 | 8.3 | 8 |
| [GPT-6 Sol](gpt-6-sol/report/REPORT.md) | 56.8 | 10 | 15 | 15.4 | 7.6 | 8.8 |
| [GPT-6 Luna](gpt-6-luna/report/REPORT.md) | 46.4 | 10 | 11.5 | 12.1 | 5.6 | 7.2 |

| Model | Run time | Uncached input | Cache reads | Output, including reasoning | Reasoning | Total tokens | API-equivalent estimate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GPT-6 Astra | 5 min 52 s | 50,048 | 492,032 | 11,012 | 662 | 553,092 | $1.5431 |
| GPT-6.1 Sol | 15 min 3 s | 116,434 | 786,176 | 14,860 | 1,204 | 917,470 | $0.4601 |
| GPT-6 Sol | 17 min 13 s | 59,049 | 1,362,688 | 17,081 | 2,322 | 1,438,818 | $0.5614 |
| GPT-6 Luna | 6 min 32 s | 62,136 | 1,170,560 | 11,516 | 1,991 | 1,244,212 | $0.0237 |

Cache writes were zero in all four transcripts. Codex reports one completed user turn per run; this is not the number of model requests. Token totals include cache reads and include reasoning once within output. Run time measures agent launch to exit and excludes setup and grading.

Costs use Standard short-context API list prices checked September 30, 2026: [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [GPT-6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol), and [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna). These are API-equivalent estimates, not subscription charges. Completed-turn totals do not expose per-request context size, service tier or regional premiums, so those adjustments are excluded. Judge usage is excluded.

## What the judges found

All four apps built, passed lint and met the countdown contract, including ticking through zero, phone overflow and external-origin checks. Their visual processes were weaker: few screenshots, little written critique, and limited iteration after the first design. Astra added behavioral tests and revised mobile shading, but left the title over the artwork and a large hero PNG. Sol 6.1 added more interaction and behavioral tests; Sol 6 left a tidy codebase; Luna retained scaffold files and an unused image. See each report for the criterion-level evidence.

The automated hygiene check deducted one point from Sol 6.1 for two fontsource dependencies. Its code judge found those dependencies used by CSS imports. The published score retains the automated deduction.

## Conditions and limits

- Benchmark baseline: `6cee00ffa852d57d09b660b273e970dee4f5eeba`, with the Codex accounting change in `0b440de` for the first three runs and the Astra price addition in `5c29455`. The scenario, brief and scoring rules were unchanged.
- Node 24.21.0, Playwright 1.63.0, headless Chromium, macOS arm64. The same scenario, brief and five asset hashes were used for all models.
- The repository's stock `codex` preset was used, including its permission-bypass flags and JSONL transcript capture. Codex inherited the normal user configuration, hooks and plugins; `model_reasoning_effort` was `medium`. This was not an isolated clean-configuration comparison.
- The Sol and Luna agents ran concurrently in separate run folders; Astra ran separately afterward. All used the default 240-minute timeout. Resource contention differed, so their generation times are not directly comparable. No extra prompts, retries, selection of the best attempt or post-run app fixes were applied.
- Startup logs included WebSocket upgrade errors before the agents continued over fallback transport. Those delays remain in the measured run times.
- These are single runs with noisy LLM grading. The 3.3-point gap between Astra and Sol 6.1, and the 2.5-point gap between the Sol runs, are not evidence of a reliable model ranking.

## Artifacts

Each model folder contains the unchanged app source and lockfile, original brief and handover, `.bench/run.json`, full report and score JSON, screenshot previews, and `provenance.json`. Local machine paths in reports are normalized. Screenshot previews use WebP quality 80, matching the results site's compression setting; provenance records the original PNG and preview hashes. The original PNGs and raw transcripts remain local. The final raw Codex usage event and transcript SHA-256 are included in provenance.

| Model | Desktop | Phone | App source |
| --- | --- | --- | --- |
| GPT-6 Astra | [Preview](gpt-6-astra/report/captures/01-weeks-out-desktop.webp) | [Preview](gpt-6-astra/report/captures/09-weeks-out-mobile.webp) | [Source](gpt-6-astra/app) |
| GPT-6.1 Sol | [Preview](gpt-6.1-sol/report/captures/01-weeks-out-desktop.webp) | [Preview](gpt-6.1-sol/report/captures/09-weeks-out-mobile.webp) | [Source](gpt-6.1-sol/app) |
| GPT-6 Sol | [Preview](gpt-6-sol/report/captures/01-weeks-out-desktop.webp) | [Preview](gpt-6-sol/report/captures/09-weeks-out-mobile.webp) | [Source](gpt-6-sol/app) |
| GPT-6 Luna | [Preview](gpt-6-luna/report/captures/01-weeks-out-desktop.webp) | [Preview](gpt-6-luna/report/captures/09-weeks-out-mobile.webp) | [Source](gpt-6-luna/app) |

To run an archived app, install its dependencies in the model's `app/` directory, then run its `dev`, `build` or `lint` script. These folders are review snapshots; the original run folders retain the transcripts and git history needed for process regrading.

## Repeat the benchmark

From the benchmark root, after installing its dependencies and Chromium:

```sh
node src/cli.ts run --scenario ocarina-remake --agent codex --model gpt-6-astra --label codex-astra-6-medium
node src/cli.ts run --scenario ocarina-remake --agent codex --model gpt-6.1-sol --label codex-sol-6.1-medium
node src/cli.ts run --scenario ocarina-remake --agent codex --model gpt-6-sol --label codex-sol-6-medium
node src/cli.ts run --scenario ocarina-remake --agent codex --model gpt-6-luna --label codex-luna-6-medium
node src/cli.ts grade runs/<run-folder> --judge-model claude-opus-5-5
```

Set `model_reasoning_effort = "medium"` in the Codex user configuration to match these runs. The stock preset inherits other user settings, so record them when comparing a repeat.
