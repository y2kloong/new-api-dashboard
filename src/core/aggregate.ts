import {
  formatInteger,
  formatNumber,
  formatQuota,
  formatStatValue,
  quotaToDisplayAmount,
  type ResolvedCurrency,
} from '../shared/format'
import { translate } from '../shared/i18n'
import { generateBuckets, startOfBucket, type TimeBucket } from '../shared/time'
import type {
  ChartSeriesViewModel,
  ChartViewModel,
  ChartsViewModel,
  DashboardFilters,
  Locale,
  QuotaRow,
  StatCardViewModel,
} from '../shared/types'

const MAX_SERIES = 12
const MAX_RANKING_ITEMS = 20

export interface DashboardStats {
  totalQuota: number
  totalCount: number
  totalTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  minutes: number
}

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function calculateStats(
  rows: QuotaRow[],
  filters: DashboardFilters
): DashboardStats {
  let totalQuota = 0
  let totalCount = 0
  let totalTokens = 0
  let totalCacheReadTokens = 0
  let totalCacheCreationTokens = 0

  for (const row of rows) {
    totalQuota += Math.max(0, toFiniteNumber(row.quota))
    totalCount += Math.max(0, toFiniteNumber(row.count))
    totalTokens += Math.max(0, toFiniteNumber(row.token_used))
    totalCacheReadTokens += Math.max(0, toFiniteNumber(row.cache_read_tokens))
    totalCacheCreationTokens += Math.max(
      0,
      toFiniteNumber(row.cache_creation_tokens)
    )
  }

  const minutes = Math.max(
    1,
    (filters.endTimestamp - filters.startTimestamp) / 60
  )

  return {
    totalQuota,
    totalCount,
    totalTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    minutes,
  }
}

interface ModelAccumulator {
  quotaByBucket: number[]
  countByBucket: number[]
}

function createAccumulator(bucketCount: number): ModelAccumulator {
  return {
    quotaByBucket: new Array<number>(bucketCount).fill(0),
    countByBucket: new Array<number>(bucketCount).fill(0),
  }
}

function rankedModelNames(
  totals: Map<string, number>,
  limit: number
): string[] {
  return [...totals.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1]
      return left[0].localeCompare(right[0])
    })
    .slice(0, limit)
    .map(([name]) => name)
}

function buildMetricSeries(
  buckets: TimeBucket[],
  accumulators: Map<string, ModelAccumulator>,
  totals: Map<string, number>,
  otherLabel: string,
  metric: 'quota' | 'count',
  convertValue: (value: number) => number
): ChartSeriesViewModel[] {
  const topNames = rankedModelNames(totals, MAX_SERIES)
  const topSet = new Set(topNames)
  const hasOther = accumulators.size > topSet.size
  const series: ChartSeriesViewModel[] = []

  const readValue = (accumulator: ModelAccumulator, index: number): number => {
    const values =
      metric === 'quota'
        ? accumulator.quotaByBucket
        : accumulator.countByBucket
    return values[index] ?? 0
  }

  for (const name of topNames) {
    const accumulator = accumulators.get(name)
    if (!accumulator) continue
    series.push({
      name,
      values: buckets.map((_bucket, index) =>
        convertValue(readValue(accumulator, index))
      ),
    })
  }

  if (hasOther) {
    const otherValues = buckets.map((_bucket, index) => {
      let sum = 0
      for (const [name, accumulator] of accumulators) {
        if (topSet.has(name)) continue
        sum += readValue(accumulator, index)
      }
      return convertValue(sum)
    })
    series.push({ name: otherLabel, values: otherValues })
  }

  return series
}

export interface AggregateResult {
  stats: DashboardStats
  charts: ChartsViewModel
}

export interface AggregateOptions {
  rows: QuotaRow[]
  filters: DashboardFilters
  currency: ResolvedCurrency
  locale: Locale
}

export function aggregateQuotaRows(options: AggregateOptions): AggregateResult {
  const { rows, filters, currency, locale } = options
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const unknownModelLabel = t('chart.unknownModel')
  const otherLabel = t('chart.other')

  const buckets = generateBuckets(
    filters.startTimestamp,
    filters.endTimestamp,
    filters.granularity
  )
  const bucketIndex = new Map<number, number>()
  buckets.forEach((bucket, index) => bucketIndex.set(bucket.timestamp, index))

  const accumulators = new Map<string, ModelAccumulator>()
  const quotaTotals = new Map<string, number>()
  const countTotals = new Map<string, number>()
  const rowsInRange: QuotaRow[] = []

  for (const row of rows) {
    const createdAt = toFiniteNumber(row.created_at)
    if (createdAt <= 0) continue
    const bucketStart = startOfBucket(createdAt, filters.granularity)
    const index = bucketIndex.get(bucketStart)
    if (index === undefined) continue
    rowsInRange.push(row)

    const modelName =
      typeof row.model_name === 'string' && row.model_name.trim()
        ? row.model_name.trim()
        : unknownModelLabel
    let accumulator = accumulators.get(modelName)
    if (!accumulator) {
      accumulator = createAccumulator(buckets.length)
      accumulators.set(modelName, accumulator)
    }

    const quota = Math.max(0, toFiniteNumber(row.quota))
    const count = Math.max(0, toFiniteNumber(row.count))
    accumulator.quotaByBucket[index] = (accumulator.quotaByBucket[index] ?? 0) + quota
    accumulator.countByBucket[index] = (accumulator.countByBucket[index] ?? 0) + count
    quotaTotals.set(modelName, (quotaTotals.get(modelName) ?? 0) + quota)
    countTotals.set(modelName, (countTotals.get(modelName) ?? 0) + count)
  }

  const stats = calculateStats(rowsInRange, filters)
  const toDisplayQuota = (quota: number) =>
    quotaToDisplayAmount(quota, currency)

  const quotaChart: ChartViewModel = {
    buckets: buckets.map((bucket) => ({ ...bucket })),
    series: buildMetricSeries(
      buckets,
      accumulators,
      quotaTotals,
      otherLabel,
      'quota',
      toDisplayQuota
    ),
    total: stats.totalQuota,
    totalDisplay: formatQuota(stats.totalQuota, currency, locale),
  }

  const countChart: ChartViewModel = {
    buckets: buckets.map((bucket) => ({ ...bucket })),
    series: buildMetricSeries(
      buckets,
      accumulators,
      countTotals,
      otherLabel,
      'count',
      (value) => value
    ),
    total: stats.totalCount,
    totalDisplay: formatStatValue(stats.totalCount, locale),
  }

  const ranking = [...countTotals.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1]
      return left[0].localeCompare(right[0])
    })
    .slice(0, MAX_RANKING_ITEMS)
    .map(([name, value]) => ({
      name,
      value,
      display: formatStatValue(value, locale),
    }))

  const rankedCountModels = rankedModelNames(countTotals, MAX_SERIES)
  const rankedSet = new Set(rankedCountModels)
  const proportion = rankedCountModels.map((name) => ({
    name,
    value: countTotals.get(name) ?? 0,
  }))
  if (countTotals.size > rankedSet.size) {
    let otherTotal = 0
    for (const [name, value] of countTotals) {
      if (!rankedSet.has(name)) otherTotal += value
    }
    proportion.push({ name: otherLabel, value: otherTotal })
  }

  return {
    stats,
    charts: { quota: quotaChart, count: countChart, ranking, proportion },
  }
}

export function buildStatCards(
  stats: DashboardStats,
  currency: ResolvedCurrency,
  locale: Locale
): StatCardViewModel[] {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const minutes = Math.max(1, stats.minutes)
  const averageRpm = stats.totalCount / minutes
  const averageTpm = stats.totalTokens / minutes

  const quotaText = formatQuota(stats.totalQuota, currency, locale)

  return [
    {
      key: 'count',
      label: t('stats.totalCount'),
      description: t('stats.totalCountDesc'),
      value: formatStatValue(stats.totalCount, locale),
      fullValue: formatInteger(stats.totalCount, locale),
      tone: 'info',
    },
    {
      key: 'quota',
      label: t('stats.totalQuota'),
      description: t('stats.totalQuotaDesc'),
      value: quotaText,
      fullValue: quotaText,
      tone: 'success',
    },
    {
      key: 'tokens',
      label: t('stats.totalTokens'),
      description: t('stats.totalTokensDesc'),
      value: formatStatValue(stats.totalTokens, locale),
      fullValue: formatInteger(stats.totalTokens, locale),
      tone: 'chart4',
    },
    {
      key: 'cacheRead',
      label: t('stats.cacheRead'),
      description: t('stats.cacheReadDesc'),
      value: formatStatValue(stats.totalCacheReadTokens, locale),
      fullValue: formatInteger(stats.totalCacheReadTokens, locale),
      tone: 'chart3',
    },
    {
      key: 'cacheCreation',
      label: t('stats.cacheWrite'),
      description: t('stats.cacheWriteDesc'),
      value: formatStatValue(stats.totalCacheCreationTokens, locale),
      fullValue: formatInteger(stats.totalCacheCreationTokens, locale),
      tone: 'chart5',
    },
    {
      key: 'avgRpm',
      label: t('stats.avgRpm'),
      description: t('stats.avgRpmDesc'),
      value: formatNumber(averageRpm, locale, 2),
      fullValue: formatNumber(averageRpm, locale, 2),
      tone: 'chart2',
    },
    {
      key: 'avgTpm',
      label: t('stats.avgTpm'),
      description: t('stats.avgTpmDesc'),
      value: formatStatValue(averageTpm, locale),
      fullValue: formatInteger(averageTpm, locale),
      tone: 'warning',
    },
  ]
}

export function emptyCharts(currency: ResolvedCurrency): ChartsViewModel {
  const zeroDisplay =
    currency.summary.kind === 'tokens'
      ? '0'
      : `${currency.summary.symbol}0.00`
  const emptyChart: ChartViewModel = {
    buckets: [],
    series: [],
    total: 0,
    totalDisplay: zeroDisplay,
  }
  return {
    quota: emptyChart,
    count: { ...emptyChart, totalDisplay: '0' },
    ranking: [],
    proportion: [],
  }
}
