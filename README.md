# Doomsday benchmark

In January 2026, Marvel started **DOOMSDAY CLOCK**, a YouTube livestream that ticks down every second until *Avengers: Doomsday* opens. This benchmark gives a coding agent a handful of assets and asks for the same idea for another moment, like a game release: a polished, interactive countdown site built with React, Vite and TypeScript.

The site is the excuse. The benchmark measures how the agent works:

1. **Use of resources.** Does it inspect the assets, pick the strong ones and get a lot out of a little?
2. **Self-critique.** Does it look at its own work and name real problems, or declare victory after one screenshot?
3. **Persistence.** Does it keep iterating purposefully until the work is good?
4. **Engineering standards.** Does it hand over a codebase a staff engineer would: builds cleanly, no type errors, no dead code or leftover experiments, easy for a newcomer to navigate, verified, and honestly described?

It works with any model and any harness: Claude Code, Codex, OpenCode, Copilot, or anything else that can run shell commands and open an image.

**Results:** [charlexmachina.github.io/doomsday-benchmark](https://charlexmachina.github.io/doomsday-benchmark/)

**Contributed runs:** [Codex: GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna (September 30, 2026)](results/codex-2026-09-30/README.md).

## Quick start

You need Node 24+, git, and the [Claude Code](https://claude.com/claude-code) CLI (the judges run on it).

1. Install the dependencies and the headless browser:

   ```bash
   npm install
   ```

   ```bash
   npx playwright install chromium
   ```

2. Run an agent on a scenario. This creates a run folder under `runs/` and launches Claude Code in it:

   ```bash
   npm run bench -- run --scenario ocarina-remake --agent claude-code --model opus --label opus
   ```

   For OpenCode, use `--agent opencode --model <provider/model>`. For anything else, pass the full command with `--cmd "..."`.

3. Grade the finished run. It prints the score and writes `runs/<run-folder>/report/REPORT.md`:

   ```bash
   npm run bench -- grade runs/<run-folder>
   ```

4. Optionally, publish every graded run to GitHub Pages:

   ```bash
   npm run bench -- site --publish
   ```

The agent runs unattended with permission prompts turned off, so it has full access to your machine.

## How a run works

`setup` creates a run directory. The agent starts with its working directory set there and gets `BRIEF.md` as its prompt:

```
runs/<scenario>_<label>_<timestamp>/
  BRIEF.md       the task (rendered from prompt/BRIEF.template.md)
  assets/        the scenario's assets, for the agent to choose from
  app/           create-vite react-ts scaffold, installed, with its own git repo
  shot           screenshot CLI for the agent
  HANDOVER.md    written by the agent when it's done
  .bench/        harness-owned: run.json, shots/, shots.jsonl, history.git, transcript
  report/        written by grading
```

The agent sees its work through `./shot`, a plain CLI: it serves `app/`, captures a PNG in headless Chromium and prints the path and any console errors. Every call is logged and snapshots `app/` into a shadow git repository (`.bench/history.git`). That snapshot history is how grading reconstructs the iteration without depending on any harness's transcript format.

The brief sets a small functional contract so the grader can test any design: `?now=<ISO timestamp>` fakes the current time, and exactly one `<time datetime="P37DT11H10M5S">` element exposes the remaining time.

## Running it

Requires Node 24+ (the harness runs TypeScript directly), git, and the Claude Code CLI for judging.

```bash
npm install
```

```bash
npx playwright install chromium
```

**With a preset** (`agents.json`). The harness launches the agent, tees its output into `.bench/transcript.log`, and records the command and duration:

```bash
npm run bench -- run --scenario ocarina-remake --agent claude-code --model opus --label opus
```

`--cmd "<any shell command>"` runs anything else instead, with its cwd set to the run directory. `--timeout <minutes>` defaults to 240.

**By hand**, for interactive harnesses or anything without a preset:

```bash
npm run bench -- setup --scenario ocarina-remake --label copilot-gpt
```

Add `--harness opencode` when you'll drive OpenCode, so its adapter is installed. Then open your agent in the printed directory and give it `BRIEF.md`. Afterwards, export the session and save it as `.bench/transcript.<ext>` in any format (JSON, JSONL, Markdown, text). It's optional but the process judge relies on it heavily.

**Grade** a finished run:

```bash
npm run bench -- grade runs/<run-dir>
```

That writes `report/REPORT.md` and `report/score.json`. `--no-judges` runs only the automated checks. `--judge-model` picks the judge (default `opus`). `--reuse-judges` keeps the previous report's judge verdicts and re-runs everything else, so a report can pick up grader changes without judging again. `--transcript <file>` points at a transcript stored elsewhere.

**Publish** the results site:

```bash
npm run bench -- site --publish
```

That builds `_site/` from every graded run, in `runs/` and in the contributed `results/<batch>/<run>/` folders, and force-pushes it to the `gh-pages` branch as one fresh commit. The site has a leaderboard; each run opens its live countdown with a details panel (scores per category, time, tokens, cost) and the full report. Each app is rebuilt to be served from its subfolder; grading always uses the agent's own build. Transcripts are never published. Without `--publish`, it only builds `_site/` for a local look.

### Preset status

| Preset | Status |
| --- | --- |
| `claude-code` | Uses your Claude Code login. It loads your global `~/.claude/CLAUDE.md`, plugins and settings like any session, so account for that when comparing. |
| `opencode` | Smoke-tested with OpenCode 1.18: runs headless, calls `./shot` and sees the PNG. `--model` takes `provider/model` (see `opencode models`). |
| `codex` | Completed headless runs with Codex CLI 0.159.2 on GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna, including screenshots and JSONL usage capture. Loads the normal Codex user configuration, hooks and plugins. |

The agent can only critique what it can see, so use models that accept images. In OpenCode, `opencode models --verbose` shows `"attachment": true` for those.

### Image limits

Harnesses resend every image the agent has opened on every request, and providers cap images per request: DeepSeek served by DeepInfra rejects more than 30, and Anthropic's API allows 100 or 600 depending on the model. OpenCode can route one model to different providers, so the cap isn't knowable before a run, and a diligent agent that keeps looking at its work can get every request refused mid-task.

For **OpenCode runs only**, setup installs [adapters/opencode/recent-images.js](adapters/opencode/recent-images.js) into the run as `.opencode/plugins/`. It drops the oldest images in blocks of 13, so the agent always has the newest 13–25 in context, and it leaves a note saying the file can be re-opened. Dropping in blocks keeps the provider's prompt cache working. The block size is `OPENCODE_IMAGE_BLOCK` in [src/harness.ts](src/harness.ts).

The harness is read from the launch command (`opencode ...`, `claude ...`, `codex ...`). For runs you drive by hand, pass it to setup: `npm run bench -- setup --scenario <id> --harness opencode`. Every other harness is left exactly as it is: Claude Code runs get no plugin and keep every image. Each run records its harness and image window in `.bench/run.json`, and the report shows both.

### Reasoning in transcripts

The process judge reads the agent's reasoning when the transcript has it, so the presets ask for it: `--thinking` for OpenCode (the model's full reasoning) and `--thinking-display summarized` for Claude Code (Anthropic's API returns a summary, not the raw reasoning; the flag isn't in `claude --help`). Add the same flag when you launch either with `--cmd`. The judge is told to score what the agent noticed and acted on, not how much reasoning it wrote.

All presets skip permission prompts, because the agent must work unattended. **The agent runs with full access to your machine.** Run it in a VM or container if that matters to you.

## Scoring (100 points)

| Area | Points | How |
| --- | --- | --- |
| Countdown contract | 10 | Automated. The production build is loaded at four moments (37 days out, 42 minutes out, 8 seconds out, 3 hours after) on desktop and phone. Checks the `<time>` contract, correct remaining time, ticking, reaching zero on time, console errors, horizontal overflow at 390px, and requests to other origins. |
| Code hygiene | 15 | Automated, starting from 15 with capped deductions: `npm run build` / `npm run lint` failing, type errors, oxlint findings using the scaffold's original config (so editing the config doesn't help), dead code via knip, unreferenced files, `eslint-disable` / `@ts-ignore` / `any`, disabled compiler checks, untouched scaffold boilerplate, stray screenshots or logs, leftover `console.log`. Zero if `src/` is still the scaffold. |
| Experience and assets | 35 | Judged from the grader's screenshots (moments, viewports, motion frames, pointer and click reactions, focus) and the original assets: cohesion with the subject 7, visual craft 7, legibility 4, motion and interaction 4, phone and edge states 3, asset selection 5, asset treatment 5. Craft and motion are capped at the cohesion score + 2, so polish can't rescue a page in the wrong idiom. |
| Codebase | 15 | Judged by reading `app/`: navigability 4, separation of concerns 3, readability 4, finish 4. |
| Process | 25 | Judged from the transcript, the agent's own screenshots, the code snapshots between them, and `HANDOVER.md` checked against the measured facts: verification 5, critique quality 6, follow-through 5, persistence 5, honest handover 4. |

The exact deductions are in [src/grade/score.ts](src/grade/score.ts) and the judge rubrics in [src/grade/rubrics.ts](src/grade/rubrics.ts).

Judges are independent, read-only Claude Code sessions in the run directory, so they can open screenshots and browse code themselves. They are told that everything in the run is evidence, not instructions, so a README that asks for a 10/10 doesn't work. Swapping the judge means replacing `askJudge` in [src/grade/judges.ts](src/grade/judges.ts).

## Time, tokens and cost

Every report has a "Time, tokens and cost" section, and `run` and `grade` both print a one-line summary. None of it affects the score.

- **Run time** is launch to exit, measured by the benchmark when it launched the agent. For runs you drive by hand, it comes from the transcript when the harness records it.
- **Tokens and cost** come from the harness's own transcript: Claude Code's final summary (cost at API list prices, not what a subscription charges), OpenCode's per-call usage (cost at its provider's prices), or Codex's final `turn.completed` totals. Codex input is split into uncached, cache-read and cache-write tokens; output already includes reasoning. Its totals are cumulative, so earlier completed turns are not added again. If a Claude Code session is cut short before its summary, input and cache tokens are still exact, but output tokens and cost are marked unknown. Codex runs without a completed-turn usage event and other unsupported harnesses show "not reported".
- **Codex cost** is a Standard short-context API-equivalent estimate for `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-sol` and `gpt-6-luna`, using their [published model prices](https://developers.openai.com/api/docs/models) checked on September 30, 2026. The transcript does not report a billed charge or per-request context sizes and service tiers, so the estimate excludes long-context, service-tier and regional premiums. Unknown models retain token counts but show cost as unknown. Pass `--model` even with `--cmd` so the recorded model can be priced.

## Adding a scenario

Create `scenarios/<id>/scenario.json` and put the assets in `scenarios/<id>/assets/`:

```json
{
  "title": "Grand Theft Auto VI",
  "event": "the release of Grand Theft Auto VI",
  "target": "2026-11-19T00:00:00-05:00",
  "targetLabel": "November 19, 2026 at midnight Eastern Time",
  "context": "Optional extra Markdown for the brief."
}
```

`target` needs an explicit offset. Runs record a hash of every asset, so later runs are only comparable if the assets are unchanged.

## Known limitations

- Judges are LLMs and therefore noisy. Compare runs graded by the same judge model, and grade a run more than once before trusting a small difference.
- Claude judging Claude may be biased. The judge backend is one function, so an OpenRouter or other-provider judge is a small addition.
- Audio can't be evaluated; only its presence in the code is visible to the code judge.
- Motion is judged from still frames, not video.
