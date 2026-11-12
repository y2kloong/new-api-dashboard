/**
 * Types shared by the extension host and the webview. Keep this file free of
 * `vscode` and Node imports: the webview bundle imports it too.
 */

export type Locale = 'zh' | 'en'
export type ThemeKind = 'dark' | 'light' | 'high-contrast'
/** `auto` follows the editor colour theme; `dark` / `light` pin the dashboard. */
export type ThemeMode = 'auto' | 'dark' | 'light'
export type TimeGranularity = 'hour' | 'day' | 'week'
export type ModelChartTab = 'trend' | 'proportion' | 'top'
export type DistributionChartType = 'bar' | 'area'

export type CurrencyDisplayType = 'USD' | 'CNY' | 'TOKENS' | 'CUSTOM'

/**
 * One pre-aggregated row returned by `GET /api/data/self` (or `/api/data` for
 * administrators). The server buckets rows at its configured data-export
 * interval; the extension re-buckets them for display.
 */
export interface QuotaRow {
  created_at: number
  model_name?: string
  username?: string
  count?: number
  quota?: number
  token_used?: number
  cache_read_tokens?: number
  cache_creation_tokens?: number
}

export interface CurrencySettings {
  quotaPerUnit: number
  displayType: CurrencyDisplayType
  usdExchangeRate: number
  customCurrencySymbol: string
  customCurrencyExchangeRate: number
}

export interface CurrencySummary {
  kind: 'currency' | 'tokens'
  symbol: string
  label: string
}

export interface DashboardFilters {
  /** 1 / 7 / 14 / 29 when a quick preset is selected, null for a custom range. */
  presetDays: number | null
  granularity: TimeGranularity
  startTimestamp: number
  endTimestamp: number
  username?: string
}

export interface DashboardPreferences {
  distributionChart: DistributionChartType
  modelChart: ModelChartTab
  defaultDays: number
  defaultGranularity: TimeGranularity
  themeMode: ThemeMode
}

export type StatCardKey =
  | 'count'
  | 'quota'
  | 'tokens'
  | 'cacheRead'
  | 'cacheCreation'
  | 'avgRpm'
  | 'avgTpm'

export type StatTone =
  | 'info'
  | 'success'
  | 'chart2'
  | 'chart3'
  | 'chart4'
  | 'chart5'
  | 'warning'

export interface StatCardViewModel {
  key: StatCardKey
  label: string
  description: string
  value: string
  fullValue: string
  tone: StatTone
}

export interface ChartBucketViewModel {
  key: string
  label: string
  timestamp: number
}

export interface ChartSeriesViewModel {
  name: string
  values: number[]
}

export interface ChartViewModel {
  buckets: ChartBucketViewModel[]
  series: ChartSeriesViewModel[]
  total: number
  totalDisplay: string
}

export interface RankingItemViewModel {
  name: string
  value: number
  display: string
}

export interface ProportionItemViewModel {
  name: string
  value: number
}

export interface ChartsViewModel {
  /** Quota values are already converted to the site's display currency. */
  quota: ChartViewModel
  count: ChartViewModel
  ranking: RankingItemViewModel[]
  proportion: ProportionItemViewModel[]
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export interface SubscriptionCardViewModel {
  id: number
  planTitle: string
  status: SubscriptionStatus
  remainingDays: number
  endTimeText: string
  nextResetText: string | null
  quotaUsedText: string
  quotaTotalText: string
  quotaRemainingText: string
  usedPercent: number
  unlimited: boolean
}

export interface SubscriptionViewModel {
  available: boolean
  hasAny: boolean
  activeCount: number
  expiredCount: number
  cards: SubscriptionCardViewModel[]
  expiredCards: SubscriptionCardViewModel[]
  billingPreferenceLabel: string | null
  siteUrl: string
}

export interface PerformanceModelViewModel {
  name: string
  successRateText: string
  level: 'excellent' | 'good' | 'warning' | 'critical' | 'unknown'
}

export interface PerformanceViewModel {
  successRateText: string
  latencyText: string
  throughputText: string
  models: PerformanceModelViewModel[]
}

export interface ProfileSummary {
  id: string
  name: string
  baseUrl: string
  username?: string
  displayName?: string
  role: number
  isAdmin: boolean
  lastUsedAt: number
}

export interface DashboardErrorViewModel {
  message: string
  hint?: string
  code?: string
}

export interface DashboardViewModel {
  setupMode: boolean
  locale: Locale
  strings: Record<string, string>
  themeKind: ThemeKind
  profile: ProfileSummary | null
  profiles: ProfileSummary[]
  preferences: DashboardPreferences
  filters: DashboardFilters
  stats: StatCardViewModel[]
  charts: ChartsViewModel
  subscription: SubscriptionViewModel | null
  performance: PerformanceViewModel | null
  currency: CurrencySummary
  usage24hQuotaText: string
  usage24hCountText: string
  dataExportDisabled: boolean
  loading: boolean
  busy: boolean
  updatedAt: number | null
  stale: boolean
  error: DashboardErrorViewModel | null
  setupError: DashboardErrorViewModel | null
}

export interface ProfileInput {
  name: string
  baseUrl: string
  token: string
}

export type WebviewToHostMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'applyFilters'; filters: DashboardFilters }
  | { type: 'setPreferences'; preferences: Partial<DashboardPreferences> }
  | { type: 'switchProfile'; profileId: string }
  | { type: 'addProfile'; profile: ProfileInput }
  | { type: 'updateProfile'; profileId: string; profile: ProfileInput }
  | { type: 'testProfile'; baseUrl: string; token: string }
  | { type: 'deleteProfile'; profileId: string }
  | { type: 'openSetup' }
  | { type: 'openDashboard' }
  | { type: 'openExternal'; url: string }

export type HostToWebviewMessage =
  | { type: 'state'; state: DashboardViewModel }
  | {
      type: 'testResult'
      ok: boolean
      message: string
      username?: string
      role?: number
    }
  | { type: 'toast'; kind: 'success' | 'error' | 'info'; message: string }
