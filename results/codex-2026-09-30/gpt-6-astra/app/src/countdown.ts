export const RELEASE = Date.parse("2026-11-05T00:00:00-05:00");

export function initialNow() {
  const value = new URLSearchParams(window.location.search).get("now");
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function remaining(now: number) {
  const total = Math.max(0, Math.ceil((RELEASE - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    total,
    values: [days, hours, minutes, seconds],
    duration:
      total === 0 ? "PT0S" : `P${days}DT${hours}H${minutes}M${seconds}S`,
  };
}
