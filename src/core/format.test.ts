import { describe, expect, it } from 'vitest'
import {
  formatCompactNumber,
  formatLatency,
  formatQuota,
  formatStatValue,
  formatSuccessRate,
  formatThroughput,
  resolveCurrency,
} from '../shared/format'
import type { CurrencySettings } from '../shared/types'

const cnySettings: CurrencySettings = {
  quotaPerUnit: 500_000,
  displayType: 'CNY',
  usdExchangeRate: 7.3,
  customCurrencySymbol: '¤',
  customCurrencyExchangeRate: 1,
}

describe('resolveCurrency', () => {
  it('resolves CNY with the exchange rate', () => {
    const currency = resolveCurrency(cnySettings)
    expect(currency.summary.symbol).toBe('¥')
    expect(currency.exchangeRate).toBe(7.3)
  })

  it('resolves tokens without a symbol', () => {
    const currency = resolveCurrency({ ...cnySettings, displayType: 'TOKENS' })
    expect(currency.summary.kind).toBe('tokens')
    expect(currency.summary.symbol).toBe('')
  })

  it('falls back to USD', () => {
    const currency = resolveCurrency(undefined)
    expect(currency.summary.symbol).toBe('$')
    expect(currency.exchangeRate).toBe(1)
  })
})

describe('formatQuota', () => {
  it('converts quota units to CNY', () => {
    expect(formatQuota(34_246_575, resolveCurrency(cnySettings), 'en')).toBe(
      '¥500.00'
    )
  })

  it('converts quota units to USD', () => {
    const currency = resolveCurrency({ ...cnySettings, displayType: 'USD' })
    expect(formatQuota(500_000, currency, 'en')).toBe('$1.00')
  })

  it('prints raw token counts for token mode', () => {
    const currency = resolveCurrency({ ...cnySettings, displayType: 'TOKENS' })
    expect(formatQuota(500_000, currency, 'en')).toBe('500,000')
  })
})

describe('number helpers', () => {
  it('compacts long stat values', () => {
    expect(formatStatValue(12_345_678, 'en')).toBe('12.3M')
    expect(formatCompactNumber(1_200, 'en')).toBe('1.2K')
    expect(formatStatValue(42, 'en')).toBe('42')
  })

  it('formats latency, throughput and success rate', () => {
    expect(formatLatency(1500, 'en')).toBe('1.50s')
    expect(formatLatency(250, 'en')).toBe('250ms')
    expect(formatLatency(0, 'en')).toBe('—')
    expect(formatThroughput(1500, 'en')).toBe('1.5K t/s')
    expect(formatThroughput(9.5, 'en')).toBe('9.50 t/s')
    expect(formatSuccessRate(99.9, 'en')).toBe('99.90%')
  })
})
