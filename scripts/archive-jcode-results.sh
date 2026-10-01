#!/usr/bin/env bash
# Archives graded jcode runs into results/<batch>/<model>/ in the layout the
# results site reads: app/, BRIEF.md, HANDOVER.md, .bench/run.json, report/,
# plus a provenance.json. Mirrors the V1 archive batch layout.
# Usage: scripts/archive-jcode-results.sh <run-dir> ...
set -euo pipefail
cd "$(dirname "$0")/.."

batch="results/jcode-2026-10-01"
mkdir -p "$batch"

for run_dir in "$@"; do
  [ -f "$run_dir/report/score.json" ] || { echo "skip $run_dir (not graded)"; continue; }
  model="$(node -e "console.log(require('$PWD/$run_dir/report/score.json').card?.model || process.argv[1])" "$(basename "$run_dir" | cut -d_ -f2)")"
  dest="$batch/$model"
  rm -rf "$dest"; mkdir -p "$dest"
  cp -R "$run_dir/app" "$dest/app"
  rm -rf "$dest/app/node_modules" "$dest/app/dist" "$dest/app/.git" "$dest/app/test-results" "$dest/app/playwright-report"
  cp "$run_dir/BRIEF.md" "$run_dir/HANDOVER.md" "$dest/"
  mkdir -p "$dest/.bench"
  cp "$run_dir/.bench/run.json" "$dest/.bench/"
  cp -R "$run_dir/report" "$dest/report"
  # Provenance: original folder name and a hash of every app file.
  node - "$run_dir" "$dest" <<'EOF'
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const [runDir, dest] = process.argv.slice(2)
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name)
  return e.isDirectory() ? walk(p, base) : [path.relative(base, p)]
})
const appFiles = Object.fromEntries(walk(path.join(dest, 'app')).sort().map((rel) => [
  rel, crypto.createHash('sha256').update(fs.readFileSync(path.join(dest, 'app', rel))).digest('hex'),
]))
const transcript = path.join(runDir, '.bench', 'transcript.log')
fs.writeFileSync(path.join(dest, 'provenance.json'), JSON.stringify({
  run: path.basename(runDir),
  transcriptSha256: fs.existsSync(transcript) ? crypto.createHash('sha256').update(fs.readFileSync(transcript)).digest('hex') : null,
  appFiles,
}, null, 2) + '\n')
EOF
  echo "archived $(basename "$run_dir") -> $dest"
done
