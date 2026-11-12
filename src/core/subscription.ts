import { formatQuota, type ResolvedCurrency } from '../shared/format'
import { translate } from '../shared/i18n'
import { formatDateTime } from '../shared/time'
import type { Locale, SubscriptionCardViewModel, SubscriptionViewModel } from '../shared/types'

export interface RawSubscription {
  id: number
  plan_id: number
  status: string
  start_time: number
  end_time: number
  amount_total?: number
  amount_used?: number
  next_reset_time?: number
}

export interface RawSubscriptionRecord {
  subscription?: RawSubscription
}

export interface SelfSubscriptionData {
  billing_preference?: string
  subscriptions?: RawSubscriptionRecord[]
  all_subscriptions?: RawSubscriptionRecord[]
}

export interface PlanRecord {
  plan?: {
    id?: number
    title?: string
  }
}

const PREFERENCE_KEYS = {
  subscription_first: 'preference.subscription_first',
  wallet_first: 'preference.wallet_first',
  subscription_only: 'preference.subscription_only',
  wallet_only: 'preference.wallet_only',
} as const

function extractSubscriptions(
  records: RawSubscriptionRecord[] | undefined
): RawSubscription[] {
  if (!Array.isArray(records)) return []
  return records
    .map((record) => record?.subscription)
    .filter((subscription): subscription is RawSubscription =>
      Boolean(subscription && Number.isFinite(subscription.id))
    )
}

function resolveStatus(
  subscription: RawSubscription,
  nowSeconds: number
): 'active' | 'expired' | 'cancelled' {
  if (subscription.status === 'cancelled') return 'cancelled'
  if (subscription.status === 'active' && subscription.end_time > nowSeconds) {
    return 'active'
  }
  return 'expired'
}

function buildCard(
  subscription: RawSubscription,
  planTitle: string,
  currency: ResolvedCurrency,
  locale: Locale,
  nowSeconds: number
): SubscriptionCardViewModel {
  const total = Math.max(0, Number(subscription.amount_total) || 0)
  const used = Math.max(0, Number(subscription.amount_used) || 0)
  const remaining = total > 0 ? Math.max(0, total - used) : 0
  const unlimited = total <= 0
  const usedPercent =
    total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 0
  const remainingDays = Math.max(
    0,
    Math.ceil((subscription.end_time - nowSeconds) / 86400)
  )
  const status = resolveStatus(subscription, nowSeconds)
  const nextResetTime = Number(subscription.next_reset_time) || 0

  return {
    id: subscription.id,
    planTitle,
    status,
    remainingDays,
    endTimeText: formatDateTime(subscription.end_time, locale),
    nextResetText:
      status === 'active' && nextResetTime > 0
        ? formatDateTime(nextResetTime, locale)
        : null,
    quotaUsedText: unlimited ? '—' : formatQuota(used, currency, locale),
    quotaTotalText: unlimited
      ? translate(locale, 'common.unlimited')
      : formatQuota(total, currency, locale),
    quotaRemainingText: unlimited ? '—' : formatQuota(remaining, currency, locale),
    usedPercent,
    unlimited,
  }
}

export interface BuildSubscriptionOptions {
  data: SelfSubscriptionData
  plans: PlanRecord[]
  currency: ResolvedCurrency
  locale: Locale
  siteUrl: string
  nowSeconds?: number
}

export function buildSubscriptionViewModel(
  options: BuildSubscriptionOptions
): SubscriptionViewModel {
  const { data, plans, currency, locale, siteUrl } = options
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000)

  const planTitles = new Map<number, string>()
  for (const record of plans) {
    const plan = record?.plan
    if (plan?.id && plan.title) planTitles.set(plan.id, plan.title)
  }

  const all = extractSubscriptions(
    data.all_subscriptions ?? data.subscriptions
  )
  const cards = all.map((subscription) =>
    buildCard(
      subscription,
      planTitles.get(subscription.plan_id) ?? '',
      currency,
      locale,
      nowSeconds
    )
  )

  const activeCards = cards
    .filter((card) => card.status === 'active')
    .sort((left, right) => right.remainingDays - left.remainingDays)
  const expiredCards = cards
    .filter((card) => card.status !== 'active')
    .sort((left, right) => right.id - left.id)

  const preference = data.billing_preference ?? ''
  const preferenceKey =
    PREFERENCE_KEYS[preference as keyof typeof PREFERENCE_KEYS] ?? null
  const billingPreferenceLabel = preference
    ? preferenceKey
      ? translate(locale, preferenceKey)
      : preference
    : null

  return {
    available: true,
    hasAny: cards.length > 0,
    activeCount: activeCards.length,
    expiredCount: expiredCards.length,
    cards: activeCards,
    expiredCards,
    billingPreferenceLabel,
    siteUrl,
  }
}
