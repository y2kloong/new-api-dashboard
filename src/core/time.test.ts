import { describe, expect, it } from 'vitest'
import {
  bucketLabel,
  computeTimeRange,
  fromDatetimeLocalValue,
  generateBuckets,
  granularityForRangeDays,
  startOfBucket,
  toDatetimeLocalValue,
} from '../shared/time'
import { baseTimestamp } from './__fixtures__/quotaRows'

describe('computeTimeRange', () => {
  it('uses a rolling window padded by one hour', () => {
    const before = Math.floor(Date.now() / 1000)
    const range = computeTimeRange(1)
    const after = Math.floor(Date.now() / 1000)
    expect(range.endTimestamp).toBeGreaterThanOrEqual(before + 3600)
    expect(range.endTimestamp).toBeLessThanOrEqual(after + 3600)
    expect(range.endTimestamp - range.startTimestamp).toBe(86_400)
  })

  it('honours explicit boundaries', () => {
    expect(computeTimeRange(7, 100, 200)).toEqual({
      startTimestamp: 100,
      endTimestamp: 200,
    })
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

describe('datetime-local conversion', () => {
  it('round trips minute precision', () => {
    const value = toDatetimeLocalValue(baseTimestamp)
    expect(value).toBe('2026-01-05T00:00')
    expect(fromDatetimeLocalValue(value)).toBe(baseTimestamp)
  })

  it('rejects empty values', () => {
    expect(fromDatetimeLocalValue('')).toBeNull()
  })
})
