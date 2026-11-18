import * as vscode from 'vscode'
import {
  LEGACY_SETTINGS_SECTION,
  SETTINGS_SECTION,
  SETTING_NAMES,
} from '../shared/identifiers'

const MIGRATED_SETTING_NAMES = [
  SETTING_NAMES.autoRefreshMinutes,
  SETTING_NAMES.statusBarEnabled,
  SETTING_NAMES.language,
] as const

type ConfigurationValueKey =
  | 'globalValue'
  | 'workspaceValue'
  | 'workspaceFolderValue'

async function migrateSettingAtScope(
  settingName: string,
  valueKey: ConfigurationValueKey,
  target: vscode.ConfigurationTarget,
  resource?: vscode.Uri
): Promise<void> {
  const legacyConfiguration = vscode.workspace.getConfiguration(
    LEGACY_SETTINGS_SECTION,
    resource
  )
  const legacyValue = legacyConfiguration.inspect(settingName)?.[valueKey]
  if (legacyValue === undefined) return

  const currentConfiguration = vscode.workspace.getConfiguration(
    SETTINGS_SECTION,
    resource
  )
  if (currentConfiguration.inspect(settingName)?.[valueKey] === undefined) {
    await currentConfiguration.update(settingName, legacyValue, target)
  }
  await legacyConfiguration.update(settingName, undefined, target)
}

/**
 * Settings moved from `lyNewApi.*` to `newApiDashboard.*`. Copy any value the
 * user had stored at the same scope and then clear the old key, so the old
 * namespace disappears from `settings.json` after one activation.
 */
export async function migrateLegacySettings(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? []

  for (const settingName of MIGRATED_SETTING_NAMES) {
    await migrateSettingAtScope(
      settingName,
      'globalValue',
      vscode.ConfigurationTarget.Global
    )
    await migrateSettingAtScope(
      settingName,
      'workspaceValue',
      vscode.ConfigurationTarget.Workspace
    )
    for (const folder of workspaceFolders) {
      await migrateSettingAtScope(
        settingName,
        'workspaceFolderValue',
        vscode.ConfigurationTarget.WorkspaceFolder,
        folder.uri
      )
    }
  }
}
