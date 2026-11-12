import { describe, expect, it } from 'vitest'
import { resolveCurrency } from '../shared/format'
import type { CurrencySettings } from '../shared/types'
import { buildPerformanceViewModel } from './performance'
import { buildSubscriptionViewModel } from './subscription'

const cnySettings: CurrencySettings = {
  quotaPerUnit: 500_000,
  displayType: 'CNY',
  usdExchangeRate: 7.3,
  customCurrencySymbol: '¤',
  customCurrencyExchangeRate: 1,
}

const nowSeconds = 1_794_383_379

const plans = [
  { plan: { id: 2, title: '基础套餐' } },
  { plan: { id: 3, title: 'vip套餐' } },
]

function makeData() {
  return {
    billing_preference: 'subscription_first',
    subscriptions: [
      {
        subscription: {
          id: 233,
          plan_id: 2,
          status: 'active',
          start_time: 1_789_628_029,
          end_time: 2_052_629_629,
          amount_total: 34_246_575,
          amount_used: 6_938_686,
          next_reset_time: 1_796_054_400,
        },
      },
    ],
    all_subscriptions: [
      {
        subscription: {
          id: 233,
          plan_id: 2,
          status: 'active',
          start_time: 1_789_628_029,
          end_time: 2_052_629_629,
          amount_total: 34_246_575,
          amount_used: 6_938_686,
          next_reset_time: 1_796_054_400,
        },
      },
      {
        subscription: {
          id: 120,
          plan_id: 3,
          status: 'active',
          start_time: 1_780_000_000,
          end_time: 1_794_000_000,
          amount_total: 1_000_000,
          amount_used: 1_000_000,
        },
      },
      {
        subscription: {
          id: 99,
          plan_id: 3,
          status: 'cancelled',
          start_time: 1_780_000_000,
          end_time: 1_800_000_000,
          amount_total: 0,
          amount_used: 0,
        },
      },
    ],
  }
}

describe('buildSubscriptionViewModel', () => {
  it('splits active and inactive subscriptions', () => {
    const view = buildSubscriptionViewModel({
      data: makeData(),
      plans,
      currency: resolveCurrency(cnySettings),
      locale: 'zh',
      siteUrl: 'https://example.com/wallet',
      nowSeconds,
    })

    expect(view.hasAny).toBe(true)
    expect(view.activeCount).toBe(1)
    expect(view.expiredCount).toBe(2)
    expect(view.cards[0]?.planTitle).toBe('基础套餐')
    expect(view.cards[0]?.remainingDays).toBe(2989)
    expect(view.cards[0]?.usedPercent).toBe(20)
    expect(view.cards[0]?.quotaTotalText).toBe('¥500.00')
    expect(view.cards[0]?.nextResetText).toBeTruthy()
    expect(view.billingPreferenceLabel).toBe('订阅优先')
  })

  it('marks cancelled and unlimited subscriptions', () => {
    const view = buildSubscriptionViewModel({
      data: makeData(),
      plans,
      currency: resolveCurrency(cnySettings),
      locale: 'en',
      siteUrl: '',
      nowSeconds,
    })
    const cancelled = view.expiredCards.find((card) => card.id === 99)
    expect(cancelled?.status).toBe('cancelled')
    expect(cancelled?.unlimited).toBe(true)
    expect(cancelled?.quotaTotalText).toBe('Unlimited')
  })

  it('returns an empty but available view when there is no subscription', () => {
    const view = buildSubscriptionViewModel({
      data: { all_subscriptions: [] },
      plans: [],
      currency: resolveCurrency(cnySettings),
      locale: 'en',
      siteUrl: '',
      nowSeconds,
    })
    expect(view.available).toBe(true)
    expect(view.hasAny).toBe(false)
    expect(view.cards).toEqual([])
  })
})

describe('buildPerformanceViewModel', () => {
  it('formats the admin performance strip', () => {
    const view = buildPerformanceViewModel(
      {
        summary: { success_rate: 99.9, avg_latency_ms: 1500, avg_tps: 1500 },
        models: [
          { model_name: 'gpt-5', success_rate: 100 },
          { model_name: 'deepseek-flash', success_rate: 65 },
        ],
      },
      'en'
    )
    expect(view?.successRateText).toBe('99.90%')
    expect(view?.latencyText).toBe('1.50s')
    expect(view?.throughputText).toBe('1.5K t/s')
    expect(view?.models[0]?.level).toBe('excellent')
    expect(view?.models[1]?.level).toBe('critical')
  })

  it('returns null without data', () => {
    expect(buildPerformanceViewModel(null, 'en')).toBeNull()
    expect(buildPerformanceViewModel({ models: [] }, 'en')).toBeNull()
  })
})
