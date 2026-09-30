/** Subtle indicator that the clock is running on a simulated ?now= value. */
export function SimBadge({ value }: { value: string | null }) {
  if (!value) return null
  return (
    <p className="sim-badge" title="Simulated clock from the ?now= query parameter">
      sim · {value}
    </p>
  )
}
