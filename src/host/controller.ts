import * as vscode from 'vscode'
import { buildDashboardViewModel } from '../core/viewModel'
import { sanitizePreferences } from '../core/filters'
import type { RawPerformanceSummary } from '../core/performance'
import type { PlanRecord, SelfSubscriptionData } from '../core/subscription'
import { resolveLocale, translate } from '../shared/i18n'
import {
  computeTimeRange,
  granularityForRangeDays,
} from '../shared/time'
import type {
  DashboardErrorViewModel,
  DashboardFilters,
  DashboardPreferences,
  DashboardViewModel,
  LanguagePreference,
  ProfileInput,
  ProfileSummary,
  QuotaRow,
  ThemeKind,
} from '../shared/types'
import {
  ApiError,
  NewApiClient,
  normalizeBaseUrl,
  testConnection,
  type SelfUser,
  type ServerStatus,
} from './api'
import {
  loadPreferences,
  savePreferences,
  ProfileStore,
  type StoredProfile,
} from './profiles'

const SNAPSHOT_PREFIX = 'lyNewApi.snapshot.'
const MAX_CACHED_ROWS = 5000

interface ProfileRuntime {
  rows: QuotaRow[]
  status: ServerStatus | null
  user: SelfUser | null
  subscription: SelfSubscriptionData | null
  plans: PlanRecord[]
  performance: RawPerformanceSummary | null
  filters: DashboardFilters
  updatedAt: number | null
  error: DashboardErrorViewModel | null
  stale: boolean
  dataExportDisabled: boolean
}

interface Snapshot {
  rows: QuotaRow[]
  filters: DashboardFilters
  updatedAt: number
}

export interface ConnectionTestOutcome {
  ok: boolean
  message: string
  username?: string
  role?: number
}

export class DashboardController implements vscode.Disposable {
  private readonly profileStore: ProfileStore
  private readonly runtimes = new Map<string, ProfileRuntime>()
  private readonly changeEmitter = new vscode.EventEmitter<void>()
  private readonly disposables: vscode.Disposable[] = []

  readonly onDidChange = this.changeEmitter.event

  private preferences: DashboardPreferences
  private setupRequested = false
  private setupError: DashboardErrorViewModel | null = null
  private loading = false
  private busy = false
  private panelVisible = false
  private readonly visibleSidebarViews = new Set<string>()

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel
  ) {
    this.profileStore = new ProfileStore(context)
    this.preferences = loadPreferences(context)
    this.loading = this.profileStore.list().length > 0

    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => this.notify()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('lyNewApi.language')) {
          this.notify()
        }
      })
    )
  }

  dispose(): void {
    this.changeEmitter.dispose()
    for (const disposable of this.disposables) disposable.dispose()
  }

  getLocale() {
    return resolveLocale(vscode.env.language, this.getLanguagePreference())
  }

  getLanguagePreference(): LanguagePreference {
    const configuration = vscode.workspace.getConfiguration('lyNewApi')
    const language = configuration.get<LanguagePreference>('language', 'auto')
    return language === 'zh' || language === 'en' ? language : 'auto'
  }

  async setLanguage(language: LanguagePreference): Promise<void> {
    const next = language === 'zh' || language === 'en' ? language : 'auto'
    // The language is an editor setting (not extension state) so that it also
    // applies to command titles and survives a profile reset.
    await vscode.workspace
      .getConfiguration('lyNewApi')
      .update('language', next, vscode.ConfigurationTarget.Global)
    this.notify()
  }

  private getThemeKind(): ThemeKind {
    const editorKind = vscode.window.activeColorTheme.kind
    // High-contrast stays high-contrast in every mode: ADR-0001 promises a
    // readable solid fallback and text contrast beats the user's theme pin.
    if (
      editorKind === vscode.ColorThemeKind.HighContrast ||
      editorKind === vscode.ColorThemeKind.HighContrastLight
    ) {
      return 'high-contrast'
    }
    if (this.preferences.themeMode === 'dark') return 'dark'
    if (this.preferences.themeMode === 'light') return 'light'
    return editorKind === vscode.ColorThemeKind.Light ? 'light' : 'dark'
  }

  private defaultFilters(): DashboardFilters {
    const days = this.preferences.defaultDays
    const range = computeTimeRange(days)
    return {
      presetDays: days,
      granularity: granularityForRangeDays(days),
      startTimestamp: range.startTimestamp,
      endTimestamp: range.endTimestamp,
    }
  }

  private getSnapshot(profileId: string): Snapshot | null {
    const snapshot = this.context.globalState.get<Snapshot>(
      SNAPSHOT_PREFIX + profileId
    )
    if (!snapshot || !Array.isArray(snapshot.rows) || !snapshot.filters) {
      return null
    }
    return snapshot
  }

  private async saveSnapshot(
    profileId: string,
    runtime: ProfileRuntime
  ): Promise<void> {
    if (runtime.updatedAt === null) return
    const snapshot: Snapshot = {
      rows: runtime.rows.slice(0, MAX_CACHED_ROWS),
      filters: runtime.filters,
      updatedAt: runtime.updatedAt,
    }
    await this.context.globalState.update(SNAPSHOT_PREFIX + profileId, snapshot)
  }

  private getRuntime(profileId: string): ProfileRuntime {
    const existing = this.runtimes.get(profileId)
    if (existing) return existing

    const snapshot = this.getSnapshot(profileId)
    const runtime: ProfileRuntime = {
      rows: snapshot?.rows ?? [],
      status: null,
      user: null,
      subscription: null,
      plans: [],
      performance: null,
      filters: snapshot?.filters ?? this.defaultFilters(),
      updatedAt: snapshot?.updatedAt ?? null,
      error: null,
      stale: snapshot !== null,
      dataExportDisabled: false,
    }
    this.runtimes.set(profileId, runtime)
    return runtime
  }

  private normalizeFilters(filters: DashboardFilters): DashboardFilters {
    const granularity =
      filters.granularity === 'day' || filters.granularity === 'week'
        ? filters.granularity
        : 'hour'
    if (filters.presetDays !== null) {
      const range = computeTimeRange(filters.presetDays)
      return {
        presetDays: filters.presetDays,
        granularity,
        startTimestamp: range.startTimestamp,
        endTimestamp: range.endTimestamp,
        username: filters.username,
      }
    }
    const start = Math.max(0, Math.floor(filters.startTimestamp))
    const end = Math.max(start + 1, Math.floor(filters.endTimestamp))
    return {
      presetDays: null,
      granularity,
      startTimestamp: start,
      endTimestamp: end,
      username: filters.username,
    }
  }

  getViewModel(): DashboardViewModel {
    const storedProfiles = this.profileStore.list()
    const profiles = storedProfiles.map((profile) =>
      this.profileStore.toSummary(profile)
    )
    const active = this.profileStore.getActive()
    const setupMode = profiles.length === 0 || this.setupRequested
    const runtime = active ? this.getRuntime(active.id) : null

    return buildDashboardViewModel({
      setupMode,
      locale: this.getLocale(),
      language: this.getLanguagePreference(),
      themeKind: this.getThemeKind(),
      profiles,
      profile: active ? this.profileStore.toSummary(active) : null,
      preferences: this.preferences,
      filters: runtime?.filters ?? this.defaultFilters(),
      rows: runtime?.rows ?? [],
      currencySettings: runtime?.status?.currency,
      dataExportDisabled: runtime?.dataExportDisabled ?? false,
      subscriptionData: runtime?.subscription ?? null,
      plans: runtime?.plans ?? [],
      performance: runtime?.performance ?? null,
      loading: this.loading,
      busy: this.busy,
      updatedAt: runtime?.updatedAt ?? null,
      stale: runtime?.stale ?? false,
      error: runtime?.error ?? null,
      setupError: this.setupError,
    })
  }

  getProfiles(): ProfileSummary[] {
    return this.profileStore
      .list()
      .map((profile) => this.profileStore.toSummary(profile))
  }

  getActiveProfile(): StoredProfile | undefined {
    return this.profileStore.getActive()
  }

  setPanelVisible(visible: boolean): void {
    this.panelVisible = visible
  }

  setSidebarVisible(viewId: string, visible: boolean): void {
    if (visible) {
      this.visibleSidebarViews.add(viewId)
    } else {
      this.visibleSidebarViews.delete(viewId)
    }
  }

  hasVisibleConsumer(): boolean {
    return this.panelVisible || this.visibleSidebarViews.size > 0
  }

  notify(): void {
    this.changeEmitter.fire()
  }

  private toErrorViewModel(error: unknown): DashboardErrorViewModel {
    const locale = this.getLocale()
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return {
          message: translate(locale, 'error.auth'),
          code: 'auth',
        }
      }
      if (error.status === 403) {
        return {
          message: translate(locale, 'error.forbidden'),
          code: 'forbidden',
        }
      }
      if (error.status === 404) {
        return {
          message: translate(locale, 'error.notFound'),
          hint: translate(locale, 'error.dataExportHint'),
          code: 'not-found',
        }
      }
      if (error.code === 'invalid-url') {
        return {
          message: translate(locale, 'error.invalidUrl'),
          code: 'invalid-url',
        }
      }
      if (error.code === 'network' || error.code === 'timeout') {
        return {
          message: translate(locale, 'error.network'),
          hint: error.message,
          code: 'network',
        }
      }
      return {
        message: error.message || translate(locale, 'error.generic'),
        code: 'api',
      }
    }
    if (error instanceof Error) {
      return { message: error.message, code: 'unknown' }
    }
    return { message: translate(locale, 'error.unknown'), code: 'unknown' }
  }

  async refresh(options?: { silent?: boolean }): Promise<void> {
    const active = this.profileStore.getActive()
    if (!active) {
      this.setupRequested = true
      this.loading = false
      this.notify()
      return
    }

    const token = await this.profileStore.getToken(active.id)
    if (!token) {
      this.setupRequested = true
      this.loading = false
      this.notify()
      return
    }

    const runtime = this.getRuntime(active.id)
    runtime.filters = this.normalizeFilters(runtime.filters)
    if (!options?.silent) {
      this.loading = true
      this.notify()
    }

    try {
      const anonymousClient = new NewApiClient(active.baseUrl, token)
      const [status, user] = await Promise.all([
        anonymousClient.getStatus(),
        anonymousClient.getSelf(),
      ])
      await this.profileStore.updateUser(active.id, user)
      await this.profileStore.touch(active.id)

      const client = new NewApiClient(active.baseUrl, token, user.id)
      const admin = user.role >= 10

      let rows: QuotaRow[] = []
      if (status.enableDataExport) {
        rows = await client.getQuotaRows({
          startTimestamp: runtime.filters.startTimestamp,
          endTimestamp: runtime.filters.endTimestamp,
          granularity: runtime.filters.granularity,
          username: runtime.filters.username,
          admin,
        })
      }

      const subscription = await this.withFallback(
        client.getSubscriptionSelf(),
        null
      )
      const plans = await this.withFallback(client.getPlans(), [])
      const performance = admin
        ? await this.withFallback(client.getPerformanceSummary(24), null)
        : null

      runtime.status = status
      runtime.user = user
      runtime.rows = rows.slice(0, MAX_CACHED_ROWS)
      runtime.subscription = subscription
      runtime.plans = plans
      runtime.performance = performance
      runtime.dataExportDisabled = !status.enableDataExport
      runtime.error = null
      runtime.stale = false
      runtime.updatedAt = Date.now()

      await this.saveSnapshot(active.id, runtime)
    } catch (error) {
      runtime.stale = runtime.rows.length > 0 || runtime.updatedAt !== null
      runtime.error = this.toErrorViewModel(error)
      const message =
        error instanceof Error ? error.message : String(error)
      this.output.appendLine(
        `[refresh] ${new Date().toISOString()} ${active.name}: ${message}`
      )
    } finally {
      this.loading = false
      this.notify()
    }
  }

  private async withFallback<T>(
    promise: Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await promise
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 403)
      ) {
        return fallback
      }
      throw error
    }
  }

  async applyFilters(filters: DashboardFilters): Promise<void> {
    const active = this.profileStore.getActive()
    if (!active) return
    const runtime = this.getRuntime(active.id)
    runtime.filters = this.normalizeFilters(filters)
    if (filters.presetDays !== null) {
      this.preferences = {
        ...this.preferences,
        defaultDays: filters.presetDays,
        defaultGranularity: runtime.filters.granularity,
      }
      await savePreferences(this.context, this.preferences)
    }
    this.notify()
    await this.refresh()
  }

  async setPreferences(
    patch: Partial<DashboardPreferences>
  ): Promise<void> {
    // The patch comes straight from the webview, so re-validate every field
    // instead of spreading it in: an unknown value would otherwise be persisted
    // and reused on the next launch.
    this.preferences = sanitizePreferences(patch, this.preferences)
    await savePreferences(this.context, this.preferences)
    this.notify()
  }

  async switchProfile(profileId: string): Promise<void> {
    if (!this.profileStore.get(profileId)) return
    await this.profileStore.setActive(profileId)
    this.setupRequested = false
    this.setupError = null
    this.notify()
    await this.refresh()
  }

  async testProfile(baseUrl: string, token: string): Promise<ConnectionTestOutcome> {
    const locale = this.getLocale()
    if (!baseUrl.trim() || !token.trim()) {
      return {
        ok: false,
        message: translate(locale, 'setup.required'),
      }
    }
    try {
      const result = await testConnection(baseUrl, token)
      return {
        ok: true,
        message: translate(locale, 'setup.testSuccess', {
          user: result.user.displayName || result.user.username,
        }),
        username: result.user.username,
        role: result.user.role,
      }
    } catch (error) {
      return {
        ok: false,
        message: this.toErrorViewModel(error).message,
      }
    }
  }

  async addProfile(input: ProfileInput): Promise<void> {
    const locale = this.getLocale()
    if (!input.baseUrl.trim() || !input.token.trim()) {
      this.setupError = {
        message: translate(locale, 'setup.required'),
        code: 'required',
      }
      this.notify()
      return
    }

    this.busy = true
    this.setupError = null
    this.notify()

    try {
      const baseUrl = normalizeBaseUrl(input.baseUrl)
      const result = await testConnection(baseUrl, input.token)
      const profile = await this.profileStore.add(
        { name: input.name, baseUrl, token: input.token.trim() },
        result.user
      )
      this.setupRequested = false
      this.setupError = null
      this.loading = true
      this.notify()
      void this.refresh()
      this.output.appendLine(
        `[profile] added ${profile.name} (${profile.baseUrl}) as ${result.user.username}`
      )
    } catch (error) {
      this.setupError = this.toErrorViewModel(error)
    } finally {
      this.busy = false
      this.notify()
    }
  }

  async updateProfile(profileId: string, input: ProfileInput): Promise<void> {
    const locale = this.getLocale()
    const existing = this.profileStore.get(profileId)
    if (!existing) return
    if (!input.baseUrl.trim()) {
      this.setupError = {
        message: translate(locale, 'setup.required'),
        code: 'required',
      }
      this.notify()
      return
    }

    this.busy = true
    this.setupError = null
    this.notify()

    try {
      const baseUrl = normalizeBaseUrl(input.baseUrl)
      const newToken = input.token.trim()
      const token =
        newToken || (await this.profileStore.getToken(profileId)) || ''
      if (!token) {
        this.setupError = {
          message: translate(locale, 'setup.required'),
          code: 'required',
        }
        return
      }

      const result = await testConnection(baseUrl, token)
      const baseUrlChanged = existing.baseUrl !== baseUrl
      const updated = await this.profileStore.update(
        profileId,
        {
          name: input.name,
          baseUrl,
          ...(newToken ? { token: newToken } : {}),
        },
        result.user
      )
      if (!updated) return

      this.setupError = null
      if (baseUrlChanged) {
        this.runtimes.delete(profileId)
        await this.context.globalState.update(
          SNAPSHOT_PREFIX + profileId,
          undefined
        )
      }
      this.output.appendLine(
        `[profile] updated ${updated.name} (${updated.baseUrl}) as ${result.user.username}`
      )
      if (this.profileStore.getActiveId() === profileId) {
        void this.refresh()
      }
    } catch (error) {
      this.setupError = this.toErrorViewModel(error)
    } finally {
      this.busy = false
      this.notify()
    }
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.profileStore.remove(profileId)
    this.runtimes.delete(profileId)
    await this.context.globalState.update(SNAPSHOT_PREFIX + profileId, undefined)
    if (this.profileStore.list().length === 0) {
      this.setupRequested = true
      this.notify()
      return
    }
    this.notify()
    await this.refresh()
  }

  openSetup(): void {
    this.setupRequested = true
    this.setupError = null
    this.notify()
  }

  openDashboard(): void {
    this.setupRequested = false
    this.notify()
    const active = this.profileStore.getActive()
    if (active) {
      const runtime = this.getRuntime(active.id)
      if (runtime.updatedAt === null) {
        void this.refresh()
      }
    }
  }

  /** Used by the status bar and the sidebar. */
  getStatusBarText(): { text: string; tooltip: string } {
    const viewModel = this.getViewModel()
    const locale = this.getLocale()
    if (viewModel.setupMode || !viewModel.profile) {
      return {
        text: '$(graph) NewAPI',
        tooltip: translate(locale, 'setup.title'),
      }
    }

    const activeCard = viewModel.subscription?.cards[0]
    const usage = viewModel.usage24hQuotaText
    const count = viewModel.usage24hCountText
    const remainingPercent = activeCard
      ? Math.max(0, 100 - activeCard.usedPercent)
      : null

    const text =
      remainingPercent !== null
        ? `$(graph) ${remainingPercent}% · ${usage}`
        : `$(graph) 24h ${usage} · ${count}`

    const lines: string[] = [
      `**${viewModel.profile.name}** · ${viewModel.profile.baseUrl}`,
    ]
    if (activeCard) {
      const planTitle = activeCard.planTitle
        ? `${activeCard.planTitle} · `
        : ''
      lines.push(
        `${planTitle}${translate(locale, 'subscription.id', {
          id: activeCard.id,
        })}`
      )
      lines.push(
        translate(locale, 'subscription.remainingDays', {
          n: activeCard.remainingDays,
        })
      )
      if (activeCard.nextResetText) {
        lines.push(
          `${translate(locale, 'subscription.nextReset')}: ${activeCard.nextResetText}`
        )
      }
      lines.push(
        `${translate(locale, 'subscription.remaining')}: ${activeCard.quotaRemainingText} / ${activeCard.quotaTotalText}`
      )
    } else {
      lines.push(translate(locale, 'statusbar.noSubscription'))
    }
    lines.push(
      `${translate(locale, 'sidebar.usage24h')}: ${usage} · ${count}`
    )
    if (viewModel.stale) {
      lines.push(`_${translate(locale, 'common.stale')}_`)
    }

    return { text, tooltip: lines.join('\n\n') }
  }
}
