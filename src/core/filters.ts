import { computeTimeRange, granularityForRangeDays } from '../shared/time'
import type {
  DashboardFilters,
  DashboardPreferences,
  ThemeMode,
  TimeGranularity,
} from '../shared/types'

export const TIME_RANGE_PRESETS = [1, 7, 14, 29] as const

const GRANULARITIES: TimeGranularity[] = ['hour', 'day', 'week']

function isGranularity(value: unknown): value is TimeGranularity {
  return GRANULARITIES.includes(value as TimeGranularity)
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'dark' || value === 'light'
}

export function buildDefaultPreferences(): DashboardPreferences {
  return {
    distributionChart: 'bar',
    modelChart: 'trend',
    defaultDays: 1,
    defaultGranularity: 'hour',
    themeMode: 'auto',
  }
}

export function buildDefaultFilters(
  preferences: DashboardPreferences
): DashboardFilters {
  const range = computeTimeRange(preferences.defaultDays)
  return {
    presetDays: (TIME_RANGE_PRESETS as readonly number[]).includes(
      preferences.defaultDays
    )
      ? preferences.defaultDays
      : null,
    granularity: preferences.defaultGranularity,
    ...range,
  }
}

export function filtersForPreset(days: number): DashboardFilters {
  const range = computeTimeRange(days)
  return {
    presetDays: days,
    granularity: granularityForRangeDays(days),
    ...range,
  }
}

/**
 * Filters arrive from the webview, so treat every field as untrusted and
 * normalise it before it reaches the API.
 */
export function sanitizeFilters(
  input: Partial<DashboardFilters> | undefined,
  fallback: DashboardFilters
): DashboardFilters {
  if (!input) return fallback
  const start = Number(input.startTimestamp)
  const end = Number(input.endTimestamp)
  const hasValidRange =
    Number.isFinite(start) && Number.isFinite(end) && start < end
  const presetDays = Number(input.presetDays)
  return {
    presetDays:
      Number.isFinite(presetDays) &&
      (TIME_RANGE_PRESETS as readonly number[]).includes(presetDays)
        ? presetDays
        : null,
    granularity: isGranularity(input.granularity)
      ? input.granularity
      : fallback.granularity,
    startTimestamp: hasValidRange ? Math.floor(start) : fallback.startTimestamp,
    endTimestamp: hasValidRange ? Math.floor(end) : fallback.endTimestamp,
    username:
      typeof input.username === 'string' && input.username.trim()
        ? input.username.trim()
        : undefined,
  }
}

export function sanitizePreferences(
  input: Partial<DashboardPreferences> | undefined,
  fallback: DashboardPreferences
): DashboardPreferences {
  if (!input) return fallback
  const defaultDays = Number(input.defaultDays)
  const next: DashboardPreferences = {
    distributionChart:
      input.distributionChart === 'bar' || input.distributionChart === 'area'
        ? input.distributionChart
        : fallback.distributionChart,
    modelChart:
      input.modelChart === 'trend' ||
      input.modelChart === 'proportion' ||
      input.modelChart === 'top'
        ? input.modelChart
        : fallback.modelChart,
    defaultDays: (TIME_RANGE_PRESETS as readonly number[]).includes(defaultDays)
      ? defaultDays
      : fallback.defaultDays,
    defaultGranularity: isGranularity(input.defaultGranularity)
      ? input.defaultGranularity
      : fallback.defaultGranularity,
    themeMode: isThemeMode(input.themeMode)
      ? input.themeMode
      : fallback.themeMode,
  }
  return next
}
