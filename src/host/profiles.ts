import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type {
  DashboardPreferences,
  DistributionChartType,
  ModelChartTab,
  ProfileSummary,
  ThemeMode,
  ThemeStyle,
  TimeGranularity,
} from '../shared/types'
import type { SelfUser } from './api'

const PROFILES_KEY = 'lyNewApi.profiles'
const ACTIVE_PROFILE_KEY = 'lyNewApi.activeProfileId'
const PREFERENCES_KEY = 'lyNewApi.preferences'
const TOKEN_SECRET_PREFIX = 'lyNewApi.token.'

export interface StoredProfile {
  id: string
  name: string
  baseUrl: string
  username?: string
  displayName?: string
  role: number
  lastUsedAt: number
}

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  distributionChart: 'bar',
  modelChart: 'trend',
  defaultDays: 1,
  defaultGranularity: 'hour',
  themeMode: 'auto',
  themeStyle: 'glass',
}

const ALLOWED_DAYS = [1, 7, 14, 29]

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'dark' || value === 'light'
}

function isThemeStyle(value: unknown): value is ThemeStyle {
  return value === 'glass' || value === 'pixel' || value === 'shadcn'
}

function isDistributionChart(value: unknown): value is DistributionChartType {
  return value === 'bar' || value === 'area'
}

function isModelChart(value: unknown): value is ModelChartTab {
  return value === 'trend' || value === 'proportion' || value === 'top'
}

function isGranularity(value: unknown): value is TimeGranularity {
  return value === 'hour' || value === 'day' || value === 'week'
}

export function loadPreferences(
  context: vscode.ExtensionContext
): DashboardPreferences {
  const stored = context.globalState.get<Partial<DashboardPreferences>>(
    PREFERENCES_KEY
  )
  if (!stored) return { ...DEFAULT_PREFERENCES }
  return {
    distributionChart: isDistributionChart(stored.distributionChart)
      ? stored.distributionChart
      : DEFAULT_PREFERENCES.distributionChart,
    modelChart: isModelChart(stored.modelChart)
      ? stored.modelChart
      : DEFAULT_PREFERENCES.modelChart,
    defaultDays:
      typeof stored.defaultDays === 'number' &&
      ALLOWED_DAYS.includes(stored.defaultDays)
        ? stored.defaultDays
        : DEFAULT_PREFERENCES.defaultDays,
    defaultGranularity: isGranularity(stored.defaultGranularity)
      ? stored.defaultGranularity
      : DEFAULT_PREFERENCES.defaultGranularity,
    themeMode: isThemeMode(stored.themeMode)
      ? stored.themeMode
      : DEFAULT_PREFERENCES.themeMode,
    themeStyle: isThemeStyle(stored.themeStyle)
      ? stored.themeStyle
      : DEFAULT_PREFERENCES.themeStyle,
  }
}

export async function savePreferences(
  context: vscode.ExtensionContext,
  preferences: DashboardPreferences
): Promise<void> {
  await context.globalState.update(PREFERENCES_KEY, preferences)
}

export class ProfileStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  list(): StoredProfile[] {
    const stored = this.context.globalState.get<StoredProfile[]>(PROFILES_KEY)
    return Array.isArray(stored) ? stored : []
  }

  get(id: string): StoredProfile | undefined {
    return this.list().find((profile) => profile.id === id)
  }

  getActiveId(): string | undefined {
    return this.context.globalState.get<string>(ACTIVE_PROFILE_KEY)
  }

  getActive(): StoredProfile | undefined {
    const activeId = this.getActiveId()
    const active = activeId ? this.get(activeId) : undefined
    if (active) return active
    // A stale active id (deleted profile, restored state) should not leave the
    // dashboard without a profile while other profiles still exist.
    return this.list()[0]
  }

  async setActive(id: string): Promise<void> {
    await this.context.globalState.update(ACTIVE_PROFILE_KEY, id)
  }

  async add(
    input: { name: string; baseUrl: string; token: string },
    user: SelfUser
  ): Promise<StoredProfile> {
    const profile: StoredProfile = {
      id: randomUUID(),
      name: input.name.trim() || user.username || input.baseUrl,
      baseUrl: input.baseUrl,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      lastUsedAt: Date.now(),
    }
    const profiles = [...this.list(), profile]
    await this.context.globalState.update(PROFILES_KEY, profiles)
    await this.context.secrets.store(TOKEN_SECRET_PREFIX + profile.id, input.token)
    await this.setActive(profile.id)
    return profile
  }

  async update(
    id: string,
    input: { name: string; baseUrl: string; token?: string },
    user: SelfUser
  ): Promise<StoredProfile | undefined> {
    const existing = this.get(id)
    if (!existing) return undefined
    const profiles = this.list().map((profile) =>
      profile.id === id
        ? {
            ...profile,
            name: input.name.trim() || user.displayName || user.username || input.baseUrl,
            baseUrl: input.baseUrl,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            lastUsedAt: Date.now(),
          }
        : profile
    )
    await this.context.globalState.update(PROFILES_KEY, profiles)
    if (input.token) {
      await this.context.secrets.store(TOKEN_SECRET_PREFIX + id, input.token)
    }
    return profiles.find((profile) => profile.id === id)
  }

  async updateUser(id: string, user: SelfUser): Promise<void> {
    const profiles = this.list().map((profile) =>
      profile.id === id
        ? {
            ...profile,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            lastUsedAt: Date.now(),
          }
        : profile
    )
    await this.context.globalState.update(PROFILES_KEY, profiles)
  }

  async touch(id: string): Promise<void> {
    const profiles = this.list().map((profile) =>
      profile.id === id ? { ...profile, lastUsedAt: Date.now() } : profile
    )
    await this.context.globalState.update(PROFILES_KEY, profiles)
  }

  async remove(id: string): Promise<void> {
    const remaining = this.list().filter((profile) => profile.id !== id)
    await this.context.globalState.update(PROFILES_KEY, remaining)
    await this.context.secrets.delete(TOKEN_SECRET_PREFIX + id)
    if (this.getActiveId() === id) {
      const next = remaining[0]
      await this.context.globalState.update(
        ACTIVE_PROFILE_KEY,
        next ? next.id : undefined
      )
    }
  }

  async getToken(id: string): Promise<string | undefined> {
    return this.context.secrets.get(TOKEN_SECRET_PREFIX + id)
  }

  toSummary(profile: StoredProfile): ProfileSummary {
    return {
      id: profile.id,
      name: profile.name,
      baseUrl: profile.baseUrl,
      username: profile.username,
      displayName: profile.displayName,
      role: profile.role,
      isAdmin: profile.role >= 10,
      lastUsedAt: profile.lastUsedAt,
    }
  }
}
