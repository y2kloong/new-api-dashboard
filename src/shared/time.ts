import type { Locale, TimeGranularity } from './types'

const SECONDS_PER_DAY = 86_400

export interface TimeRange {
  startTimestamp: number
  endTimestamp: number
}

/**
 * Mirrors the site's rolling range: "1 day" means the last 24 hours, and the
 * end is padded by one hour so the current bucket is fully included.
 */
export function computeTimeRange(
  days: number,
  startTimestamp?: number,
  endTimestamp?: number
): TimeRange {
  const now = Math.floor(Date.now() / 1000)
  const end = endTimestamp ?? now + 3600
  const start = startTimestamp ?? end - days * SECONDS_PER_DAY
  return { startTimestamp: start, endTimestamp: end }
}

export function granularityForRangeDays(days: number): TimeGranularity {
  if (days <= 1) return 'hour'
  if (days >= 29) return 'week'
  return 'day'
}

export function startOfBucket(
  timestampSeconds: number,
  granularity: TimeGranularity
): number {
  const date = new Date(timestampSeconds * 1000)
  if (granularity === 'hour') {
    date.setMinutes(0, 0, 0)
  } else if (granularity === 'day') {
    date.setHours(0, 0, 0, 0)
  } else {
    const mondayOffset = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - mondayOffset)
    date.setHours(0, 0, 0, 0)
  }
  return Math.floor(date.getTime() / 1000)
}

function addBucket(timestampSeconds: number, granularity: TimeGranularity): number {
  const date = new Date(timestampSeconds * 1000)
  if (granularity === 'hour') date.setHours(date.getHours() + 1)
  else if (granularity === 'day') date.setDate(date.getDate() + 1)
  else date.setDate(date.getDate() + 7)
  return Math.floor(date.getTime() / 1000)
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

function shortDate(date: Date): string {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function bucketLabel(
  timestampSeconds: number,
  granularity: TimeGranularity
): string {
  const date = new Date(timestampSeconds * 1000)
  if (granularity === 'hour') {
    return `${shortDate(date)} ${pad2(date.getHours())}:00`
  }
  if (granularity === 'day') {
    return shortDate(date)
  }
  const weekEnd = new Date(date)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return `${shortDate(date)} - ${shortDate(weekEnd)}`
}

export interface TimeBucket {
  key: string
  label: string
  timestamp: number
}

/**
 * Builds every bucket between start and end (inclusive). Generating the full
 * range keeps empty periods visible instead of silently dropping them.
 */
export function generateBuckets(
  startTimestamp: number,
  endTimestamp: number,
  granularity: TimeGranularity,
  maxBuckets = 400
): TimeBucket[] {
  const firstBucket = startOfBucket(startTimestamp, granularity)
  const buckets: TimeBucket[] = []
  let cursor = firstBucket
  while (cursor <= endTimestamp && buckets.length < maxBuckets) {
    buckets.push({
      key: String(cursor),
      label: bucketLabel(cursor, granularity),
      timestamp: cursor,
    })
    const next = addBucket(cursor, granularity)
    if (next <= cursor) break
    cursor = next
  }
  if (buckets.length === 0) {
    buckets.push({
      key: String(firstBucket),
      label: bucketLabel(firstBucket, granularity),
      timestamp: firstBucket,
    })
  }
  return buckets
}

function intlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

export function formatDateTime(timestampSeconds: number, locale: Locale): string {
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) return '—'
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(timestampSeconds * 1000))
}

export function formatClock(timestampMs: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(timestampMs))
}

/** Value for an `<input type="datetime-local">`, in the user's local timezone. */
export function toDatetimeLocalValue(timestampSeconds: number): string {
  const date = new Date(timestampSeconds * 1000)
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function fromDatetimeLocalValue(value: string): number | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.floor(parsed.getTime() / 1000)
}
