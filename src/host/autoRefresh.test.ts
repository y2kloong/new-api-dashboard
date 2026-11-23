import { describe, expect, it } from 'vitest'
import {
  isRefreshDue,
  resolveAutoRefreshIntervalMs,
} from './autoRefresh'

const MINUTE = 60_000

describe('resolveAutoRefreshIntervalMs', () => {
  it('converts minutes to milliseconds', () => {
    expect(resolveAutoRefreshIntervalMs(10)).toBe(10 * MINUTE)
    expect(resolveAutoRefreshIntervalMs(0.5)).toBe(30_000)
  })

  it('disables auto refresh for zero, negative and invalid values', () => {
    expect(resolveAutoRefreshIntervalMs(0)).toBeNull()
    expect(resolveAutoRefreshIntervalMs(-5)).toBeNull()
    expect(resolveAutoRefreshIntervalMs(Number.NaN)).toBeNull()
    expect(resolveAutoRefreshIntervalMs(Number.POSITIVE_INFINITY)).toBeNull()
  })
})

describe('isRefreshDue', () => {
  const interval = 10 * MINUTE
  const now = 1_700_000_000_000

  it('is due when the dashboard never loaded', () => {
    expect(isRefreshDue(null, interval, now)).toBe(true)
  })

  it('waits for a full interval', () => {
    expect(isRefreshDue(now - interval + 1, interval, now)).toBe(false)
    expect(isRefreshDue(now - interval, interval, now)).toBe(true)
    expect(isRefreshDue(now - 3 * interval, interval, now)).toBe(true)
  })

  it('is due when the stored timestamp is in the future', () => {
    expect(isRefreshDue(now + interval, interval, now)).toBe(true)
  })
})
