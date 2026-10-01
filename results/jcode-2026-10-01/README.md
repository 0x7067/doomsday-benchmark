# Jcode: Claude Opus 5.5 and Sonnet 5.5 results — October 1, 2026

One unattended run each of Claude Opus 5.5 and Claude Sonnet 5.5 on `ocarina-remake`, driven by [Jcode](https://github.com/1jehuang/jcode) v0.89.3 as the harness (`jcode -p claude -m <model> run --ndjson "$(cat BRIEF.md)"`). Both agents exited successfully. Each run was graded with independent `claude-opus-5-5` judges.

| Model | Total / 100 | Countdown / 5 | Hygiene / 10 | Experience / 45 | Codebase / 15 | Process / 25 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [Claude Sonnet 5.5](jcode-sonnet-5.5/report/REPORT.md) | 84.2 | 5 | 10 | 37.1 | 12.7 | 19.4 |
| [Claude Opus 5.5](jcode-opus-5.5/report/REPORT.md) | 77.6 | 5 | 8.3 | 33.7 | 12.7 | 17.9 |

| Model | Run time | Tokens | API-equivalent estimate |
| --- | ---: | ---: | ---: |
| Claude Opus 5.5 | 53 min 33 s | not reported | not reported |
| Claude Sonnet 5.5 | 39 min 39 s | not reported | not reported |

Jcode streams its own NDJSON event format, which the benchmark's usage readers (Claude Code, OpenCode, Codex) don't parse yet, so tokens and cost are "not reported" rather than missing data. Run time measures agent launch to exit and excludes setup and grading. Judge usage is excluded.

## What the judges found

Both pages are strongly on-theme: the official logo and the Kokiri key art carry the design, and each includes a playable ocarina whose notes and songs match canon. Sonnet 5.5 ran about 11 short look-fix-look rounds across 46 screenshots in 7 viewports, kept a perfectly clean hygiene score, and its handover candidly disclosed a write to a scratch directory outside the project that the automated boundary check had missed. Opus 5.5 took 25 screenshots over 7 commits, added a real Web Audio test engine and 44 tests, but lost hygiene points to knip dead code and unreferenced files. Both left craft issues unraised: Sonnet never questioned its overdarkened Deku Tree scene or a leftover 00:00:00:00 row on arrival; Opus's deductions are itemized in its report. See each report for the criterion-level evidence.

## Conditions and limits

- Benchmark `v1.1`. Launched with `npm run bench -- run --cmd`, so the harness was recorded as unknown in `.bench/run.json`; the command above shows it was Jcode.
- Jcode loaded the normal user configuration (the user's `~/.jcode` config, MCP servers and tools). This was not an isolated clean-configuration comparison.
- Jcode kept every image in context; the OpenCode image window doesn't apply to it.
- These are single runs with noisy LLM grading.

## Artifacts

Each model folder contains the app source without `node_modules` or VCS metadata, the brief and handover, `.bench/run.json`, the full report and score JSON, grader captures as WebP (quality 80, as on the results site), and `provenance.json` with the original run folder name, the transcript's SHA-256 and hashes of every app file. The raw transcripts and the app git history stay in the original run folders, which are needed for regrading.

## Repeat the benchmark

```sh
npm run bench -- run --scenario ocarina-remake --label jcode-opus-5.5 --model claude-opus-5-5 \
  --cmd 'jcode -p claude -m claude-opus-5-5 run --ndjson "$(cat BRIEF.md)"'
npm run bench -- grade runs/<run-folder>
```
