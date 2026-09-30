# OpenCode: Space Bunny Free, DeepSeek V4.1 Flash and GLM 5.3 Flash results — September 30, 2026

One unattended run each of Space Bunny Free, DeepSeek V4.1 Flash and GLM 5.3 Flash on `ocarina-remake`, using OpenCode with the models served by OpenCode Zen at `--variant max`. All three agents exited successfully. Each run was graded once with three independent `opus` judges. They are [V1](../../README.md#versions) runs.

| Model | Total / 100 | Countdown / 10 | Hygiene / 15 | Experience / 35 | Codebase / 15 | Process / 25 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [Space Bunny Free](space-bunny-free/report/REPORT.md) | 73 | 10 | 15 | 20.9 | 8.6 | 18.5 |
| [DeepSeek V4.1 Flash](deepseek-v4.1-flash/report/REPORT.md) | 70.2 | 10 | 15 | 21.4 | 9 | 14.8 |
| [GLM 5.3 Flash](glm-5.3-flash/report/REPORT.md) | 67.8 | 9.5 | 15 | 19.8 | 10.1 | 13.4 |

| Model | Run time | Uncached input | Cache reads | Output, including reasoning | Reasoning | Total tokens | Cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Space Bunny Free | 2 h 13 min 11 s | 673,753 | 59,435,708 | 246,920 | 91,785 | 60,356,381 | $0 |
| DeepSeek V4.1 Flash | 51 min 9 s | 469,316 | 19,686,982 | 160,558 | 90,570 | 20,316,856 | $0.45 |
| GLM 5.3 Flash | 25 min 23 s | 253,050 | 5,294,080 | 62,488 | 37,828 | 5,609,618 | $0.23 |

Costs are OpenCode's own figures at its provider's prices; Space Bunny Free was a free model. Cache writes were zero in all three transcripts. OpenCode counted 304, 149 and 72 model calls. Run time measures agent launch to exit and excludes setup and grading. Judge usage is excluded.

## What the judges found

- **Space Bunny Free** built a gold Triforce "Gate of Time" dial whose hands close on midnight, and a playable ocarina. Its process scored highest of all V1 runs: four Playwright suites against the production build (kept in `verification/`, outside the app), fold-fit checks at eight sizes, and repeated type-check, lint and build runs. The Cinzel digits shift width every second, and the code has many confidently wrong comments and an ocarina pitch bug.
- **DeepSeek V4.1 Flash** made an elegant page with a pointer-following Navi and a playable Song of Time. Its countdown tiles also shift width, and the code keeps a second hardcoded copy of the target instant. It verified with repeated lint, build and type-check runs and a Playwright script covering the `<time>` contract and a live zero-crossing.
- **GLM 5.3 Flash** set a gold countdown over the dimmed Great Deku Tree, with a night-to-dawn crossfade to Link on Epona when the countdown ends. Its verification caught a ticker that fired once and stopped, and a malformed ISO duration, and it fixed and re-checked both. The countdown lost half a point for horizontal overflow on a 390px phone.

See each report for the criterion-level evidence.

## Conditions and limits

- Benchmark `v1`. OpenCode ran with the normal user configuration; setup added only the [image window](../../README.md#image-limits) plugin, which kept the newest 13–25 images in context. OpenCode Zen can route one model to different providers.
- DeepSeek ran without `--thinking`, before the preset asked for reasoning, so the process judge saw only its messages and tool calls. GLM and Space Bunny ran with `--thinking`, and the judge read their reasoning.
- The DeepSeek run is a second attempt. The first stopped when its provider refused requests carrying more than 30 images, which led to the image window. That attempt isn't published.
- Space Bunny Free is an unnamed "stealth" model that OpenCode Zen offered for free, so it may not stay available to repeat.
- OpenCode 1.18.33 was installed when the runs were archived; the transcripts don't record the version. The three runs didn't overlap.
- These are single runs with noisy LLM grading. The 2.8-point gap between Space Bunny and DeepSeek is not evidence of a reliable ranking.

## Artifacts

Each model folder contains the unchanged app source and lockfile, the brief and handover, `.bench/run.json`, the full report and score JSON, grader screenshots as WebP (quality 80, as on the results site), and `provenance.json` with the original run folder name, the transcript's SHA-256 and hashes of every app file and original PNG. Space Bunny's `verification/` folder is included and hashed under `otherFiles`. Local machine paths are normalized. The raw transcripts, the cleaned transcripts the judges read, the judges' PNG previews of the assets, and the apps' git history stay in the original run folders, which are needed for regrading.

To run an archived app, install its dependencies in the model's `app/` directory, then run its `dev`, `build` or `lint` script.

## Repeat the benchmark

```sh
npm run bench -- run --scenario ocarina-remake --label space-bunny-free-max --cmd 'opencode run --auto --format json --thinking --model opencode/space-bunny-free --variant max "$(cat BRIEF.md)"'
npm run bench -- run --scenario ocarina-remake --label deepseek-v4.1-flash-max --cmd 'opencode run --auto --format json --thinking --model opencode/deepseek-v4.1-flash --variant max "$(cat BRIEF.md)"'
npm run bench -- run --scenario ocarina-remake --label glm-5.3-flash-max --cmd 'opencode run --auto --format json --thinking --model opencode/glm-5.3-flash --variant max "$(cat BRIEF.md)"'
npm run bench -- grade runs/<run-folder>
```

The DeepSeek command adds `--thinking`, which the archived run didn't have.
