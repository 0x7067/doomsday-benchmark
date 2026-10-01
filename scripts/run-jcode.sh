#!/usr/bin/env bash
# Runs bench v1.1 on ocarina-remake with jcode as the harness:
# claude-opus-5-5 first, then claude-sonnet-5-5 if you confirm there's quota left.
# Usage: scripts/run-jcode.sh [opus|sonnet|both]   (default: both)
set -euo pipefail
cd "$(dirname "$0")/.."

# ~/.npmrc has an allow-scripts line that npm rejects in project installs.
NPMRC="$(mktemp -t npmrc-bench)"
grep -v allow-scripts ~/.npmrc > "$NPMRC" || true
export NPM_CONFIG_USERCONFIG="$NPMRC"
trap 'rm -f "$NPMRC"' EXIT

npm install --no-audit --no-fund
npx playwright install chromium

run_model() {
  local model="$1" label="$2"
  echo "=== $model ($label) ==="
  npm run bench -- run --scenario ocarina-remake --label "$label" --model "$model" \
    --cmd "jcode -p claude -m $model run --ndjson \"\$(cat BRIEF.md)\""
  local dir
  dir="$(ls -td runs/ocarina-remake_"$label"_* | head -1)"
  npm run bench -- grade "$dir"
}

which="${1:-both}"
if [[ "$which" == opus || "$which" == both ]]; then
  run_model claude-opus-5-5 jcode-opus-5.5
fi
if [[ "$which" == both ]]; then
  jcode usage -p claude || true
  read -r -p "Enough quota left for claude-sonnet-5-5? [y/N] " answer
  [[ "$answer" =~ ^[Yy] ]] || exit 0
fi
if [[ "$which" == sonnet || "$which" == both ]]; then
  run_model claude-sonnet-5-5 jcode-sonnet-5.5
fi
