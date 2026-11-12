import { resolveCurrency, formatQuota, formatStatValue } from '../shared/format'
import { dictionaries } from '../shared/i18n'
import type {
  CurrencySettings,
  DashboardErrorViewModel,
  DashboardFilters,
  DashboardPreferences,
  DashboardViewModel,
  Locale,
  ProfileSummary,
  QuotaRow,
  ThemeKind,
} from '../shared/types'
import {
  aggregateQuotaRows,
  buildStatCards,
  emptyCharts,
} from './aggregate'
import {
  buildPerformanceViewModel,
  type RawPerformanceSummary,
} from './performance'
import {
  buildSubscriptionViewModel,
  type PlanRecord,
  type SelfSubscriptionData,
} from './subscription'

export interface BuildViewModelInput {
  setupMode: boolean
  locale: Locale
  themeKind: ThemeKind
  profiles: ProfileSummary[]
  profile: ProfileSummary | null
  preferences: DashboardPreferences
  filters: DashboardFilters
  rows: QuotaRow[]
  currencySettings: CurrencySettings | undefined
  dataExportDisabled: boolean
  subscriptionData: SelfSubscriptionData | null
  plans: PlanRecord[]
  performance: RawPerformanceSummary | null
  loading: boolean
  busy: boolean
  updatedAt: number | null
  stale: boolean
  error: DashboardErrorViewModel | null
  setupError: DashboardErrorViewModel | null
}

export function buildDashboardViewModel(
  input: BuildViewModelInput
): DashboardViewModel {
  const currency = resolveCurrency(input.currencySettings)
  const strings = { ...dictionaries[input.locale] } as Record<string, string>

  if (input.setupMode) {
    return {
      setupMode: true,
      locale: input.locale,
      strings,
      themeKind: input.themeKind,
      profile: input.profile,
      profiles: input.profiles,
      preferences: input.preferences,
      filters: input.filters,
      stats: [],
      charts: emptyCharts(currency),
      subscription: null,
      performance: null,
      currency: currency.summary,
      usage24hQuotaText: formatQuota(0, currency, input.locale),
      usage24hCountText: formatStatValue(0, input.locale),
      dataExportDisabled: false,
      loading: false,
      busy: input.busy,
      updatedAt: null,
      stale: false,
      error: null,
      setupError: input.setupError,
    }
  }

  const aggregate = aggregateQuotaRows({
    rows: input.rows,
    filters: input.filters,
    currency,
    locale: input.locale,
  })

  const subscription = input.subscriptionData
    ? buildSubscriptionViewModel({
        data: input.subscriptionData,
        plans: input.plans,
        currency,
        locale: input.locale,
        siteUrl: input.profile ? `${input.profile.baseUrl}/wallet` : '',
      })
    : null

  const performance =
    input.profile?.isAdmin === true
      ? buildPerformanceViewModel(input.performance, input.locale)
      : null

  const nowSeconds = Math.floor(Date.now() / 1000)
  let quota24h = 0
  let count24h = 0
  for (const row of input.rows) {
    const createdAt = Number(row.created_at)
    if (!Number.isFinite(createdAt)) continue
    if (createdAt < nowSeconds - 86_400 || createdAt > nowSeconds + 3600) continue
    quota24h += Math.max(0, Number(row.quota) || 0)
    count24h += Math.max(0, Number(row.count) || 0)
  }

  return {
    setupMode: false,
    locale: input.locale,
    strings,
    themeKind: input.themeKind,
    profile: input.profile,
    profiles: input.profiles,
    preferences: input.preferences,
    filters: input.filters,
    stats: buildStatCards(aggregate.stats, currency, input.locale),
    charts: aggregate.charts,
    subscription,
    performance,
    currency: currency.summary,
    usage24hQuotaText: formatQuota(quota24h, currency, input.locale),
    usage24hCountText: formatStatValue(count24h, input.locale),
    dataExportDisabled: input.dataExportDisabled,
    loading: input.loading,
    busy: input.busy,
    updatedAt: input.updatedAt,
    stale: input.stale,
    error: input.error,
    setupError: input.setupError,
  }
}
