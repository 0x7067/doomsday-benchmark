import { LAUNCH_AT } from '../../config/launch'
import { launchInLocalTime } from '../../lib/time/local-time'
import { CalendarButton } from './CalendarButton'
import './launch-details.css'

// Computed once: the launch instant and the visitor's zone don't change while the page is open.
const localLaunch = launchInLocalTime(LAUNCH_AT)

export function LaunchDetails({ withCalendar }: { withCalendar: boolean }) {
  return (
    <div className="launch-details">
      <p className="launch-details__date">
        November 5, 2026 <span className="launch-details__dot" aria-hidden="true" /> Midnight ET
      </p>
      {localLaunch && <p className="launch-details__local">{localLaunch} where you are</p>}
      {withCalendar && (
        <div className="launch-details__actions">
          <CalendarButton />
        </div>
      )}
    </div>
  )
}
