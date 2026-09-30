type IconProps = {
  size?: number
  className?: string
}

export function SpeakerIcon({ size = 18, muted = false, className }: IconProps & { muted?: boolean }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 9.5v5a1 1 0 0 0 1 1H8l4.5 3.5v-14L8 8.5H5.5a1 1 0 0 0-1 1Z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="m16 9.5 5 5m0-5-5 5" />
      ) : (
        <>
          <path d="M16 9a4.4 4.4 0 0 1 0 6" />
          <path d="M18.8 6.4a8.2 8.2 0 0 1 0 11.2" />
        </>
      )}
    </svg>
  )
}

export function ShareIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5v11" />
      <path d="m7.75 7.75 4.25-4.25 4.25 4.25" />
      <path d="M5.5 13.5v5.25a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V13.5" />
    </svg>
  )
}

export function ChevronIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  )
}

export function CalendarPlusIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.25" y="5.25" width="17.5" height="15.5" rx="2.6" />
      <path d="M3.5 10h17M8 3.5v3.6M16 3.5v3.6M12 12.5v5M9.5 15h5" />
    </svg>
  )
}
