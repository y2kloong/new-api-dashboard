/**
 * Manifest identifiers shared by the extension host. Keep these values in sync
 * with `package.json`: command ids, the activity bar container, its webview
 * views and the configuration keys all live in the manifest first.
 */
export const COMMAND_IDS = {
  openDashboard: 'newApiDashboard.openDashboard',
  refresh: 'newApiDashboard.refresh',
  manageProfiles: 'newApiDashboard.manageProfiles',
  showLogs: 'newApiDashboard.showLogs',
} as const

export const VIEW_IDS = {
  container: 'newApiDashboard',
  sidebar: 'newApiDashboard.sidebar',
  explorer: 'newApiDashboard.explorer',
  dashboard: 'newApiDashboard.dashboard',
} as const

export const SETTINGS_SECTION = 'newApiDashboard'
export const LEGACY_SETTINGS_SECTION = 'lyNewApi'

export const SETTING_NAMES = {
  autoRefreshMinutes: 'autoRefreshMinutes',
  statusBarEnabled: 'statusBar.enabled',
  language: 'language',
} as const

export const SETTING_IDS = {
  autoRefreshMinutes: `${SETTINGS_SECTION}.${SETTING_NAMES.autoRefreshMinutes}`,
  statusBarEnabled: `${SETTINGS_SECTION}.${SETTING_NAMES.statusBarEnabled}`,
  language: `${SETTINGS_SECTION}.${SETTING_NAMES.language}`,
} as const
