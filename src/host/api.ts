import type { RawPerformanceSummary } from '../core/performance'
import type {
  PlanRecord,
  SelfSubscriptionData,
} from '../core/subscription'
import type {
  CurrencyDisplayType,
  CurrencySettings,
  QuotaRow,
  TimeGranularity,
} from '../shared/types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code = 'request-failed') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface ServerStatus {
  currency: CurrencySettings
  enableDataExport: boolean
  dataExportDefaultTime: TimeGranularity
}

export interface SelfUser {
  id: number
  username: string
  displayName: string
  role: number
}

export interface QuotaQuery {
  startTimestamp: number
  endTimestamp: number
  granularity: TimeGranularity
  username?: string
  admin: boolean
}

const DISPLAY_TYPES: CurrencyDisplayType[] = ['USD', 'CNY', 'TOKENS', 'CUSTOM']

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function asDisplayType(value: unknown): CurrencyDisplayType {
  const normalized = typeof value === 'string' ? value.toUpperCase() : ''
  return DISPLAY_TYPES.includes(normalized as CurrencyDisplayType)
    ? (normalized as CurrencyDisplayType)
    : 'USD'
}

function asGranularity(value: unknown): TimeGranularity {
  return value === 'day' || value === 'week' ? value : 'hour'
}

function extractServerMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const record = body as Record<string, unknown>
  const error = record.error
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message
    if (typeof message === 'string' && message) return message
  }
  if (typeof record.message === 'string' && record.message) {
    return record.message
  }
  return undefined
}

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new ApiError('Server URL is required', 0, 'invalid-url')
  }
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i)
  if (schemeMatch && !/^https?$/i.test(schemeMatch[1] ?? '')) {
    throw new ApiError('Invalid server URL', 0, 'invalid-url')
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw new ApiError('Invalid server URL', 0, 'invalid-url')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiError('Invalid server URL', 0, 'invalid-url')
  }
  // Users often paste the dashboard URL instead of the server root. Strip the
  // well-known UI route while keeping self-hosted sub-path deployments intact.
  const uiRouteMatch = parsed.pathname.match(
    /\/(dashboard|console|wallet|login|pricing|topup)(\/|$)/i
  )
  const basePath = uiRouteMatch
    ? parsed.pathname.slice(0, uiRouteMatch.index)
    : parsed.pathname
  const path = basePath.replace(/\/+$/, '')
  return `${parsed.origin}${path}`
}

export class NewApiClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly userId?: number

  constructor(baseUrl: string, token: string, userId?: number) {
    this.baseUrl = baseUrl
    this.token = token
    this.userId = userId
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>
  ): string {
    const query = new URLSearchParams()
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === '') continue
        query.set(key, String(value))
      }
    }
    const suffix = query.toString()
    return `${this.baseUrl}${path}${suffix ? `?${suffix}` : ''}`
  }

  private async request(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<unknown> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
    }
    if (this.userId !== undefined) {
      headers['New-Api-User'] = String(this.userId)
    }

    try {
      const response = await fetch(this.buildUrl(path, params), {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      const text = await response.text()
      let body: unknown = null
      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          body = null
        }
      }

      if (!response.ok) {
        throw new ApiError(
          extractServerMessage(body) ?? `HTTP ${response.status}`,
          response.status
        )
      }

      if (
        body &&
        typeof body === 'object' &&
        (body as Record<string, unknown>).success === false
      ) {
        throw new ApiError(
          extractServerMessage(body) ?? 'Request failed',
          response.status
        )
      }

      if (body && typeof body === 'object' && 'data' in body) {
        return (body as Record<string, unknown>).data
      }
      return body
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timed out', 0, 'timeout')
      }
      const message = error instanceof Error ? error.message : 'Network error'
      throw new ApiError(message, 0, 'network')
    } finally {
      clearTimeout(timeout)
    }
  }

  async getStatus(): Promise<ServerStatus> {
    const data = (await this.request('/api/status')) as
      | Record<string, unknown>
      | null
    const record = data ?? {}
    return {
      currency: {
        quotaPerUnit: asNumber(record.quota_per_unit, 500_000),
        displayType: asDisplayType(record.quota_display_type),
        usdExchangeRate: asNumber(record.usd_exchange_rate, 1),
        customCurrencySymbol:
          typeof record.custom_currency_symbol === 'string' &&
          record.custom_currency_symbol
            ? record.custom_currency_symbol
            : '¤',
        customCurrencyExchangeRate: asNumber(
          record.custom_currency_exchange_rate,
          1
        ),
      },
      enableDataExport:
        record.enable_data_export === undefined
          ? true
          : asBoolean(record.enable_data_export),
      dataExportDefaultTime: asGranularity(record.data_export_default_time),
    }
  }

  async getSelf(): Promise<SelfUser> {
    const data = (await this.request('/api/user/self')) as
      | Record<string, unknown>
      | null
    if (!data) {
      throw new ApiError('Empty user response', 0, 'empty-response')
    }
    return {
      id: Number(data.id) || 0,
      username: typeof data.username === 'string' ? data.username : '',
      displayName:
        typeof data.display_name === 'string' ? data.display_name : '',
      role: Number(data.role) || 1,
    }
  }

  async getQuotaRows(query: QuotaQuery): Promise<QuotaRow[]> {
    const data = await this.request(query.admin ? '/api/data' : '/api/data/self', {
      start_timestamp: query.startTimestamp,
      end_timestamp: query.endTimestamp,
      default_time: query.granularity,
      username: query.admin ? query.username : undefined,
    })
    return Array.isArray(data) ? (data as QuotaRow[]) : []
  }

  async getSubscriptionSelf(): Promise<SelfSubscriptionData | null> {
    const data = await this.request('/api/subscription/self')
    if (Array.isArray(data)) {
      return {
        subscriptions: data as SelfSubscriptionData['subscriptions'],
        all_subscriptions: data as SelfSubscriptionData['all_subscriptions'],
      }
    }
    if (data && typeof data === 'object') {
      return data as SelfSubscriptionData
    }
    return null
  }

  async getPlans(): Promise<PlanRecord[]> {
    const data = await this.request('/api/subscription/plans')
    return Array.isArray(data) ? (data as PlanRecord[]) : []
  }

  async getPerformanceSummary(hours = 24): Promise<RawPerformanceSummary | null> {
    const data = await this.request('/api/perf-metrics/summary', { hours })
    return data && typeof data === 'object'
      ? (data as RawPerformanceSummary)
      : null
  }
}

export interface ConnectionTestResult {
  user: SelfUser
  status: ServerStatus
}

export async function testConnection(
  baseUrlInput: string,
  token: string
): Promise<ConnectionTestResult> {
  const baseUrl = normalizeBaseUrl(baseUrlInput)
  const client = new NewApiClient(baseUrl, token.trim())
  const user = await client.getSelf()
  const authenticatedClient = new NewApiClient(baseUrl, token.trim(), user.id)
  const status = await authenticatedClient.getStatus()
  return { user, status }
}
