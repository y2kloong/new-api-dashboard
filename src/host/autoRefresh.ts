export const DEFAULT_AUTO_REFRESH_MINUTES = 5

/**
 * `0` (and any other non-positive or invalid value) disables auto refresh, so
 * the setting maps to `null` rather than to a zero-length interval.
 */
export function resolveAutoRefreshIntervalMs(minutes: number): number | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  return minutes * 60_000
}

/**
 * Data is due when the last successful refresh is at least one interval old.
 * A missing timestamp means the dashboard has never loaded. A timestamp in the
 * future means the system clock moved backwards (or the machine slept and the
 * clock was corrected), which must not freeze the schedule.
 */
export function isRefreshDue(
  lastUpdatedAt: number | null,
  intervalMs: number,
  now: number
): boolean {
  if (lastUpdatedAt === null) return true
  if (lastUpdatedAt > now) return true
  return now - lastUpdatedAt >= intervalMs
}
