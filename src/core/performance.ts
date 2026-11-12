import {
  formatLatency,
  formatSuccessRate,
  formatThroughput,
  successRateLevel,
} from '../shared/format'
import type { Locale, PerformanceViewModel } from '../shared/types'

export interface RawPerformanceSummary {
  summary?: {
    success_rate?: number
    avg_latency_ms?: number
    avg_tps?: number
  }
  models?: Array<{
    model_name?: string
    success_rate?: number
  }>
}

const TOP_MODEL_LIMIT = 6

export function buildPerformanceViewModel(
  raw: RawPerformanceSummary | null | undefined,
  locale: Locale
): PerformanceViewModel | null {
  if (!raw) return null
  const models = Array.isArray(raw.models) ? raw.models : []
  const summary = raw.summary

  if (models.length === 0 && !summary) return null

  const successRate = Number(summary?.success_rate)
  return {
    successRateText: formatSuccessRate(successRate, locale),
    latencyText: formatLatency(Number(summary?.avg_latency_ms), locale),
    throughputText: formatThroughput(Number(summary?.avg_tps), locale),
    models: models.slice(0, TOP_MODEL_LIMIT).map((model) => {
      const rate = Number(model.success_rate)
      return {
        name: model.model_name || '—',
        successRateText: formatSuccessRate(rate, locale),
        level: successRateLevel(rate),
      }
    }),
  }
}
