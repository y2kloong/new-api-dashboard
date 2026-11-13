import { describe, expect, it } from 'vitest'
import {
  bucketLabel,
  computeTimeRange,
  endOfLocalDay,
  formatDateTimeMinute,
  generateBuckets,
  granularityForRangeDays,
  replaceLocalDay,
  replaceLocalTime,
  startOfBucket,
  startOfLocalDay,
} from '../shared/time'
import { baseTimestamp } from './__fixtures__/quotaRows'

describe('computeTimeRange', () => {
  it('starts at local midnight and ends at 23:59 on the last day', () => {
    const range = computeTimeRange(1)
    expect(range.startTimestamp).toBe(startOfLocalDay(Date.now() / 1000))
    expect(range.endTimestamp).toBe(endOfLocalDay(Date.now() / 1000))

    const start = new Date(range.startTimestamp * 1000)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)

    const end = new Date(range.endTimestamp * 1000)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
  })

  it('covers whole days for multi-day presets, today included', () => {
    const today = startOfLocalDay(Date.now() / 1000)
    const range = computeTimeRange(7)
    expect(range.startTimestamp).toBe(
      startOfLocalDay(today - 6 * 86_400)
    )
    expect(range.endTimestamp).toBe(endOfLocalDay(today))
  })

  it('honours explicit boundaries', () => {
    expect(computeTimeRange(7, 100, 200)).toEqual({
      startTimestamp: 100,
      endTimestamp: 200,
    })
  })
})

describe('local day boundaries', () => {
  it('floors to midnight', () => {
    const afternoon = Math.floor(new Date(2026, 0, 7, 15, 42, 31).getTime() / 1000)
    expect(startOfLocalDay(afternoon)).toBe(
      Math.floor(new Date(2026, 0, 7, 0, 0, 0).getTime() / 1000)
    )
  })

  it('ends at 23:59:59', () => {
    const morning = Math.floor(new Date(2026, 0, 7, 9, 10, 0).getTime() / 1000)
    expect(endOfLocalDay(morning)).toBe(
      Math.floor(new Date(2026, 0, 7, 23, 59, 59).getTime() / 1000)
    )
  })
})

describe('granularityForRangeDays', () => {
  it('maps quick ranges to the site granularity', () => {
    expect(granularityForRangeDays(1)).toBe('hour')
    expect(granularityForRangeDays(7)).toBe('day')
    expect(granularityForRangeDays(29)).toBe('week')
  })
})

describe('startOfBucket', () => {
  // 2026-01-07 is a Wednesday.
  const wednesdayAfternoon = Math.floor(
    new Date(2026, 0, 7, 15, 42, 31).getTime() / 1000
  )

  it('floors hours', () => {
    expect(startOfBucket(wednesdayAfternoon, 'hour')).toBe(
      Math.floor(new Date(2026, 0, 7, 15, 0, 0).getTime() / 1000)
    )
  })

  it('floors days to local midnight', () => {
    expect(startOfBucket(wednesdayAfternoon, 'day')).toBe(
      Math.floor(new Date(2026, 0, 7, 0, 0, 0).getTime() / 1000)
    )
  })

  it('floors weeks to Monday local midnight', () => {
    expect(startOfBucket(wednesdayAfternoon, 'week')).toBe(
      Math.floor(new Date(2026, 0, 5, 0, 0, 0).getTime() / 1000)
    )
  })
})

describe('generateBuckets', () => {
  it('creates every hour bucket in the range', () => {
    const start = Math.floor(new Date(2026, 0, 5, 0, 10, 0).getTime() / 1000)
    const end = start + 2 * 3600 + 1200
    const buckets = generateBuckets(start, end, 'hour')
    expect(buckets).toHaveLength(3)
    expect(buckets[0]?.label).toBe('01-05 00:00')
    expect(buckets[2]?.label).toBe('01-05 02:00')
  })

  it('creates day buckets across the range', () => {
    const end = baseTimestamp + 3 * 86_400
    const buckets = generateBuckets(baseTimestamp, end, 'day')
    expect(buckets).toHaveLength(4)
  })

  it('never returns an empty list', () => {
    const buckets = generateBuckets(baseTimestamp, baseTimestamp, 'week')
    expect(buckets).toHaveLength(1)
    expect(buckets[0]?.label).toBe('01-05 - 01-11')
  })
})

describe('bucketLabel', () => {
  it('formats hour, day and week labels', () => {
    expect(bucketLabel(baseTimestamp, 'hour')).toBe('01-05 00:00')
    expect(bucketLabel(baseTimestamp, 'day')).toBe('01-05')
    expect(bucketLabel(baseTimestamp, 'week')).toBe('01-05 - 01-11')
  })
})

describe('date-time picker helpers', () => {
  it('swaps the calendar day but keeps the time of day', () => {
    const start = Math.floor(new Date(2026, 0, 5, 0, 0, 0).getTime() / 1000)
    const next = replaceLocalDay(start, new Date(2026, 0, 9, 18, 30, 0))
    const date = new Date(next * 1000)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(9)
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
  })

  it('swaps the time but keeps the calendar day', () => {
    const end = Math.floor(new Date(2026, 0, 9, 0, 0, 0).getTime() / 1000)
    const next = replaceLocalTime(end, 23, 59)
    const date = new Date(next * 1000)
    expect(date.getDate()).toBe(9)
    expect(date.getHours()).toBe(23)
    expect(date.getMinutes()).toBe(59)
    expect(date.getSeconds()).toBe(0)
  })

  it('formats without seconds', () => {
    expect(formatDateTimeMinute(baseTimestamp, 'en')).toMatch(/00:00$/)
  })
})
