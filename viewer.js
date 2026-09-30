// The results viewer: a leaderboard of every graded run, and a full-screen
// view of one run's site with its scores and report. Data comes from
// runs.json, written by `npm run bench -- site`.

const $ = (selector) => document.querySelector(selector)

const leaderboard = $('#leaderboard')
const viewer = $('#viewer')
const frame = $('#run-frame')
const toggle = $('#details-toggle')
const panel = $('#details')
const dialog = $('#report-dialog')

/** Category colours follow the order of the score card. */
const CATEGORY_COLORS = ['var(--c-countdown)', 'var(--c-hygiene)', 'var(--c-experience)', 'var(--c-code)', 'var(--c-process)']

let runs = []
let current = null

main()

async function main() {
  // GitHub Pages lets browsers cache files for 10 minutes; revalidate so new runs show up right after a publish.
  const data = await fetch('runs.json', { cache: 'no-cache' }).then((response) => response.json())
  runs = data.runs
  $('#generated').textContent = `Results generated ${formatDate(data.generatedAt)}.`
  renderLeaderboard()
  window.addEventListener('hashchange', route)
  route()
}

function route() {
  const params = new URLSearchParams(location.hash.slice(1))
  const run = runs.find((r) => r.id === params.get('run'))
  if (run) showRun(run, params.get('now'))
  else showLeaderboard()
}

function showLeaderboard() {
  current = null
  frame.removeAttribute('src')
  closePanel()
  if (dialog.open) dialog.close()
  viewer.hidden = true
  leaderboard.hidden = false
  document.title = 'Doomsday Benchmark'
}

function showRun(run, now) {
  const appUrl = `runs/${run.id}/app/index.html${now ? `?now=${encodeURIComponent(now)}` : ''}`
  if (current !== run) closePanel()
  current = run
  leaderboard.hidden = true
  viewer.hidden = false
  frame.hidden = !run.hasApp
  $('#no-app').hidden = run.hasApp
  if (run.hasApp && frame.getAttribute('src') !== appUrl) frame.src = appUrl
  $('#open-site').href = appUrl
  $('#fab-score').textContent = formatPoints(run.score.total)
  $('#details-body').innerHTML = detailsHtml(run)
  document.title = `${run.model} · Doomsday Benchmark`
}

function renderLeaderboard() {
  const byScenario = Map.groupBy(runs, (run) => run.scenario.id)
  $('#scenarios').innerHTML = [...byScenario.values()]
    .map((scenarioRuns) => {
      const { title, targetLabel } = scenarioRuns[0].scenario
      return `
        <section class="scenario">
          <h2>${escape(title)}</h2>
          <p class="scenario-target">Counting down to ${escape(targetLabel)}</p>
          ${legendHtml(scenarioRuns[0])}
          <ol class="runs">${scenarioRuns.map(runRowHtml).join('')}</ol>
        </section>`
    })
    .join('')
}

function runRowHtml(run, index) {
  const facts = [run.duration && formatDuration(run.duration.seconds), run.usage?.costUsd != null && `~${formatUsd(run.usage.costUsd)}`]
  return `
    <li>
      <a class="run-row" href="#run=${encodeURIComponent(run.id)}">
        <span class="rank">${index + 1}</span>
        <span class="run-name">
          <strong>${escape(run.model)}</strong>
          <span class="chips">${chipsHtml(run)}</span>
        </span>
        <span class="run-bar">${stackedBarHtml(run)}</span>
        <span class="run-total">${formatPoints(run.score.total)}<small>/${run.score.max}</small></span>
        <span class="run-facts">${facts.filter(Boolean).join(' · ')}</span>
        <span class="run-open" aria-hidden="true">View →</span>
      </a>
    </li>`
}

function chipsHtml(run) {
  const chips = [run.variant, run.harness, incomplete(run) && 'incomplete']
  return chips
    .filter(Boolean)
    .map((chip) => `<span class="chip${chip === 'incomplete' ? ' chip-warn' : ''}">${escape(chip)}</span>`)
    .join('')
}

function stackedBarHtml(run) {
  const segments = run.score.lines.map(
    (line, i) =>
      `<span style="width:${(line.points / run.score.max) * 100}%;background:${CATEGORY_COLORS[i]}" title="${escape(line.area)}: ${formatPoints(line.points)}/${line.max}"></span>`,
  )
  return `<span class="bar" role="img" aria-label="${formatPoints(run.score.total)} of ${run.score.max} points">${segments.join('')}</span>`
}

function legendHtml(run) {
  const items = run.score.lines.map((line, i) => `<li><span class="swatch" style="background:${CATEGORY_COLORS[i]}"></span>${escape(shortName(line.area))} <small>${line.max}</small></li>`)
  return `<ul class="legend">${items.join('')}</ul>`
}

function detailsHtml(run) {
  const target = Date.parse(run.scenario.target)
  const at = (offsetSeconds) => `#run=${encodeURIComponent(run.id)}&now=${encodeURIComponent(new Date(target + offsetSeconds * 1000).toISOString())}`
  const lines = run.score.lines
    .map(
      (line, i) => `
        <li>
          <span class="line-name">${escape(shortName(line.area))}<small>${escape(line.kind)}</small></span>
          <span class="line-points">${formatPoints(line.points)}<small>/${line.max}</small></span>
          <span class="meter"><span style="width:${(line.points / line.max) * 100}%;background:${CATEGORY_COLORS[i]}"></span></span>
        </li>`,
    )
    .join('')
  const facts = [
    ['Run time', run.duration ? formatDuration(run.duration.seconds) : 'not recorded'],
    ['Tokens', run.usage ? `${run.usage.tokens.output === null ? '≥ ' : ''}${formatTokens(run.usage.tokens.total)}` : 'not reported'],
    ['Est. cost', run.usage?.costUsd != null ? formatUsd(run.usage.costUsd) : 'not reported'],
    ['Judged by', run.judgeModel ?? 'automated checks only'],
  ]
  return `
    <p class="panel-eyebrow">${escape(run.scenario.title)}</p>
    <h2 class="panel-title">${escape(run.model)}</h2>
    <p class="chips">${chipsHtml(run)}</p>
    ${incomplete(run) ? `<p class="warning">${escape(incompleteReason(run))}</p>` : ''}
    <p class="panel-total"><strong>${formatPoints(run.score.total)}</strong> / ${run.score.max}</p>
    <ul class="lines">${lines}</ul>
    <dl class="facts">${facts.map(([term, value]) => `<div><dt>${term}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
    <p class="moments">Jump to:
      <a href="#run=${encodeURIComponent(run.id)}">Now</a>
      <a href="${at(-10)}">Final 10 seconds</a>
      <a href="${at(3_600)}">After launch</a>
    </p>`
}

function incomplete(run) {
  return run.exit !== null && (run.exit.code !== 0 || run.exit.timedOut)
}

function incompleteReason(run) {
  if (run.exit.timedOut) return 'Incomplete: the run hit the time limit before the agent finished.'
  return `Incomplete: the agent's process exited with code ${run.exit.code} before it finished.`
}

// Details panel and report dialog

toggle.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()))
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !panel.hidden && !dialog.open) {
    closePanel()
    toggle.focus()
  }
})
$('#open-report').addEventListener('click', openReport)
// Jumping to a moment should show it, not keep the panel over it.
panel.addEventListener('click', (event) => {
  if (event.target.closest('.moments a')) closePanel()
})
$('#close-report').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', (event) => {
  // A click on the backdrop lands on the dialog element itself.
  if (event.target === dialog) dialog.close()
})

function openPanel() {
  panel.hidden = false
  toggle.setAttribute('aria-expanded', 'true')
}

function closePanel() {
  panel.hidden = true
  toggle.setAttribute('aria-expanded', 'false')
}

async function openReport() {
  const body = $('#report-body')
  body.innerHTML = '<p class="loading">Loading the report…</p>'
  $('#report-title').textContent = `${current.model}: full report`
  dialog.showModal()
  // Generated by the site builder, which escapes any HTML inside the report text.
  body.innerHTML = await fetch(`runs/${current.id}/report.html`, { cache: 'no-cache' }).then((response) => response.text())
  for (const link of body.querySelectorAll('a[href]')) {
    link.target = '_blank'
    link.rel = 'noopener'
  }
  body.scrollTop = 0
}

// Formatting

function shortName(area) {
  return area.split(/[:,]| and /)[0].trim()
}

function formatPoints(points) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}

function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  return hours ? `${hours} h ${minutes} min` : `${minutes} min ${s % 60} s`
}

function formatTokens(count) {
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`
  if (count >= 1e3) return `${Math.round(count / 1e3)}K`
  return String(count)
}

function formatUsd(amount) {
  return amount >= 1 ? `$${amount.toFixed(2)}` : `$${amount.toFixed(amount >= 0.01 ? 3 : 4)}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function escape(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}
