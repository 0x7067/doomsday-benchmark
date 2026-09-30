export const RELEASE_AT = Date.parse("2026-11-05T00:00:00-05:00");

export function getRemaining(now: number) {
  const total = Math.max(0, Math.ceil((RELEASE_AT - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    total,
    values: [days, hours, minutes, seconds],
    duration:
      total === 0 ? "PT0S" : `P${days}DT${hours}H${minutes}M${seconds}S`,
    description: `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`,
  };
}

export function createClock() {
  const parameter = new URLSearchParams(window.location.search).get("now");
  const requested = parameter ? Date.parse(parameter) : NaN;
  const startedAt = performance.now();
  const initial = Number.isFinite(requested) ? requested : Date.now();
  return Number.isFinite(requested)
    ? () => initial + performance.now() - startedAt
    : () => Date.now();
}
