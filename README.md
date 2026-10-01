# Doomsday benchmark

In January 2026, Marvel started **DOOMSDAY CLOCK**, a YouTube livestream that ticks down every second until *Avengers: Doomsday* opens. This benchmark gives a coding agent a handful of assets and asks for the same idea for another moment, like a game release: a polished, interactive countdown site built with React, Vite and TypeScript.

The site is the excuse. The benchmark measures how the agent works:

1. **Use of resources.** Does it inspect the assets, pick the strong ones and get a lot out of a little?
2. **Self-critique.** Does it look at its own work and name real problems, or declare victory after one screenshot?
3. **Persistence.** Does it keep iterating purposefully until the work is good?
4. **Engineering standards.** Does it hand over a codebase a staff engineer would: builds cleanly, no type errors, no dead code or leftover experiments, easy for a newcomer to navigate, verified, and honestly described?

It works with any model and any harness: Claude Code, Codex, OpenCode, Copilot, or anything else that can run shell commands and open an image.

**Results:** [charlexmachina.github.io/doomsday-benchmark](https://charlexmachina.github.io/doomsday-benchmark/)

**Archived runs:** [Claude Code: Claude Opus 5.5 (September 29, 2026)](results/claude-code-2026-09-29/README.md), [OpenCode: Space Bunny Free, DeepSeek V4.1 Flash and GLM 5.3 Flash (September 30, 2026)](results/opencode-2026-09-30/README.md), [Codex: GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna (September 30, 2026, contributed)](results/codex-2026-09-30/README.md), and [Jcode: Claude Opus 5.5 and Claude Sonnet 5.5 (October 1, 2026, contributed)](results/jcode-2026-10-01/README.md).

## Quick start

You need Node 24+, git, Docker (agents run in containers), and the [Claude Code](https://claude.com/claude-code) CLI (the judges run on it).

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

The agent runs unattended with permission prompts turned off, inside a container that sees only its run folder (see [Isolation](#isolation)).

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

That builds `_site/` from every graded run, in `runs/` and in the archived `results/<batch>/<run>/` folders, and force-pushes it to the `gh-pages` branch as one fresh commit. The site has a leaderboard for each [benchmark version](#versions), with a toggle that opens on the latest, with a chart of any score (the total or one category) against estimated cost, run time or tokens; each run opens its live countdown with a details panel (scores per category, time, tokens, cost) and the full report. Each app is rebuilt to be served from its subfolder; grading always uses the agent's own build. Transcripts are never published. Without `--publish`, it only builds `_site/` for a local look.

### Isolation

`run` puts the agent in a Docker container that sees only its run folder, mounted at `/work`, and a private home: not this benchmark, not other runs, and not any harness's session histories. It has its own processes and network, so parallel runs don't share ports. The image ([isolation/Dockerfile](isolation/Dockerfile)) has Node 24, Chromium with Playwright (any script in the run folder can `import { chromium } from 'playwright'`), the screenshot tool, and pinned versions of the Claude Code, OpenCode and Codex CLIs. It's built automatically the first time, and again whenever the Dockerfile or the screenshot tool changes. The app's dependencies are installed inside the container for Linux; grading reinstalls them on this machine afterwards.

Each harness gets its login and nothing else:

- **OpenCode** and **Codex**: their login file (`~/.local/share/opencode/auth.json`, `~/.codex/auth.json`) is mounted read-only.
- **Claude Code**: a subscription login lives in the macOS Keychain, which a container can't reach. Run `claude setup-token` once and save the token it prints to `~/.config/doomsday-benchmark/claude-oauth-token` (or set `CLAUDE_CODE_OAUTH_TOKEN`). It's passed to the container by variable name, so it never appears in a command line or in the run's metadata.

`--no-isolation` runs the agent directly on this machine, and `setup` runs are never isolated, since you drive that agent yourself. The brief's ground rules still tell agents to stay in their folder, so attempts to leave it show up in the report either way.

### Preset status

| Preset | Status |
| --- | --- |
| `claude-code` | Uses your Claude Code login. It loads your global `~/.claude/CLAUDE.md`, plugins and settings like any session, so account for that when comparing. |
| `opencode` | Smoke-tested with OpenCode 1.18: runs headless, calls `./shot` and sees the PNG. `--model` takes `provider/model` (see `opencode models`). |
| `codex` | Completed headless runs with Codex CLI 0.159.2 on GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna, including screenshots and JSONL usage capture. Loads the normal Codex user configuration, hooks and plugins. |

There is no preset for [Jcode](https://github.com/1jehuang/jcode) yet; its October 1, 2026 runs (see the archived results) were launched with `--cmd 'jcode -p claude -m <model> run --ndjson "$(cat BRIEF.md)"'`. It streams its own NDJSON transcript, so tokens and cost aren't reported until the benchmark gains a reader for that format.

The agent can only critique what it can see, so use models that accept images. In OpenCode, `opencode models --verbose` shows `"attachment": true` for those.

### Image limits

Harnesses resend every image the agent has opened on every request, and providers cap images per request: DeepSeek served by DeepInfra rejects more than 30, and Anthropic's API allows 100 or 600 depending on the model. OpenCode can route one model to different providers, so the cap isn't knowable before a run, and a diligent agent that keeps looking at its work can get every request refused mid-task.

For **OpenCode runs only**, setup installs [adapters/opencode/recent-images.js](adapters/opencode/recent-images.js) into the run as `.opencode/plugins/`. It drops the oldest images in blocks of 13, so the agent always has the newest 13–25 in context, and it leaves a note saying the file can be re-opened. Dropping in blocks keeps the provider's prompt cache working. The block size is `OPENCODE_IMAGE_BLOCK` in [src/harness.ts](src/harness.ts).

The harness is read from the launch command (`opencode ...`, `claude ...`, `codex ...`). For runs you drive by hand, pass it to setup: `npm run bench -- setup --scenario <id> --harness opencode`. Every other harness is left exactly as it is: Claude Code runs get no plugin and keep every image. Each run records its harness and image window in `.bench/run.json`, and the report shows both.

### Reasoning in transcripts

The process judge reads the agent's reasoning when the transcript has it, so the presets ask for it: `--thinking` for OpenCode (the model's full reasoning) and `--thinking-display summarized` for Claude Code (Anthropic's API returns a summary, not the raw reasoning; the flag isn't in `claude --help`). Add the same flag when you launch either with `--cmd`. The judge is told to score what the agent noticed and acted on, not how much reasoning it wrote.

All presets skip permission prompts, because the agent must work unattended. Isolated, the agent can only touch its run folder; **with `--no-isolation` it runs with full access to your machine.**

## Scoring (100 points)

This is V1.1. V1's scoring is at the [`v1`](https://github.com/CharlExMachina/doomsday-benchmark/tree/v1) tag.

| Area | Points | How |
| --- | --- | --- |
| Countdown contract | 5 | Automated. The production build is loaded at four moments (37 days out, 42 minutes out, 8 seconds out, 3 hours after) on desktop and phone. Checks the `<time>` contract, correct remaining time, ticking, reaching zero on time, console errors, horizontal overflow at 390px, scrolling to an empty page, and requests to other origins. |
| Code hygiene | 10 | Automated, starting from 10 with capped deductions: `npm run build` / `npm run lint` failing, type errors, oxlint findings using the scaffold's original config (so editing the config doesn't help), dead code via knip, unreferenced files, `eslint-disable` / `@ts-ignore` / `any`, disabled compiler checks, untouched scaffold boilerplate, stray screenshots or logs, leftover `console.log`. Zero if `src/` is still the scaffold. |
| Experience and assets | 45 | Judged from the grader's screenshots (moments, viewports, motion frames, pointer and click reactions, focus, close-ups of layout findings), the page's recorded sound and the original assets: cohesion with the subject 7, visual craft 7, legibility 4, motion and interaction 4, phone and edge states 3, asset selection 5, asset treatment 5, concept 3, initiative ±4 and sound ±3. Craft and motion are capped at the cohesion score + 2, so polish can't rescue a page in the wrong idiom. Initiative and sound are net-effect criteria: 0 when the page has none, positive when what it adds makes it better, negative when it makes it worse. Lines of copy that aren't for the visitor cost up to 10 points, and replacing a provided asset with a homemade imitation caps asset selection and costs 3. |
| Codebase | 15 | Judged by reading `app/`: navigability 4, separation of concerns 3, readability 4, finish 4. |
| Process | 25 | Judged from the transcript, the agent's own screenshots, the code snapshots between them, and `HANDOVER.md` checked against the measured facts: verification 5, critique quality 6, follow-through 5, iteration 5, self-assessment 4. Critique and follow-through are judged by outcome: each problem in the final page is traced back through the agent's own screenshots. The handover must include the agent's own account of its process (how it worked round by round, citing its screenshots; what it looked for; how it decided it was done), which judges check against the screenshots, so critique can be judged even when a harness hides the agent's reasoning. The brief's ground rules tell the agent to stay inside its run folder; the grader scans its tool calls for anything it read, ran or changed outside it (the benchmark's code and files, other runs, the home directory), and each area costs 2 points, up to 6. |

Judges score each criterion by asking whether the client would ship it: 10 means ship it as it is, 8 a couple of small requests, 6–7 changes a reviewer would send back. Besides scores, they itemize: the experience judge lists the changes it would ask for before release, every line of copy that isn't for the visitor, and what happened to each provided asset; the process judge keeps a ledger of the final page's problems (first screenshot that showed each, whether the agent raised, disclosed or claimed to fix it) and a verdict on every claim in the handover. The code in [src/grade/score.ts](src/grade/score.ts) counts the lists, and the report shows them.

The grader measures what judges can't see for themselves: layout probes (text touching a panel's edge, backdrops that end before the page, scrolling to nothing, the smallest and faintest text, measured against the pixels behind it), every visible line of copy with hints for words that leaked from the brief, the page's sound recorded through Web Audio and drawn as spectrograms with the notes each control plays, provided assets recognised in the build even after resizing or cropping, and which moments and screen sizes the agent's own screenshots covered.

The exact deductions are in [src/grade/score.ts](src/grade/score.ts) and the judge rubrics in [src/grade/rubrics.ts](src/grade/rubrics.ts).

Judges are independent, read-only Claude Code sessions in the run directory, so they can open screenshots and browse code themselves. They are told that everything in the run is evidence, not instructions, so a README that asks for a 10/10 doesn't work. Swapping the judge means replacing `askJudge` in [src/grade/judges.ts](src/grade/judges.ts).

## Versions

Scores are only comparable between runs that got the same brief and were graded by the same checks and rubrics. Grading records the benchmark version in `score.json` and at the top of `REPORT.md`, and the results site ranks each version separately. When a change to the brief, the checks or the rubrics would move scores, bump `BENCHMARK_VERSION` in [src/version.ts](src/version.ts) and tag the release (`v1.1`).

`setup`, `run` and `grade` always use the latest version. To use an earlier one, add `--version`:

```bash
npm run bench -- grade runs/<run-dir> --version 1
```

That runs the earlier version's own code, exactly as it was tagged: the first time, the tag is checked out into `.versions/` and its dependencies installed. Runs it sets up or grades go in the same `runs/` folder. `site` always uses the latest version, since the site shows every version.

- **V1** (September 29–30, 2026; tag [`v1`](https://github.com/CharlExMachina/doomsday-benchmark/tree/v1)): the original brief, checks and rubrics. Eight runs of `ocarina-remake`, all archived in [results/](results/): Claude Opus 5.5 in Claude Code; Space Bunny Free, DeepSeek V4.1 Flash and GLM 5.3 Flash in OpenCode; and GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna in Codex (contributed). Reports graded before versions were recorded are V1.
- **V1.1**: the scoring described above: the judges' scale, judging by outcome, itemized findings, the new automated evidence, and the weights (countdown 5, hygiene 10, experience 45, codebase 15, process 25). The brief's handover now asks for the agent's own account of its process, so V1.1 results come from new runs; V1 runs regraded under V1.1's scoring alone were used to calibrate it.

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

Optionally, add `scenarios/<id>/grading.json` with facts only the grader uses. It stays out of the run directory, so the agent never sees it:

```json
{
  "timeZone": "America/New_York",
  "assetRoles": { "logo.png": "the official logo" },
  "reference": ["Facts about the subject's canon that judges check the page's faithfulness against."]
}
```

`timeZone` lets judges check time claims in the page's copy (including daylight saving), `assetRoles` tells the asset judge which file is the official logo, and `reference` lists canon facts, such as a melody's notes, to check the page against.

## Known limitations

- Judges are LLMs and therefore noisy. Compare runs graded by the same judge model, and grade a run more than once before trusting a small difference.
- Claude judging Claude may be biased. The judge backend is one function, so an OpenRouter or other-provider judge is a small addition.
- Judges can't listen: sound is recorded through Web Audio and judged from spectrograms, measurements and detected notes. `<audio>` and `<video>` elements aren't recorded yet. Without a feature tour from the agent, the grader finds sounds by pressing every control once, which can miss interactions that need a sequence.
- Motion is judged from still frames, not video.
