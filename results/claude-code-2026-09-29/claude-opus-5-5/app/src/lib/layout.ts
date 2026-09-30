import { useMediaQuery } from './useMediaQuery'

/*
 * Two independent layout decisions. CSS repeats these queries (search for
 * them by name in comments); keep both sides in sync.
 *
 * LANDSCAPE: composition. Landscape screens put the characters on the left
 *   and the clock in a column on the right; everything else stacks (logo
 *   top, subject middle, clock bottom). CSS only.
 *
 * ROOMY: whether there's space to keep the ocarina open as a bar, places in
 *   the top bar and "Add to calendar" under the clock. Otherwise the ocarina
 *   folds into a button that opens a sheet (which then also holds places),
 *   and the calendar becomes an icon in the top bar. Landscape phones are
 *   landscape but not roomy.
 */
export const LANDSCAPE_QUERY = '(min-aspect-ratio: 5/4)'
export const ROOMY_QUERY = '(min-width: 60rem) and (min-height: 34rem) and (min-aspect-ratio: 5/4)'

export const useRoomyLayout = () => useMediaQuery(ROOMY_QUERY)
