import type {
  CurrencySettings,
  CurrencySummary,
  Locale,
} from './types'

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  quotaPerUnit: 500_000,
  displayType: 'USD',
  usdExchangeRate: 1,
  customCurrencySymbol: '¤',
  customCurrencyExchangeRate: 1,
}

export interface ResolvedCurrency {
  summary: CurrencySummary
  quotaPerUnit: number
  /** Multiplier from USD to the displayed currency; 1 for tokens. */
  exchangeRate: number
}

export function resolveCurrency(
  settings: CurrencySettings | undefined
): ResolvedCurrency {
  const config = settings ?? DEFAULT_CURRENCY_SETTINGS
  const quotaPerUnit =
    config.quotaPerUnit > 0 ? config.quotaPerUnit : DEFAULT_CURRENCY_SETTINGS.quotaPerUnit

  if (config.displayType === 'TOKENS') {
    return {
      summary: { kind: 'tokens', symbol: '', label: 'TOKENS' },
      quotaPerUnit,
      exchangeRate: 1,
    }
  }
  if (config.displayType === 'CNY') {
    const rate =
      config.usdExchangeRate > 0 ? config.usdExchangeRate : 1
    return {
      summary: { kind: 'currency', symbol: '¥', label: 'CNY' },
      quotaPerUnit,
      exchangeRate: rate,
    }
  }
  if (config.displayType === 'CUSTOM') {
    const rate =
      config.customCurrencyExchangeRate > 0
        ? config.customCurrencyExchangeRate
        : 1
    return {
      summary: {
        kind: 'currency',
        symbol: config.customCurrencySymbol || '¤',
        label: 'CUSTOM',
      },
      quotaPerUnit,
      exchangeRate: rate,
    }
  }
  return {
    summary: { kind: 'currency', symbol: '$', label: 'USD' },
    quotaPerUnit,
    exchangeRate: 1,
  }
}

export function quotaToDisplayAmount(
  quota: number,
  currency: ResolvedCurrency
): number {
  if (currency.summary.kind === 'tokens') return quota
  return (quota / currency.quotaPerUnit) * currency.exchangeRate
}

function intlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

export function formatNumber(
  value: number,
  locale: Locale,
  maximumFractionDigits = 2
): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits,
  }).format(value)
}

export function formatInteger(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactNumber(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(intlLocale(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatFixed(
  value: number,
  locale: Locale,
  digits: number
): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/**
 * Stat tiles keep the full value when it is short and compact it otherwise,
 * matching the density of the original dashboard.
 */
export function formatStatValue(value: number, locale: Locale): string {
  const fullValue = formatNumber(value, locale)
  return fullValue.length > 7 ? formatCompactNumber(value, locale) : fullValue
}

export function formatPercent(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumber(value, locale, 2)}%`
}

export function formatQuota(
  quota: number,
  currency: ResolvedCurrency,
  locale: Locale,
  options?: { compact?: boolean }
): string {
  if (!Number.isFinite(quota)) return '—'
  const amount = quotaToDisplayAmount(quota, currency)

  if (currency.summary.kind === 'tokens') {
    if (options?.compact) return formatCompactNumber(amount, locale)
    return formatInteger(amount, locale)
  }

  const formatter = new Intl.NumberFormat(intlLocale(locale), {
    notation: options?.compact ? 'compact' : 'standard',
    minimumFractionDigits: options?.compact ? 0 : Math.abs(amount) >= 1 ? 2 : 4,
    maximumFractionDigits: options?.compact ? 1 : Math.abs(amount) >= 1 ? 2 : 4,
  })
  return `${currency.summary.symbol}${formatter.format(amount)}`
}

export function formatLatency(milliseconds: number, locale: Locale): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '—'
  if (milliseconds >= 1000) {
    return `${formatFixed(milliseconds / 1000, locale, 2)}s`
  }
  return `${Math.round(milliseconds)}ms`
}

export function formatThroughput(tokensPerSecond: number, locale: Locale): string {
  if (!Number.isFinite(tokensPerSecond) || tokensPerSecond <= 0) return '—'
  if (tokensPerSecond >= 1000) {
    return `${formatFixed(tokensPerSecond / 1000, locale, 1)}K t/s`
  }
  return `${formatFixed(tokensPerSecond, locale, tokensPerSecond < 10 ? 2 : 1)} t/s`
}

export function formatSuccessRate(rate: number, locale: Locale): string {
  if (!Number.isFinite(rate)) return '—'
  return `${formatFixed(rate, locale, 2)}%`
}

export function successRateLevel(
  rate: number
): 'excellent' | 'good' | 'warning' | 'critical' | 'unknown' {
  if (!Number.isFinite(rate)) return 'unknown'
  if (rate >= 100) return 'excellent'
  if (rate >= 90) return 'good'
  if (rate >= 70) return 'warning'
  return 'critical'
}
