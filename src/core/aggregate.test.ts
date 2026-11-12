import { describe, expect, it } from 'vitest'
import { resolveCurrency } from '../shared/format'
import type { DashboardFilters, QuotaRow } from '../shared/types'
import {
  aggregateQuotaRows,
  buildStatCards,
  calculateStats,
  emptyCharts,
} from './aggregate'
import { baseTimestamp, makeQuotaRows } from './__fixtures__/quotaRows'

const usdCurrency = resolveCurrency(undefined)

function makeFilters(overrides?: Partial<DashboardFilters>): DashboardFilters {
  return {
    presetDays: null,
    granularity: 'hour',
    startTimestamp: baseTimestamp,
    endTimestamp: baseTimestamp + 3 * 3600 - 1,
    ...overrides,
  }
}

describe('calculateStats', () => {
  it('sums every quota field', () => {
    const stats = calculateStats(makeQuotaRows(), makeFilters())
    expect(stats.totalQuota).toBe(3750)
    expect(stats.totalCount).toBe(18)
    expect(stats.totalTokens).toBe(7500)
    expect(stats.totalCacheReadTokens).toBe(1000)
    expect(stats.totalCacheCreationTokens).toBe(150)
    expect(stats.minutes).toBeCloseTo((3 * 3600 - 1) / 60, 6)
  })
})

describe('aggregateQuotaRows', () => {
  it('buckets rows by hour and model', () => {
    const { charts } = aggregateQuotaRows({
      rows: makeQuotaRows(),
      filters: makeFilters(),
      currency: usdCurrency,
      locale: 'en',
    })

    expect(charts.quota.buckets).toHaveLength(3)
    expect(charts.quota.series.map((series) => series.name)).toEqual([
      'gpt-5',
      'deepseek-flash',
      'Unknown',
    ])

    const deepseek = charts.quota.series.find(
      (series) => series.name === 'deepseek-flash'
    )
    expect(deepseek?.values).toEqual([0.003, 0, 0])

    const gpt = charts.quota.series.find((series) => series.name === 'gpt-5')
    expect(gpt?.values).toEqual([0, 0.004, 0])
  })

  it('computes count series, ranking and proportion', () => {
    const { charts } = aggregateQuotaRows({
      rows: makeQuotaRows(),
      filters: makeFilters(),
      currency: usdCurrency,
      locale: 'en',
    })

    const deepseek = charts.count.series.find(
      (series) => series.name === 'deepseek-flash'
    )
    expect(deepseek?.values).toEqual([15, 0, 0])
    expect(charts.ranking[0]).toEqual({
      name: 'deepseek-flash',
      value: 15,
      display: '15',
    })
    expect(charts.proportion).toHaveLength(3)
    expect(charts.count.total).toBe(18)
  })

  it('ignores rows outside the selected range', () => {
    const rows: QuotaRow[] = [
      {
        created_at: baseTimestamp - 3600,
        model_name: 'outside',
        count: 99,
        quota: 99,
      },
      ...makeQuotaRows(),
    ]
    const { stats } = aggregateQuotaRows({
      rows,
      filters: makeFilters(),
      currency: usdCurrency,
      locale: 'en',
    })
    expect(stats.totalCount).toBe(18)
  })

  it('localizes the unknown model label', () => {
    const { charts } = aggregateQuotaRows({
      rows: makeQuotaRows(),
      filters: makeFilters(),
      currency: usdCurrency,
      locale: 'zh',
    })
    expect(charts.quota.series.map((series) => series.name)).toContain('未知模型')
  })

  it('collapses extra models into Other', () => {
    const rows: QuotaRow[] = Array.from({ length: 15 }, (_value, index) => ({
      created_at: baseTimestamp,
      model_name: `model-${String(index).padStart(2, '0')}`,
      count: 10,
      quota: 1000,
    }))
    const { charts } = aggregateQuotaRows({
      rows,
      filters: makeFilters({
        endTimestamp: baseTimestamp + 3599,
      }),
      currency: usdCurrency,
      locale: 'en',
    })
    expect(charts.quota.series).toHaveLength(13)
    expect(charts.quota.series.at(-1)?.name).toBe('Other')
    expect(charts.quota.series.at(-1)?.values[0]).toBe(0.006)
  })

  it('handles an empty row set', () => {
    const { stats, charts } = aggregateQuotaRows({
      rows: [],
      filters: makeFilters(),
      currency: usdCurrency,
      locale: 'en',
    })
    expect(stats.totalQuota).toBe(0)
    expect(charts.quota.buckets).toHaveLength(3)
    expect(charts.quota.series).toEqual([])
    expect(charts.ranking).toEqual([])
  })
})

describe('buildStatCards', () => {
  it('builds the seven cards in site order', () => {
    const stats = calculateStats(makeQuotaRows(), makeFilters())
    const cards = buildStatCards(stats, usdCurrency, 'en')
    expect(cards.map((card) => card.key)).toEqual([
      'count',
      'quota',
      'tokens',
      'cacheRead',
      'cacheCreation',
      'avgRpm',
      'avgTpm',
    ])
    expect(cards[0]?.value).toBe('18')
    expect(cards[1]?.value).toBe('$0.0075')
  })
})

describe('emptyCharts', () => {
  it('returns zeroed charts', () => {
    const charts = emptyCharts(usdCurrency)
    expect(charts.quota.total).toBe(0)
    expect(charts.count.totalDisplay).toBe('0')
  })
})
